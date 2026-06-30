#!/usr/bin/env tsx
/**
 * validate.ts
 *
 * Validates OOML class or attribute definition artefacts against a JSON Schema.
 *
 * Requirements: Node >=18, tsx  (npm install -g tsx)
 * Validator:    Ajv v6 (bundled with markdown-pdf; resolved at runtime)
 *
 * Usage:
 *   tsx validate.ts <path> [options]
 *
 * Arguments:
 *   <path>              A single .json file, or a directory.
 *                       Directory mode: validates every *.json file found
 *                       recursively inside it.
 *
 * Options:
 *   --schema <path>     Path to the OOML JSON Schema file.
 *                       Default: ../schema.json  (relative to this script).
 *   --no-recursive      In directory mode, do not recurse into subdirectories.
 *   --bail              Stop after the first file that fails validation.
 *   --quiet             Suppress per-file success lines; only print failures
 *                       and the final summary.
 *   --help, -h          Show this message.
 *
 * Exit codes:
 *   0  All validated files passed.
 *   1  One or more files failed validation, or a usage/IO error occurred.
 */

import * as fs   from "fs";
import * as path from "path";

// ---------------------------------------------------------------------------
// Ajv resolution
//
// We locate Ajv by walking up from known locations rather than requiring a
// local install, making the script portable across the project without an
// explicit npm install step.
// ---------------------------------------------------------------------------

function resolveAjv(): typeof import("ajv") {
    const candidates = [
        // Prefer a locally installed copy (e.g. after `npm install ajv`)
        path.resolve(process.cwd(), "node_modules", "ajv"),
        // Globally installed via npm
        path.join(
            process.env.npm_config_prefix ?? "",
            "lib", "node_modules", "ajv"
        ),
        // Bundled alongside other global tools present in this environment
        path.join(
            path.dirname(process.execPath),
            "..", "lib", "node_modules", "markdown-pdf", "node_modules", "ajv"
        ),
        "/home/claude/.npm-global/lib/node_modules/markdown-pdf/node_modules/ajv",
        "/usr/local/lib/node_modules/ajv",
        "/usr/lib/node_modules/ajv",
    ];

    for (const candidate of candidates) {
        if (fs.existsSync(path.join(candidate, "package.json"))) {
            try {
                // eslint-disable-next-line @typescript-eslint/no-var-requires
                return require(candidate);
            } catch {
                // try next
            }
        }
    }

    // Last resort: let Node resolve it normally (works when installed locally)
    try {
        return require("ajv");
    } catch {
        throw new Error(
            "Could not locate Ajv. Install it with:\n" +
            "  npm install ajv\n" +
            "or place it alongside this script."
        );
    }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ValidationResult {
    file: string;
    valid: boolean;
    errors: ErrorDetail[];
    parseError?: string;
}

interface ErrorDetail {
    path: string;
    message: string;
    keyword?: string;
    allowedValues?: unknown;
}

// ---------------------------------------------------------------------------
// Schema loading
// ---------------------------------------------------------------------------

function loadSchema(schemaPath: string): Record<string, unknown> {
    let raw: string;
    try {
        raw = fs.readFileSync(schemaPath, "utf8");
    } catch (e: unknown) {
        throw new Error(
            `Cannot read schema file "${schemaPath}": ${(e as Error).message}`
        );
    }

    let schema: Record<string, unknown>;
    try {
        schema = JSON.parse(raw);
    } catch (e: unknown) {
        throw new Error(
            `Schema file "${schemaPath}" is not valid JSON: ${(e as Error).message}`
        );
    }

    // Strip the $schema meta-schema URI if present.
    // Ajv v6 (draft-07) cannot resolve the draft/2020-12 meta-schema URI, but
    // the OOML schema.json only uses keywords that are draft-07 compatible, so
    // removing the $schema declaration is safe and lets Ajv compile it cleanly.
    if ("$schema" in schema) {
        const stripped = { ...schema };
        delete stripped["$schema"];
        return stripped;
    }

    return schema;
}

// ---------------------------------------------------------------------------
// File discovery
// ---------------------------------------------------------------------------

function collectJsonFiles(target: string, recursive: boolean): string[] {
    const stat = fs.statSync(target);

    if (stat.isFile()) {
        if (!target.endsWith(".json")) {
            console.warn(`Warning: "${target}" does not have a .json extension; validating anyway.`);
        }
        return [target];
    }

    if (!stat.isDirectory()) {
        throw new Error(`"${target}" is neither a file nor a directory.`);
    }

    const results: string[] = [];

    function walk(dir: string): void {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            const full = path.join(dir, entry.name);
            if (entry.isDirectory() && recursive) {
                walk(full);
            } else if (entry.isFile() && entry.name.endsWith(".json")) {
                results.push(full);
            }
        }
    }

    walk(target);
    results.sort();
    return results;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function normaliseErrors(
    rawErrors: import("ajv").ErrorObject[]
): ErrorDetail[] {
    return rawErrors.map((e) => {
        const detail: ErrorDetail = {
            path: e.dataPath || "(root)",
            message: e.message ?? e.keyword,
            keyword: e.keyword,
        };
        if (e.params && "allowedValues" in e.params) {
            detail.allowedValues = (e.params as { allowedValues: unknown }).allowedValues;
        }
        return detail;
    });
}

function validateFile(
    filePath: string,
    validate: ReturnType<import("ajv")["prototype"]["compile"]>
): ValidationResult {
    // Parse
    let data: unknown;
    try {
        const raw = fs.readFileSync(filePath, "utf8");
        data = JSON.parse(raw);
    } catch (e: unknown) {
        return {
            file: filePath,
            valid: false,
            errors: [],
            parseError: (e as Error).message,
        };
    }

    // Validate
    const valid = validate(data) as boolean;
    return {
        file: filePath,
        valid,
        errors: valid ? [] : normaliseErrors(validate.errors ?? []),
    };
}

// ---------------------------------------------------------------------------
// Output formatting
// ---------------------------------------------------------------------------

const RESET  = "\x1b[0m";
const RED    = "\x1b[31m";
const GREEN  = "\x1b[32m";
const YELLOW = "\x1b[33m";
const BOLD   = "\x1b[1m";
const DIM    = "\x1b[2m";

function isTTY(): boolean {
    return Boolean(process.stdout.isTTY);
}

function colour(text: string, code: string): string {
    return isTTY() ? `${code}${text}${RESET}` : text;
}

function printResult(result: ValidationResult, quiet: boolean): void {
    const rel = path.relative(process.cwd(), result.file);

    if (result.parseError) {
        console.log(`${colour("✗", RED + BOLD)} ${rel}`);
        console.log(`  ${colour("Parse error:", BOLD)} ${result.parseError}`);
        return;
    }

    if (result.valid) {
        if (!quiet) {
            console.log(`${colour("✓", GREEN)} ${colour(rel, DIM)}`);
        }
        return;
    }

    console.log(`${colour("✗", RED + BOLD)} ${rel}`);
    for (const err of result.errors) {
        const loc = colour(err.path, YELLOW);
        const msg = err.message ?? "";
        const extra =
            err.allowedValues !== undefined
                ? colour(` [${JSON.stringify(err.allowedValues)}]`, DIM)
                : "";
        console.log(`  ${loc}  ${msg}${extra}`);
    }
}

function printSummary(
    total: number,
    passed: number,
    failed: number,
    durationMs: number
): void {
    console.log("");
    const passStr = colour(`${passed} passed`, passed > 0 ? GREEN : RESET);
    const failStr = colour(`${failed} failed`, failed > 0 ? RED + BOLD : RESET);
    const timeStr = colour(`${durationMs}ms`, DIM);
    if (failed === 0) {
        console.log(colour(`All ${total} file(s) valid.`, GREEN + BOLD) + `  ${timeStr}`);
    } else {
        console.log(`${total} file(s): ${passStr}, ${failStr}  ${timeStr}`);
    }
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

function parseArgs(argv: string[]): {
    target: string;
    schemaPath: string;
    recursive: boolean;
    bail: boolean;
    quiet: boolean;
} {
    const args = argv.slice(2);

    if (args.includes("--help") || args.includes("-h") || args.length === 0) {
        console.log(`
validate — OOML artefact validator

Usage:
  tsx validate.ts <path> [options]

Arguments:
  <path>              A single .json file, or a directory.
                      Directory mode validates every *.json file inside it.

Options:
  --schema <path>     Path to the OOML JSON Schema file.
                      Default: ../schema.json (relative to this script)
  --no-recursive      In directory mode, do not recurse into subdirectories.
  --bail              Stop after the first file that fails validation.
  --quiet             Only print failures and the final summary.
  --help, -h          Show this message.

Exit codes:
  0  All files passed.
  1  One or more files failed, or an error occurred.

Examples:
  tsx validate.ts ./ooml-schema
  tsx validate.ts ./ooml-schema/Person.json
  tsx validate.ts ./ooml-schema --schema ./schema.json --quiet
  tsx validate.ts ./ooml-schema --bail --no-recursive
`);
        process.exit(0);
    }

    const defaultSchema = path.resolve(__dirname, "..", "schema.json");

    const positional = args.filter((a) => !a.startsWith("--"));
    if (positional.length === 0) {
        console.error("Error: <path> argument is required.\nRun with --help for usage.");
        process.exit(1);
    }

    let schemaPath = defaultSchema;
    let recursive  = true;
    let bail       = false;
    let quiet      = false;

    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case "--schema":
                if (!args[i + 1]) { console.error("--schema requires a path argument."); process.exit(1); }
                schemaPath = path.resolve(args[++i]);
                break;
            case "--no-recursive":
                recursive = false;
                break;
            case "--bail":
                bail = true;
                break;
            case "--quiet":
                quiet = true;
                break;
        }
    }

    return { target: path.resolve(positional[0]), schemaPath, recursive, bail, quiet };
}

async function main(): Promise<void> {
    const opts = parseArgs(process.argv);

    // Load Ajv
    let AjvCtor: ReturnType<typeof resolveAjv>;
    try {
        AjvCtor = resolveAjv();
    } catch (e: unknown) {
        console.error((e as Error).message);
        process.exit(1);
    }

    const ajv = new (AjvCtor as unknown as new (opts: object) => { compile: (schema: unknown) => (data: unknown) => boolean; [k: string]: unknown })({
        allErrors: true,
        schemaId: "auto",
        unknownFormats: "ignore",
    });

    // Add draft-06 meta-schema so $ref resolution works correctly with $defs.
    // We locate the bundled file relative to known Ajv package locations.
    const ajvPkgCandidates = [
        path.join(process.cwd(), "node_modules", "ajv"),
        "/home/claude/.npm-global/lib/node_modules/markdown-pdf/node_modules/ajv",
        "/usr/local/lib/node_modules/ajv",
    ];
    for (const candidate of ajvPkgCandidates) {
        const draft6 = path.join(candidate, "lib", "refs", "json-schema-draft-06.json");
        if (fs.existsSync(draft6)) {
            try {
                (ajv as unknown as { addMetaSchema: (s: unknown) => void })
                    .addMetaSchema(JSON.parse(fs.readFileSync(draft6, "utf8")));
            } catch { /* already added or incompatible */ }
            break;
        }
    }

    // Load and compile schema
    let schema: Record<string, unknown>;
    try {
        schema = loadSchema(opts.schemaPath);
    } catch (e: unknown) {
        console.error((e as Error).message);
        process.exit(1);
    }

    let validate: (data: unknown) => boolean;
    try {
        validate = (ajv as unknown as { compile: (s: unknown) => (d: unknown) => boolean }).compile(schema);
    } catch (e: unknown) {
        console.error(`Failed to compile schema "${opts.schemaPath}":\n${(e as Error).message}`);
        process.exit(1);
    }

    // Discover files
    let files: string[];
    try {
        files = collectJsonFiles(opts.target, opts.recursive);
    } catch (e: unknown) {
        console.error((e as Error).message);
        process.exit(1);
    }

    if (files.length === 0) {
        console.warn(`No .json files found in "${opts.target}".`);
        process.exit(0);
    }

    console.log(
        `Validating ${files.length} file(s) against ${colour(path.relative(process.cwd(), opts.schemaPath), YELLOW)}\n`
    );

    // Run validation
    const start  = Date.now();
    let passed   = 0;
    let failed   = 0;
    let bailed   = false;

    for (const file of files) {
        const result = validateFile(file, validate as Parameters<typeof validateFile>[1]);
        printResult(result, opts.quiet);

        if (result.valid && !result.parseError) {
            passed++;
        } else {
            failed++;
            if (opts.bail) {
                bailed = true;
                break;
            }
        }
    }

    printSummary(passed + failed, passed, failed, Date.now() - start);

    if (bailed) {
        console.log(colour("  (stopped after first failure due to --bail)", DIM));
    }

    process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
    console.error("Fatal:", (err as Error).message ?? err);
    process.exit(1);
});