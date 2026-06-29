# OOML — Object-Oriented Modelling Language
## Formal Specification — Draft 0.1.0

---

> **Status:** Draft  
> **Version:** 0.1.0  
> **Date:** 2026-06-26  
> **License:** BSD-3-Clause


---

Copyright (c) 2026 OOML Specification Authors

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Design Goals and Non-Goals](#2-design-goals-and-non-goals)
3. [Terminology and Definitions](#3-terminology-and-definitions)
4. [Namespaces and Identity](#4-namespaces-and-identity)
5. [Versioning](#5-versioning)
6. [Primitive Types](#6-primitive-types)
7. [Attribute Definitions](#7-attribute-definitions)
8. [Classes](#8-classes)
9. [Attributes](#9-attributes)
10. [Metadata](#10-metadata)
11. [Inheritance: Superclasses and Subclasses](#11-inheritance-superclasses-and-subclasses)
12. [Aliases](#12-aliases)
13. [Type Hierarchy: Supertypes and Subtypes](#13-type-hierarchy-supertypes-and-subtypes)
14. [Dependencies](#14-dependencies)
15. [The Dependency Graph](#15-the-dependency-graph)
16. [Serialisation Format](#16-serialisation-format)
17. [Validation Rules](#17-validation-rules)
18. [Complete Example](#18-complete-example)
19. [Grammar (ABNF)](#19-grammar-abnf)
20. [Design Notes and Rationale](#20-design-notes-and-rationale)

---

## 1. Introduction

**OOML** (Object-Oriented Modelling Language) is a JSON-based schema-definition language for describing data models in a way that is simultaneously rigorous, human-readable, and accessible to practitioners across business and engineering disciplines.

OOML borrows the best-understood abstractions from object-oriented programming — classes, inheritance, namespacing, type safety — and applies to them a versioning and distribution mindset borrowed from modern software ecosystems: individual, independently versioned artefacts referenced by precise, stable identifiers.

The central insight of OOML is that **the class, not a collection of classes, is the correct unit of versioning for data models**. This keeps the dependency graph simple and its edges meaningful: every edge represents an actual structural relationship between two classes, and dependency queries are answerable by direct graph traversal with no intermediate packaging layer.

OOML does **not** define:

- A query language
- A storage engine or persistence format
- A serialisation format for data instances
- A protocol for data exchange

OOML **does** define:

- A vocabulary and JSON encoding for classes, attributes, and their relationships
- A versioning contract with clear semantics for breaking and non-breaking changes
- A namespace and identity system enabling global, unambiguous class references
- An inheritance mechanism for attribute reuse and type hierarchy
- A class-to-class dependency model forming a directed acyclic graph
- A metadata model for attaching structured, typed, versioned annotations to artefacts

How artefacts are authored, grouped, and published to a distribution system is outside the scope of this specification and addressed in a separate tooling document.

---

## 2. Design Goals and Non-Goals

### 2.1 Goals

| Goal | Description |
|------|-------------|
| **Intuitive** | Prefer familiar OOP concepts over logic-based formalisms (cf. RDF/OWL) |
| **Business-agnostic** | No domain vocabulary baked in; models domain via composition |
| **Tech-agnostic** | No coupling to any database, language runtime, or serialisation format |
| **Versioned at class granularity** | Each class carries its own semantic version; no collective versioning obligation |
| **Composable** | Classes depend on, extend, and reference other independently versioned classes |
| **Dependency-transparent** | The dependency graph is a direct graph of class-to-class edges; easily traversed by implementations |
| **Extensible via metadata** | Artefacts carry structured, typed, versioned annotations defined using OOML itself |
| **Type-safe** | Attribute types and class hierarchies are checked by a well-defined validation algorithm |
| **Machine-readable** | JSON as the canonical encoding; tooling-friendly |
| **Human-readable** | A compact, predictable structure with clear naming conventions and optional documentation properties |

### 2.2 Non-Goals

- Defining instance data (OOML describes shapes, not records)
- Providing a query or constraint language
- Prescribing a runtime or code-generation target
- Replacing programming-language type systems
- Defining a versioned package or bundle concept
- Defining a registry service, its wire protocol, or its governance model (see the OOML Registry Specification)

---

## 3. Terminology and Definitions

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in RFC 2119.

| Term | Definition |
|------|------------|
| **Resolution context** | The implementation-defined mechanism by which FQN ranges are resolved to specific artefact versions; outside the scope of this specification |
| **Namespace** | A reverse-domain organisational scope that governs who may publish names within it |
| **Class** | A versioned, named, uniquely identifiable collection of attribute slots; the primary unit of the OOML type system |
| **Enum root** | A class whose subtypes (excluding itself) serve as the valid values of an `enum` slot; no dedicated artefact type |
| **Attribute Definition** | A versioned, named, reusable semantic contract for a typed slot; a first-class artefact in the OOML identity model, independent of any class |
| **Attribute Slot** | A named position within a class that either declares an inline type or references a standalone attribute definition |
| **Superclass** | A class whose attribute slots and type identity are inherited by another class (its subclass) via `extends` |
| **Subclass** | A class that names one or more classes in its `extends` property, thereby inheriting their attribute slots |
| **Supertype** | A class that has one or more descendant classes anywhere in the inheritance chain |
| **Subtype** | A class that has one or more ancestor classes anywhere in the inheritance chain |
| **Primitive** | A scalar value type built into the OOML type system (see §6) |
| **Object slot** | An attribute slot whose value is a reference to an instance of a named class or any of its subtypes |
| **Class slot** | An attribute slot whose value is a reference to a class — the named class itself or any of its subtypes |
| **Enum slot** | An attribute slot whose value is a reference to a class that is a subtype of the named root class, excluding the named root class itself |
| **Collection** | An ordered or unordered group of values sharing a declared element type: `list`, `set`, or `map` |
| **Static slot** | An attribute slot whose value belongs to the class rather than to instances; subclasses may redeclare it unless `final` is also set |
| **Alias** | A locally-scoped accessor name declared by a class, mapping a short name to the FQN of an inherited or imported attribute |
| **MRO** | Method Resolution Order; the deterministic linearisation of a class's ancestor list used to compute its full attribute set |
| **FQN** | Fully Qualified Name; the globally unique identity of a class or attribute definition (see §4) |
| **`self`** | A reserved type reference used during authoring to refer to the declaring class itself; expanded to the class's FQN range before distribution |
| **Name** | A free-form, human-readable label on an artefact, independent of the FQN and unconstrained by language |
| **Dependency** | A declared, versioned reference from one artefact to another that it structurally relies upon |
| **Dependency Graph** | The directed acyclic graph (DAG) whose nodes are artefact versions and whose edges are dependencies |
| **Metadata** | Structured, typed, versioned annotations on an OOML artefact, defined using OOML classes as schemas |
| **Metadata Schema** | An ordinary OOML class used as the schema for a metadata entry; carries no special marker |
| **Metadata Entry** | A single key-value pair in the `metadata` object, keyed by a metadata schema FQN range |
| **`cascade`** | A metadata entry control property: when `true`, the value propagates to subclasses that do not set their own value |
| **`local`** | A control property on attribute slots and metadata entries: when `true`, the slot or entry is not inherited by subclasses |
| **`final`** | A control property on attribute slots and metadata entries: when `true`, subclasses cannot override or shadow it |

---


## 4. Namespaces and Identity

### 4.1 Namespace

A namespace is a reverse-domain identifier using dot notation, following Java package conventions:

```
namespace      = lc-segment 1*("." lc-segment)
lc-segment     = ALPHA *( ALPHA / DIGIT )
```

All segments are lowercase. Examples: `com.example`, `org.opendata`, `io.mycompany.platform`.

Namespaces are organisationally controlled. The mechanism by which namespace ownership is established and enforced is outside the scope of this specification and belongs to any registry or distribution system built on top of OOML.

### 4.2 Fully Qualified Name (FQN)

Every class and attribute definition has an FQN that is globally unique:

```
class-fqn      = namespace "/" class-name "@" version
attrdef-fqn    = namespace "/" attrdef-name "@" version
owned-attr-fqn = class-fqn "#" attr-slot-name
```

`class-fqn` and `attrdef-fqn` are the identities of the two OOML artefact types. Enum roots are ordinary classes and use `class-fqn`. `owned-attr-fqn` identifies an attribute slot declared inline within a class. Attribute slots that reference a standalone attribute definition are identified by the attribute definition's own `attrdef-fqn`, not by a `class-fqn#name` path.

Examples:

```
com.example.hr/Employee@1.2.0
com.example.hr/Employee@1.2.0#employeeNumber
com.example.hr/EmploymentStatus@1.0.0
com.example.physics/Temperature@1.0.0
```

The namespace alone scopes all artefact names. There is no intermediate model or package layer in the identity structure. Global uniqueness of FQNs is guaranteed by the reverse-domain namespace convention combined with the namespace governance policy of any distribution system built on OOML.

### 4.3 The `self` Type Reference

The literal string `"self"` is a reserved authoring token. It may appear in any position where a class FQN range is expected — in an attribute slot's `type`, `valueType`, or `keyType` — and means: *the class in which this slot is declared*.

`self` is an authoring convenience that solves the chicken-and-egg problem of a class needing to reference itself before its own version is known. It is valid only during authoring. Before an artefact is committed and distributed, tooling MUST expand every occurrence of `self` to the FQN range of the declaring class (rule T-self). The distributed form of an OOML artefact MUST NOT contain `self`.

`self` resolves to the **declaring class** — the class in which the slot is written — not to the inheriting class. A subclass that inherits a slot whose `type` was declared as `self` inherits a slot typed to the superclass that declared it, not to itself.

`self` is valid on `class`, `object`, and `enum` slots, and in `valueType` and `keyType` positions on `list`, `set`, and `map` slots. It is not valid on `primitive` or `attribute` slots.

```json
"manager": {
	"kind": "class",
	"type": "self",
	"name": "Manager",
	"description": "This employee's direct line manager.",
	"nullable": true
}
```

When committed as `com.example.hr/Employee@1.3.0`, the above expands to:

```json
"manager": {
	"kind": "class",
	"type": "com.example.hr/Employee@^1.3.0",
	"name": "Manager",
	"description": "This employee's direct line manager.",
	"nullable": true
}
```

### 4.4 Uniqueness Constraints

- A class name MUST be unique within a namespace (i.e. `com.example.hr/Employee` identifies a single evolving class, versioned over time).

- An attribute definition name MUST be unique within a namespace.
- Inline attribute slot names MUST be unique within the class that declares them.
- Inline attribute slot names MUST NOT collide with any alias declared by the same class (rule A03).
- The full accessible name surface of a class — its own slot names, its inherited slot names (by their canonical local names where unambiguous), and its aliases — MUST be collision-free after alias resolution (rule A04).

### 4.5 Name Conventions

| Artefact | Convention | Pattern |
|----------|------------|---------|
| Namespace segment | lowercase alphanumeric | `[a-z][a-z0-9]*` |
| Class name | PascalCase | `[A-Z][A-Za-z0-9]*` |
| Attribute definition name | PascalCase | `[A-Z][A-Za-z0-9]*` |
| Attribute slot name | camelCase | `[a-z][a-zA-Z0-9]*` |
| Alias name | camelCase | `[a-z][a-zA-Z0-9]*` |

---

## 5. Versioning

### 5.1 Scope

In OOML 0.1.0, versioning applies to **individual classes and attribute definitions**. There is no version at the namespace level or any grouping level.

### 5.2 Version Format

```
version  = major "." minor "." trivial [ pre-release ] [ build ]
major    = non-neg-int
minor    = non-neg-int
trivial  = non-neg-int
```

Examples: `0.1.0`, `1.0.0`, `2.14.3`.

Pre-release and build metadata suffixes (`-alpha.1`, `+build.5`) MAY be appended following the same syntactic rules as semver 2.0.0, but carry no additional OOML-defined semantics beyond ordering.

### 5.3 Change Impact Contract

| Component | Increment when | Effect on consumers |
|-----------|---------------|---------------------|
| `MAJOR` | A **breaking change** is introduced to the class or attribute definition | Consumers depending on a prior version MUST explicitly migrate. Existing instance data MAY no longer conform. |
| `MINOR` | A **non-breaking, data- or query-significant** addition is made | Existing valid data remains valid. New optional attributes, widened types, new enum subclasses. |
| `TRIVIAL` | A **non-breaking, data- and query-insignificant** change is made | No structural change. Documentation, descriptions, author metadata, tags. |

### 5.4 Breaking Changes (MAJOR)

The following changes are breaking and MUST increment the MAJOR version:

*Class changes:*
- Removing an attribute slot
- Renaming an attribute slot
- Changing an attribute slot's `kind`
- Narrowing an attribute slot's `type`
- Changing an attribute slot from optional to required
- Changing the `valueType` or `valueKind` of a `list`, `set`, or `map` attribute slot
- Changing the `keyType` or `keyKind` of a `map` attribute slot
- Changing an `object` or `class` attribute slot's `type` to an incompatible class (one that is not a subtype of the original)
- Removing a class from the `extends` array
- Changing the `value` of a `static: true, final: true` attribute slot
- Removing an alias
- Changing an alias to point at a different FQN
- Adding `local: true` to a previously non-local attribute slot
- Adding `final: true` to a previously non-final attribute slot (locks it for the hierarchy)
- Removing a `required: true` metadata slot declaration from the hierarchy
- Changing a metadata entry from `cascade: true` to `cascade: false`
- Changing a metadata entry value when `final: true`

*Enum root changes:*
- Removing a subclass that served as an enum value (removing a member of an enum)
- Renaming a class or attribute definition (equivalent to removing the old and adding a new one)

*Attribute definition changes:*
- Changing the `kind` or `type` of an attribute definition
- Narrowing constraints of an attribute definition (e.g. reducing `maxLength`)

### 5.5 Non-Breaking Additions (MINOR)

The following changes require a MINOR increment:

*Class changes:*
- Adding a new optional attribute slot
- Adding a new class to the `extends` array
- Adding a new alias
- Widening an attribute slot's `type` (e.g. `int32` → `int64`)
- Changing a required attribute slot to optional

- Changing a `class` attribute slot's `type` to a subtype of the original
- Adding a new metadata entry
- Adding a new metadata slot declaration (`required: true`, `value: null`)
- Changing `cascade: false` to `cascade: true` on a metadata entry

*Enum root changes:*
- Adding a new subclass of an enum root (adding a member of an enum)

*Attribute definition changes:*
- Widening constraints of an attribute definition (e.g. increasing `maxLength`)

### 5.6 Trivial Changes (TRIVIAL)

- Editing any `description` property
- Editing `examples`
- Editing `authors`, `license`, the `deprecated` message string
- Adding, editing, or removing `tags`

### 5.7 Initial Development

A MAJOR version of `0` indicates the class or attribute definition is in initial development. Any change MAY be breaking. Consumers of `0.y.z` artefacts SHOULD treat every MINOR increment as potentially breaking.

### 5.8 Version Monotonicity

OOML RECOMMENDS that implementations treat a given artefact version as immutable once it has been shared or distributed: the content of `com.example.hr/Employee@1.2.0` SHOULD NOT change after it has been made available to consumers. How this convention is enforced is a concern for any distribution system built on OOML, not for this specification.

Within the language, a new version of the same artefact MUST have a strictly higher version number than any prior version of the same FQN base name in the same resolution context.

---

## 6. Primitive Types

OOML defines the following built-in primitive types. Implementations MUST support all of them.

| Type name | Description | Constraints |
|-----------|-------------|-------------|
| `boolean` | True or false | — |
| `int8` | Signed 8-bit integer | −128 to 127 |
| `int16` | Signed 16-bit integer | −32,768 to 32,767 |
| `int32` | Signed 32-bit integer | −2,147,483,648 to 2,147,483,647 |
| `int64` | Signed 64-bit integer | −2⁶³ to 2⁶³−1 |
| `uint8` | Unsigned 8-bit integer | 0 to 255 |
| `uint16` | Unsigned 16-bit integer | 0 to 65,535 |
| `uint32` | Unsigned 32-bit integer | 0 to 4,294,967,295 |
| `uint64` | Unsigned 64-bit integer | 0 to 2⁶⁴−1 |
| `float32` | IEEE 754 single-precision float | — |
| `float64` | IEEE 754 double-precision float | — |
| `decimal` | Arbitrary-precision decimal | `precision` and `scale` MAY be specified |
| `string` | Unicode text | `minLength`, `maxLength`, `pattern` MAY be specified |
| `date` | Calendar date (no time) | ISO 8601: `YYYY-MM-DD` |
| `time` | Wall-clock time (no date) | ISO 8601: `HH:MM:SS[.fff][Z\|±HH:MM]` |
| `datetime` | Date and time with optional timezone | ISO 8601 combined form |
| `duration` | ISO 8601 duration | e.g. `P1Y2M3DT4H` |
| `uuid` | UUID / GUID | RFC 4122 string form |
| `uri` | Uniform Resource Identifier | RFC 3986 |
| `binary` | Arbitrary byte sequence | `encoding` SHOULD be specified (e.g. `"base64"`) |
| `any` | Unconstrained value | Use sparingly; disables type checking for that attribute |

---


## 7. Attribute Definitions

Attribute definitions are first-class, independently versioned artefacts. An attribute definition describes a reusable, typed semantic contract for a named slot — independent of any class. Any class may reference an attribute definition in an attribute slot of `"kind": "attribute"`.

Attribute definitions are appropriate for domain concepts that are genuinely global: `UnitOfMeasure`, `MonetaryAmount`, `GeoCoordinate`, `IsoLanguageCode`. They are not appropriate for attributes that are intrinsic to a specific class and have no meaning outside it.

### 7.1 Attribute Definition Structure

An attribute definition is a JSON object published as a standalone artefact:

```json
{
	"ooml": "0.1.0",
	"fqn": "com.example.physics/Temperature@1.0.0",
	"name": "Temperature",
	"description": "A temperature measurement.",
	"authors": ["Jane Smith <jane@example.com>"],
	"license": "Apache-2.0",
	"kind": "primitive",
	"type": "decimal",
	"precision": 7,
	"scale": 4
}

```

### 7.2 Attribute Definition Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `ooml` | string | REQUIRED | OOML specification version targeted. |
| `fqn` | string | REQUIRED | Fully qualified name and version of this attribute definition (see §4.2). |
| `name` | string | REQUIRED | Free-form human-readable label for this attribute definition. |
| `description` | string | RECOMMENDED | Human-readable purpose of this attribute definition. |
| `authors` | array of string | RECOMMENDED | Authors in `Name <email>` format. |
| `license` | string | RECOMMENDED | SPDX licence expression. |
| `kind` | string | REQUIRED | Structural role. One of: `primitive`, `object`, `class`, `enum`, `list`, `set`, `map`. Same vocabulary as class attribute slots (see §9). |
| `type` | string | REQUIRED (where applicable) | Value type: primitive type name or class FQN range. Same rules as class attribute slots. |
| `deprecated` | string | OPTIONAL | If present, this artefact is deprecated; the value is the deprecation message. MUST be a non-empty string. Omit when not deprecated. |

All additional type-specific properties that apply to a class attribute slot of the given `kind` (e.g. `minLength`, `pattern`, `precision`, `scale`, `valueKind`, `valueType`, `keyType`) also apply to attribute definitions.

### 7.3 FQN of an Attribute Definition

The FQN of an attribute definition follows the same pattern as a class FQN:

```
attrdef-fqn = namespace "/" attrdef-name "@" version
```

Example: `com.example.physics/Temperature@1.0.0`

The name uses PascalCase (same as class names) to signal that it is a named artefact in the identity model, not an instance-level slot name.

### 7.4 Referencing an Attribute Definition in a Class

A class attribute slot references a standalone attribute definition using `"kind": "attribute"` and a `type` holding the attribute definition's FQN range:

```json
"surfaceTemp": {
	"kind": "attribute",
	"type": "com.example.physics/Temperature@^1.0.0",
	"name": "Surface Temperature",
	"description": "The surface temperature of this body.",
	"nullable": true
}
```

The slot name (`surfaceTemp`) is the local name within the class. The attribute definition's identity is `com.example.physics/Temperature@^1.0.0`. The two are independent: the slot name is how instances are navigated; the attribute definition FQN is how the semantic contract is referenced and versioned.

### 7.5 Versioning of Attribute Definitions

Attribute definitions follow the same change-impact contract as classes (§6). Because changing a `type` fundamentally alters the semantic contract, it is a MAJOR change. The same logic applies here as discussed in §6.4: a type-changed attribute definition is effectively a new thing, and consumers pinned to the old version are unaffected.

### 7.6 Attribute Definitions and the Dependency Graph

When a class references an attribute definition, an edge is created in the dependency graph from the class to the attribute definition. This edge is of type `attribute-import` and participates in cycle detection (an `object`-kind attribute definition that referenced the importing class would create a structural cycle and is rejected by rule D03).

Enum roots are ordinary classes. A dependency on an enum root appears as a standard class edge in the dependency graph, identical to any other class dependency.

> **Note:** How attribute definitions are stored, resolved, and distributed is outside the scope of this specification.

---

## 8. Classes

A class is the central construct of OOML: a versioned, named, uniquely identifiable collection of attributes.

### 8.1 Class Definition

A class is a JSON object published as a standalone artefact:

```json
{
	"ooml": "0.1.0",
	"fqn": "com.example.hr/Employee@1.2.0",
	"name": "Employee",
	"description": "A person employed by the organisation.",
	"authors": ["Jane Smith <jane@example.com>"],
	"license": "Apache-2.0",
	"extends": [
		"com.example.hr/Person@^1.0.0",
		"com.example.common/Auditable@^1.0.0"
	]
}
```

### 8.2 Class Properties

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `ooml` | string | REQUIRED | — | OOML specification version targeted. |
| `fqn` | string | REQUIRED | — | Fully qualified name and version of this class (see §4.2). |
| `name` | string | REQUIRED | — | Free-form human-readable label for this class. |
| `description` | string | RECOMMENDED | — | Human-readable purpose of this class. |
| `authors` | array of string | RECOMMENDED | — | Authors in `Name <email>` format. |
| `license` | string | RECOMMENDED | — | SPDX licence expression. |
| `extends` | string, array of string, or null | OPTIONAL | `null` | FQN range(s) of superclasses. A single string is equivalent to a one-element array. Order is significant: determines MRO (see §12). |
| `abstract` | boolean | OPTIONAL | `false` | If `true`, cannot be instantiated directly. |
| `final` | boolean | OPTIONAL | `false` | If `true`, cannot be extended by any subclass. |
| `deprecated` | string | OPTIONAL | — | If present, this class is deprecated; the value is the deprecation message. MUST be a non-empty string. Omit when not deprecated. |
| `aliases` | object | OPTIONAL | `{}` | Map of alias name to attribute FQN range (see §12). |
| `metadata` | object | OPTIONAL | `{}` | Map of metadata schema FQN range to metadata entry (see §10). |
| `attributes` | object | OPTIONAL | `{}` | Map of attribute slot name to attribute slot definition (see §9). Omit when empty. |

### 8.3 The `fqn` Property

The `fqn` property is the class's own identity. It enables a class definition to be validated and identified independently of any distribution system. A class definition is self-describing: its identity is carried within the document itself.

---

## 9. Attributes

An attribute is a named, typed slot within a class. Every attribute has a `kind` that classifies its structural role and a `type` that specifies its value type.

### 9.1 Common Properties

#### The Slot Identifier

The JSON property name used as the key in a class's `attributes` object is the **slot identifier** — a camelCase string that addresses this slot within the class's own attribute namespace. It has three distinct roles and must not be confused with related concepts:

| Concept | Example | Description |
|---------|---------|-------------|
| **Slot identifier** | `employeeNumber` | The JSON key in the `attributes` object. Follows `[a-z][a-zA-Z0-9]*`. Locally scoped to the class. Used by tooling, code generation, and instance navigation. |
| **`name` property** | `"Employee Number"` | The free-form human-readable label. Unconstrained. Used in UIs and documentation. |
| **Owned slot FQN** | `com.example.hr/Employee@1.2.0#employeeNumber` | The globally unique identity of this slot. Composed of the class FQN and the slot identifier. |
| **Referenced attribute definition FQN** | `com.example.finance/Salary@1.0.0` | When `"kind": "attribute"`, the FQN of the standalone definition being referenced. Independent of the slot identifier. |

The slot identifier and the `name` often convey the same concept in different forms (`employeeNumber` / `"Employee Number"`), but they are independent: the slot identifier is a syntactic key, the `name` is a human label.

Every attribute slot, regardless of `kind`, shares the following properties:

```json
"attributeName": {
	"kind": "<kind>",
	"type": "<type>",
	"name": "Human-readable name",
	"description": "..."
}
```

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `kind` | string | REQUIRED | — | Structural role of this attribute slot. One of: `primitive`, `object`, `class`, `enum`, `list`, `set`, `map`, `attribute`. |
| `type` | string | REQUIRED (see §9.2) | — | Value type. A primitive type name (§6), a class FQN range, an attribute definition FQN range, or `"self"` (see §4.3), depending on `kind`. Not present on `list`, `set`, and `map` — those use `valueKind` and `valueType` instead. |
| `name` | string | REQUIRED | — | Free-form human-readable label for this attribute slot. Independent of the slot's JSON property name. |
| `description` | string | RECOMMENDED | — | Human-readable purpose of this attribute slot. |
| `required` | boolean | OPTIONAL | `false` | Whether instances of this class MUST carry a value for this slot. Applies only to non-static slots (see rule S11). |
| `nullable` | boolean | OPTIONAL | `false` | Whether the instance-level value MAY be JSON `null` when present. Applies only to non-static slots (see rule S12). |
| `static` | boolean | OPTIONAL | `false` | If `true`, the value belongs to the class, not to instances. Instances cannot set or override it. The `value` property MAY be provided; if absent the value is `undefined`. Subclasses may redeclare the slot with a different value unless `final: true` is also set. MUST NOT be combined with `required: true` (rule S11) or `nullable: true` (rule S12). |
| `value` | any | OPTIONAL | — | The class-level value for a `static` slot. MUST be consistent with `type`. When absent on a `static` slot, the value is `undefined`. MUST NOT appear on non-static slots. |
| `local` | boolean | OPTIONAL | `false` | If `true`, this slot is scoped to the declaring class and is not inherited by subclasses. Remains fully visible and accessible to consumers of the declaring class. |
| `final` | boolean | OPTIONAL | `false` | If `true`, subclasses cannot shadow, alias, or further constrain this slot. Combined with `static: true`, locks the class-level value for the entire hierarchy. |
| `deprecated` | string | OPTIONAL | — | If present, this slot is deprecated; the value is the deprecation message. MUST be a non-empty string. Omit when not deprecated. |

**`static` examples:**

```json
"schemaVersion": {
	"kind": "primitive",
	"type": "string",
	"name": "Schema Version",
	"static": true,
	"final": true,
	"value": "2",
	"description": "Schema version discriminator. Fixed for this class and all subclasses."
}
```

```json
"symbol": {
	"kind": "primitive",
	"type": "string",
	"name": "Symbol",
	"static": true,
	"description": "The symbol for this unit of measure. Subclasses should provide a value."
}
```

```json
"symbol": {
	"kind": "primitive",
	"type": "string",
	"name": "Symbol",
	"static": true,
	"value": "m/s",
	"description": "The symbol for velocity."
}
```

### 9.2 Kind: `primitive`

A scalar value of a built-in primitive type.

```json
"birthDate": {
	"kind": "primitive",
	"type": "date",
	"name": "Date of Birth",
	"description": "The employee's date of birth.",
	"nullable": true
}
```

`type` MUST be one of the primitive type names defined in §7.

Additional properties that constrain the value, applicable by primitive type:

| Property | Applies to | Description |
|----------|-----------|-------------|
| `minLength` | `string` | Minimum character count (inclusive). |
| `maxLength` | `string` | Maximum character count (inclusive). |
| `pattern` | `string` | ECMA 262 regex the value MUST match. |
| `minimum` | numeric types | Inclusive lower bound. |
| `maximum` | numeric types | Inclusive upper bound. |
| `exclusiveMinimum` | numeric types | Exclusive lower bound. |
| `exclusiveMaximum` | numeric types | Exclusive upper bound. |
| `precision` | `decimal` | Total number of significant digits. |
| `scale` | `decimal` | Digits to the right of the decimal point. |
| `encoding` | `binary` | Encoding hint (e.g. `"base64"`, `"hex"`). |

### 9.3 Kind: `object`

An inline, nested object conforming to a named class, embedded by value with no independent identity.

```json
"address": {
	"kind": "object",
	"type": "com.example.hr/PostalAddress@^1.0.0",
	"name": "Address",
	"description": "The employee's primary postal address.",
	"nullable": true
}
```

`type` MUST be a class FQN range resolving to a known class, or `"self"` (see §4.3).

### 9.4 Kind: `class`

A pointer to an instance of a named class, identified by that instance's identity. OOML does not prescribe how identity is encoded; it only constrains the type of the instance being referenced.

```json
"department": {
	"kind": "class",
	"type": "com.example.hr/Department@^1.0.0",
	"name": "Department",
	"description": "The department this employee belongs to.",
	"required": true
}
```

`type` MUST be a class FQN range resolving to a known class, or `"self"` (see §4.3).

**`object` vs `class`:**

| | `object` | `class` |
|-|----------|---------|
| Semantics | Embedded by value | Pointer to an identity |
| Lifecycle | Owned by parent | Independent |
| Identity | None | Has its own identity |

### 9.5 Kind: `enum`

An `enum` slot holds a **reference to a class** that is a subtype of the named root class, excluding the named root class itself. This is the enumerative pattern: the root class defines the category; its subtypes define the members. Neither the root nor its subtypes are required to be abstract or concrete — that is the modeller's choice.

```json
"employmentType": {
	"kind": "enum",
	"type": "com.example.hr/EmploymentType@^1.0.0",
	"name": "Employment Type",
	"description": "The nature of this person's engagement.",
	"required": true
}
```

`type` MUST be a class FQN range resolving to a known class, or `"self"` (see §4.3). Valid values are references to any class that is a subtype of the named class, excluding the named class itself.

**`class` vs `enum`:**

| | `class` | `enum` |
|-|---------|--------|
| Value is | A reference to a class | A reference to a class |
| Named class valid as value? | **Yes** | **No** — valid values are subtypes of the named class, excluding the named class itself |
| Typical use | General class reference | Enumerative selection from a category |
| Root or value abstractness | Any | Any — neither root nor subtypes need be abstract or concrete |

### 9.6 Kind: `list`

An ordered sequence of values of a declared value type. Duplicate values are permitted.

```json
"phoneNumbers": {
	"kind": "list",
	"valueKind": "primitive",
	"valueType": "string",
	"name": "Phone Numbers",
	"description": "Phone numbers associated with this employee.",
	"minItems": 0,
	"maxItems": 10
}
```

| Property | Required | Default | Description |
|----------|----------|---------|-------------|
| `valueKind` | REQUIRED | — | Kind of each value. Same vocabulary as attribute slot kinds. |
| `valueType` | REQUIRED (where applicable) | — | Type of each value. A primitive type name, class FQN range, attribute definition FQN range, or `"self"`, consistent with `valueKind`. For `valueKind: "enum"`, valid values are subtypes of the named class, excluding the named class itself. |
| `minItems` | OPTIONAL | — | Minimum number of values (inclusive). |
| `maxItems` | OPTIONAL | — | Maximum number of values (inclusive). |

### 9.7 Kind: `set`

An unordered collection of values of a declared value type. Duplicate values are NOT permitted.

```json
"roles": {
	"kind": "set",
	"valueKind": "class",
	"valueType": "com.example.hr/Role@^1.0.0",
	"name": "Roles",
	"description": "Roles assigned to this employee.",
	"required": true,
	"minItems": 1
}
```

Properties are identical to `list` (§9.6).

### 9.8 Kind: `map`

A collection of key-value pairs. Keys MUST be unique within an instance. Both keys and values may be of any attribute slot kind.

```json
"localizedTitles": {
	"kind": "map",
	"name": "Localized Titles",
	"description": "Job title translated into multiple languages, keyed by ISO 639-1 language code."
}
```

When `keyKind` and `keyType` are omitted the map has `primitive`/`string` keys — the most common case. A more explicit example with non-default key and value kinds:

```json
"salaryByEmploymentType": {
	"kind": "map",
	"keyKind": "enum",
	"keyType": "com.example.hr/EmploymentType@^1.0.0",
	"valueKind": "attribute",
	"valueType": "com.example.finance/Salary@^1.0.0",
	"name": "Salary By Employment Type",
	"description": "Standard salary for each employment type."
}
```

| Property | Required | Default | Description |
|----------|----------|---------|-------------|
| `keyKind` | OPTIONAL | `primitive` | Kind of each map key. Same vocabulary as attribute slot kinds. |
| `keyType` | OPTIONAL | `string` | Type of each map key. A primitive type name, class FQN range, or attribute definition FQN range, consistent with `keyKind`. |
| `valueKind` | REQUIRED | — | Kind of each map value. Same vocabulary as attribute slot kinds. |
| `valueType` | REQUIRED (where applicable) | — | Type of each map value. A primitive type name, class FQN range, attribute definition FQN range, or `"self"`, consistent with `valueKind`. For `valueKind: "enum"`, valid values are subtypes of the named class, excluding the named class itself. |
| `minItems` | OPTIONAL | — | Minimum number of entries (inclusive). |
| `maxItems` | OPTIONAL | — | Maximum number of entries (inclusive). |

---

### 9.9 Kind: `attribute`

An attribute slot that references a standalone attribute definition (see §9). The slot inherits the `kind`, `type`, and all type-specific constraints from the attribute definition. The slot name within the class is the local accessor name for that attribute.

```json
"surfaceTemp": {
	"kind": "attribute",
	"type": "com.example.physics/Temperature@^1.0.0",
	"name": "Surface Temperature",
	"description": "Surface temperature of this celestial body.",
	"nullable": true
}
```

| Property | Required | Description |
|----------|----------|-------------|
| `type` | REQUIRED | FQN range of the attribute definition. |

All common properties (`name`, `required`, `nullable`, `static`, `local`, `final`, `deprecated`) apply to `attribute` slots. The structural properties of the value (`kind`, `type`, and type-specific constraints) are inherited from the referenced attribute definition and MUST NOT be redeclared on the slot. The `description` on the slot is the context-specific description within this class; the attribute definition's own `description` is the canonical domain description.

---


## 10. Metadata

### 10.1 Purpose

Metadata in OOML is a mechanism for attaching structured, typed, versioned annotations to any artefact — a class or an attribute definition. Rather than defining a separate metadata modelling language, OOML uses itself: metadata schemas are ordinary OOML classes, independently versioned, and referenced by FQN range. This means metadata schemas automatically inherit all OOML capabilities: inheritance, attribute slots, type safety, and dependency tracking.

A metadata schema carries no special marker. Any class may serve as a metadata schema. Whether a class is intended for metadata use is a convention recorded in its `description` and `tags`, not a language-level distinction.

### 10.2 The `metadata` Property

The `metadata` property on a class or attribute definition is a JSON object. Each key is the FQN range of a metadata schema class. Each value is either a **short-form** scalar value or a **compound-form** object with control properties.

```json
{
	"ooml": "0.1.0",
	"fqn": "com.example.hr/Employee@1.3.0",
	"name": "Employee",
	"description": "A person employed by the organisation.",
	"metadata": {
		"com.osdu.schema/SchemaInfo@^1.0.0": {
			"status": "com.osdu.schema/Published@1.0.0",
			"license": {
				"value": "Apache-2.0",
				"cascade": true,
				"final": true
			},
			"author": {
				"value": "Jane Smith <jane@example.com>",
				"cascade": false
			},
			"deprecationDate": {
				"value": null,
				"local": true
			}
		}
	}
}
```

The value of each metadata schema entry is itself an object whose keys are attribute slot names defined on the metadata schema class, and whose values are either short-form or compound-form.

### 10.3 Short Form vs Compound Form

A metadata attribute value may be expressed in two forms:

**Short form** — a scalar value assigned directly. All control properties take their defaults.

```json
"status": "com.osdu.schema/Published@1.0.0"
```

**Compound form** — an object with a `value` property and optional control properties.

```json
"license": {
	"value": "Apache-2.0",
	"cascade": true,
	"final": true
}
```

A validator normalises short form to compound form internally. The two are semantically equivalent when all control properties are at their defaults.

### 10.4 Metadata Entry Control Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `value` | any | — | REQUIRED in compound form. The metadata value. MUST conform to the type declared in the metadata schema class for this attribute slot. MAY be `null` when `required: false`. |
| `required` | boolean | `true` | Whether a concrete value MUST be present. If `true` and `value` is `null`, this entry is a **slot declaration**: it signals that a value must be set somewhere in the inheritance chain before the artefact (or any subclass) is considered valid. |
| `cascade` | boolean | `false` | If `true`, the value propagates to subclasses that do not set their own value for this entry. Subclasses may always override a cascaded value unless `final: true`. |
| `local` | boolean | `false` | If `true`, this entry is scoped to the declaring artefact and is not inherited by subclasses. The entry remains fully visible and accessible to consumers of the declaring artefact. |
| `final` | boolean | `false` | If `true`, subclasses cannot override this entry's value. |

### 10.5 Slot Declarations

A metadata entry with `value: null` and `required: true` is a **slot declaration** — a statement that a value must eventually be provided, without the declaring artefact providing one. This is useful for base classes that mandate a metadata requirement without being in a position to supply the value themselves.

```json
"metadata": {
	"com.osdu.schema/SchemaInfo@^1.0.0": {
		"status": {
			"value": null
		}
	}
}
```

A concrete subclass satisfies this requirement by providing a non-null value for the same entry.

### 10.6 Interaction Rules

The following combinations of control properties have defined semantics or are validation errors:

| Combination | Result |
|-------------|--------|
| `local: true` + `cascade: true` | **Validation error (M01).** A value cannot cascade to subclasses that do not receive the slot. |
| `local: true` + `final: true` | Permitted but redundant. If subclasses do not receive the slot, locking the value is a no-op. Tooling SHOULD warn. |
| `local: true` + `required: true` | Valid. The declaring artefact itself must have a non-null value. Subclasses are not obligated to carry this slot. |
| `final: true` + `cascade: false` | Valid. The value is locked but does not propagate; subclasses that do not receive it via cascade must set their own (if the slot is required). |
| `final: true` + `cascade: true` | Valid and common. The value cascades and cannot be overridden. |

### 10.7 Metadata Inheritance

Metadata entries are inherited by subclasses subject to the following rules:

1. A subclass inherits all non-`local` metadata entries from all its ancestors, transitively.
2. A subclass MAY set its own value for any inherited entry, unless that entry is `final: true` in any ancestor.
3. A subclass MAY declare additional metadata entries not present in any ancestor.
4. A `cascade: true` entry whose value is set by an ancestor propagates to all descendants that do not set their own value. The cascaded value is overridable unless `final: true`.
5. A `local: true` entry is not inherited. It exists only on the declaring artefact.
6. A subclass MUST NOT remove a required slot declaration inherited from an ancestor. It satisfies it by providing a non-null value.

### 10.8 `local` and `final` on Attribute Slots

The `local` and `final` modifiers apply to attribute slots with the same semantics as metadata entries:

**`local: true` on an attribute slot** means the slot is declared on this class and is fully accessible to consumers of this class, but subclasses do not inherit it. It does not appear in a subclass's MRO-resolved attribute set. A subclass may declare its own slot with the same name without it being considered a redeclaration conflict.

**`final: true` on an attribute slot** means no subclass may shadow, alias, or further constrain the slot. Attempting to declare a slot with the same canonical local name in a subclass is a validation error (rule I06). Attempting to alias a `final` slot to a different name in a subclass is permitted — aliasing is a navigation convenience, not a structural modification.

Interaction rules for attribute slots:

| Combination | Result |
|-------------|--------|
| `local: true` + `final: true` | Permitted but redundant. Tooling SHOULD warn. |
| `local: true` + `static: true` | Valid. The static value is scoped to this class only; subclasses do not inherit the slot. |
| `final: true` + `static: true` | Valid. The class-level value is locked; subclasses cannot redeclare the slot. |
| `final: true` + `static: true` + `value` | The closest OOML equivalent to a traditional constant. |

### 10.9 Metadata and the Dependency Graph

Each metadata schema FQN range declared as a key in the `metadata` object creates a `metadata` edge in the dependency graph from the declaring artefact to the metadata schema class. This edge participates in the same dependency resolution and cycle-detection rules as all other edges. Specifically:

- A `metadata` edge is treated as a structural dependency for cycle detection purposes. A class that uses itself as its own metadata schema would create a structural cycle and is rejected (rule D03).
- The metadata schema class FQN MUST appear in the declaring artefact's `dependencies` map (rule D01).

---

## 11. Inheritance: Superclasses and Subclasses

### 11.1 Declaring a Subclass

A class declares its superclass or superclasses using the `extends` property. `extends` accepts either a single FQN range string or an array of FQN range strings. A single string is treated as a one-element array.

```json
{
	"ooml": "0.1.0",
	"fqn": "com.example.hr/Employee@1.0.0",
	"name": "Employee",
	"description": "A person employed by the organisation.",
	"extends": [
		"com.example.hr/Person@^1.0.0",
		"com.example.common/Auditable@^1.0.0"
	],
	"attributes": {
		"employeeNumber": { "kind": "primitive", "type": "string", "name": "Employee Number", "required": true, "description": "Employee reference number." },
		"startDate":      { "kind": "primitive", "type": "date",   "name": "Start Date",      "required": true, "description": "Employment start date." },
		"manager":        { "kind": "class",     "type": "self",   "name": "Manager",         "description": "Direct line manager." }
	}
}
```

Here `com.example.hr/Person` and `com.example.common/Auditable` are both **superclasses** of `Employee`. `Employee` is a **subclass** of both.

### 11.2 Attribute Inheritance Rules

1. A subclass inherits all attribute slots from all its superclasses that are not marked `local: true`, and transitively from all ancestors.
2. Inherited attribute slots MUST NOT be re-declared in a subclass, unless the inherited slot is `local: true` in the ancestor (in which case the subclass is free to declare its own slot with the same name).
3. A subclass MUST NOT override an inherited attribute slot's `kind`, `type`, or constraints.
4. A subclass MUST NOT shadow or re-declare a slot inherited from any ancestor that is marked `final: true` (rule I06).
5. Inherited attribute slots from different ancestors whose **attribute definition FQNs differ** are always distinct, regardless of whether their local slot names happen to match. There is no conflict between them at the type level.
6. Inherited attribute slots from different ancestors that share the **same attribute definition FQN** are the same attribute and appear once in the resolved attribute set. This is the only true diamond case and requires no resolution rule beyond deduplication.

### 11.3 Attribute Resolution Order (MRO)

The full attribute set of a class is computed by a depth-first, left-to-right traversal of the `extends` array (the class's own attributes come last). This is consistent with the C3 linearisation algorithm.

For a class `C` with `"extends": [A, B]`:
1. Resolve `C`'s own attribute slots.
2. Prepend the linearisation of `A` (recursively).
3. Prepend the linearisation of `B` (recursively), deduplicating any ancestors already included from step 2.
4. The resulting ordered list is the MRO of `C`.

The MRO determines the order in which attributes appear in tooling output (e.g. schema documentation, code generation). Attributes earlier in the MRO take precedence for local-name access where no alias has been declared and no collision exists.

### 11.4 Local Name Access and Collisions

An inherited attribute slot is accessible by its **canonical local name** (the slot name as declared in the ancestor class) if and only if that name is unambiguous — i.e. no other inherited attribute slot in the same class shares the same local name (regardless of FQN).

If two inherited slots share a local name, neither is accessible by that name without an explicit alias (see §13). Tooling SHOULD warn when a local name collision is left unaliased.

### 11.5 Abstract Classes

An abstract class (`"abstract": true`):

- MUST NOT be instantiated directly.
- MAY define attribute slots.
- MAY itself extend other classes.
- MAY be the target of `class` and `object` attribute slots; the resolved instance at runtime will be a concrete subtype.

### 11.6 Final Classes

A final class (`"final": true`) cannot appear in any other class's `extends` array. Attempting to extend a final class is a validation error (rule I03).

### 11.7 Version Compatibility of `extends`

Each entry in `extends` carries a version range, not a pinned version. When a new version of a superclass is published:

- If the new version is compatible with the declared range (MINOR or TRIVIAL change), the subclass automatically resolves to the new version without a new publication.
- If the new version is a MAJOR change, the subclass author MUST evaluate whether to publish a new version with an updated range.

This is the principal mechanism by which OOML propagates inheritance changes without requiring simultaneous re-publication of all descendants.

---


## 12. Aliases

### 12.1 Purpose

An alias is a locally-scoped accessor name that a class declares for an attribute reachable on its instances — whether that attribute was inherited from a superclass or imported via an `"attribute"` slot. Aliases exist to:

1. **Disambiguate local name collisions.** When two inherited attributes share a local slot name (but have different FQNs), neither is accessible by that name without an alias.
2. **Provide ergonomic names.** When a canonical attribute name is verbose or contextually awkward, an alias gives the class author control over the local interface.
3. **Expose imported attribute definitions under class-appropriate names.** A standalone attribute definition has a PascalCase name in the identity model (e.g. `Temperature`); an alias gives it a camelCase slot-style name in context (e.g. `surfaceTemperature`).

### 12.2 Alias Declaration

Aliases are declared in the `aliases` property of a class definition, as a JSON object whose keys are alias names and whose values are attribute FQN ranges:

```json
{
	"ooml": "0.1.0",
	"fqn": "com.example.planets/CelestialBody@1.0.0",
	"name": "Celestial Body",
	"description": "A body in a planetary system.",
	"extends": [
		"com.example.planets/Surface@^1.0.0",
		"com.example.planets/Core@^1.0.0"
	],
	"aliases": {
		"surfaceTemperature": "com.example.physics/Temperature@^1.0.0",
		"coreTemperature":    "com.example.geology/CoreTemperature@^1.0.0"
	}
}
```

Here `surfaceTemperature` and `coreTemperature` are aliases for two different attribute definitions that both happen to be locally named `temperature` in their respective superclasses. With these aliases declared, instances of `CelestialBody` expose `surfaceTemperature` and `coreTemperature` as distinct, unambiguous accessors.

### 12.3 Alias Resolution

An alias name resolves to the attribute whose FQN matches the declared FQN range, within the class's full resolved attribute set (own slots + all inherited slots). If the FQN range does not match any attribute in the resolved set, it is a validation error (rule A01).

### 12.4 Alias Inheritance

A subclass inherits all aliases declared by its ancestors. The inherited alias names are part of the subclass's accessible interface just as if the subclass had declared them itself.

A subclass MAY declare additional aliases for any attribute reachable on it — including attributes already aliased by an ancestor. The ancestor's alias is not removed; both the ancestor alias and the subclass alias are valid accessors for the same attribute.

A subclass MUST NOT declare an alias name that is already used by any ancestor for a **different** FQN. This would create an ambiguous accessor name. It is a validation error (rule A05).

### 12.5 Alias Uniqueness Rules

| Rule | Description |
|------|-------------|
| A01 | The FQN range in an alias declaration MUST match at least one attribute in the class's resolved attribute set. |
| A02 | A given attribute FQN MUST NOT be the target of more than one alias within the same class declaration. (Subclasses may introduce additional aliases for the same FQN; the restriction is per-class, not per-hierarchy.) |
| A03 | An alias name MUST NOT collide with any own attribute slot name declared in the same class. |
| A04 | An alias name MUST NOT collide with the unambiguous canonical local name of any other attribute in the class's resolved set. |
| A05 | A subclass MUST NOT declare an alias name already used by any ancestor for a different attribute FQN. |

### 12.6 Aliases and the `attr-fqn`

Aliases are purely a navigation convenience. They do not change an attribute's FQN, appear in the dependency graph, or affect how attribute slots are stored or referenced outside the class's local interface. An alias is not an identity; it is a lens.

---

## 13. Type Hierarchy: Supertypes and Subtypes

The type hierarchy is the transitive closure of the superclass relationship across all resolvable class versions within the resolution context.

### 13.1 Definitions

- Class **A** is a **supertype** of class **B** if A appears anywhere in the MRO of B (excluding B itself).
- Class **B** is a **subtype** of class **A** if **A** is a supertype of **B**.
- A class is both a supertype and a subtype of itself (reflexive).

Because OOML supports multi-inheritance, the type hierarchy is a DAG (directed acyclic graph) rather than a tree. A class may have multiple direct supertypes, each of which may in turn have multiple supertypes.

### 13.2 Type Compatibility

Type compatibility differs by `kind`:

- **`object`** — accepts a reference to an instance whose type is **A or any subtype** of A.
- **`class`** — accepts a reference to **class A itself or any subtype** of A.
- **`enum`** — accepts a reference to a class that is a subtype of A, excluding A itself.

This is covariant substitution following the Liskov Substitution Principle, with `enum` applying an additional exclusion of the root.

### 13.3 Required Type Hierarchy Operations

OOML-conformant tools MUST be capable of computing:

| Operation | Description |
|-----------|-------------|
| `ancestors(C)` | The ordered list of superclasses from C's immediate superclass to the root |
| `descendants(C)` | All classes that are subtypes of C within the resolution context |
| `isSubtype(A, B)` | Whether A is a subtype of B |
| `dependents(C)` | All artefacts that declare any direct dependency on C |

The `dependents` operation is the direct answer to the query that motivated this specification's class-level versioning model: "what depends on this class?" is a simple graph-edge lookup, not a scan of package contents.

---

## 14. Dependencies

### 14.1 The `dependencies` Property

Every class definition MAY declare a `dependencies` object. This is the explicit, machine-readable record of every external class or attribute definition the class structurally relies upon. The `dependencies` map enables any resolution system or tooling to determine which external artefacts must be available before this class can be fully resolved. The mechanism of resolution is outside the scope of this specification.

```json
{
	"ooml": "0.1.0",
	"fqn": "com.example.hr/Employee@1.2.0",
	"name": "Employee",
	"description": "...",
	"extends": "com.example.hr/Person@^1.0.0",
	"dependencies": {
		"com.example.hr/Person": "^1.0.0",
		"com.example.hr/Department": "^2.1.0",
		"com.example.hr/EmploymentType": "^1.0.0"
	},
	"attributes": {
		"department": {
			"kind": "class",
			"type": "com.example.hr/Department@^2.1.0",
			"name": "Department",
			"description": "The department this employee belongs to.",
			"required": true
		},
		"employmentType": {
			"kind": "enum",
			"type": "com.example.hr/EmploymentType@^1.0.0",
			"name": "Employment Type",
			"description": "The nature of this person's engagement.",
			"required": true
		}
	}
}
```

The `dependencies` map is the union of all external FQN ranges referenced anywhere in the class definition: in `extends`, in all attribute slot `type` and `valueType` properties that resolve to external artefacts, and in `aliases` values. Every external reference that appears in the class definition MUST appear in `dependencies`, and vice versa (rule D01).

### 14.2 Within-Namespace Short Names

Where tooling allows short names (class name without namespace or version) to be used during authoring, the version range must still be supplied in the `dependencies` map. When the class is distributed, all short names MUST be expanded to full FQN ranges.

### 14.3 Version Range Syntax

OOML adopts the npm-compatible semver version range syntax for expressing version constraints in dependency declarations:

| Specifier | Meaning |
|-----------|---------|
| `1.2.3` | Exact version |
| `^1.2.3` | Same MAJOR, `>= 1.2.3` |
| `~1.2.3` | Same MAJOR and MINOR, `>= 1.2.3` |
| `>=1.2.0 <2.0.0` | Explicit range |
| `*` | Any version (not recommended for production) |

For MAJOR version 0, `^0.y.z` is treated as `~0.y.z`, reflecting the initial-development instability convention.

### 14.4 Self-Reference

A class MUST NOT declare a dependency on itself, directly or transitively. This is enforced by the acyclicity rule (D03).

> **Note:** Version range resolution — determining which specific version satisfies a declared range — is the concern of any distribution or tooling system built on OOML, not of this specification.

---

## 15. The Dependency Graph

### 15.1 Structure

The OOML dependency graph is a directed acyclic graph (DAG) where:

- **Nodes** are class and attribute definition versions, identified by their exact FQN (including version).
- **Edges** are directed from a dependent to its dependency, labelled with the version range declared in the dependent's `dependencies` property.

There are no package nodes. Every node is an individual versioned class or attribute definition. The dependency graph is a logical structure defined by the language; how it is traversed or resolved is outside the scope of this specification.

### 15.2 Edge Types

Edges arise from the following sources:

| Source | Edge meaning |
|--------|-------------|
| `extends` property (each entry) | Inheritance dependency: the subclass structurally incorporates the superclass |
| `object` slot `type` property | Composition dependency: the class embeds instances of another class by value |
| `class` slot `type` property | Reference dependency: the class refers to instances of another class by identity |
| `enum` slot `type` property | Enum root dependency: the class references a class as an enum root |
| `attribute` slot `type` property | Attribute import dependency: the class uses a standalone attribute definition |
| `list`, `set`, or `map` `valueType` property | Collection element dependency |
| `aliases` value (each entry) | Alias dependency: the class declares a local name for an inherited or imported attribute |

Tools MAY distinguish edge types in visualisations and impact analysis.

### 15.3 Acyclicity

The dependency graph MUST be acyclic across `extends`, `object`, and `attribute-import` edges. Self-referential `class` and `enum` slot edges are exempt (they are class-hierarchy references, not structural embedding).

### 15.4 Resolution Algorithm

Given a class C to resolve:

1. Retrieve C's exact version from the resolution context.
2. For each entry in C's `dependencies`, resolve the version range to the highest published version satisfying the range.
3. Recurse into each resolved dependency.
4. Detect cycles: if C appears in its own transitive dependency chain via `extends`, `object`, or `attribute` edges, abort with an error. Self-referential `class` attribute slot edges are excluded from cycle detection.
5. Where the same class appears via multiple dependency paths at potentially different resolved versions, apply **minimum version selection**: use the highest minimum version required across all paths, provided it satisfies all declared ranges. If no single version satisfies all constraints, report a conflict.

### 15.5 Dependency Insight

Because the dependency graph is a flat graph of class nodes with no package-level indirection, the following queries are structurally straightforward for any tooling system that indexes the graph:

| Query | How |
|-------|-----|
| Direct dependents of C | Find all nodes with an edge pointing to C |
| All classes that extend C | Filter edges to inheritance type |
| All classes that reference C by identity | Filter edges to `class` type |
| All classes that embed C by value | Filter edges to `object` type |
| Impact of a MAJOR change to C | BFS/DFS over dependent edges from C |
| Full ancestry of C | Traverse `extends` edges from C to root |
| All subtypes of C | Traverse `extends` edges inbound to C, recursively |

---


## 16. Serialisation Format

OOML artefacts (classes and attribute definitions) are serialised as UTF-8 encoded JSON.

### 16.1 Omission-Over-Default Convention

Optional properties whose value equals their declared default SHOULD be omitted rather than stated explicitly. This applies across all artefact types:

| Property | Default | Omit when value is |
|----------|---------|-------------------|
| `abstract` | `false` | `false` |
| `final` | `false` | `false` |
| `static` | `false` | `false` |
| `local` | `false` | `false` |
| `required` | `false` | `false` |
| `nullable` | `false` | `false` |
| `extends` | `null` | `null` or `[]` |
| `aliases` | `{}` | `{}` |
| `metadata` | `{}` | `{}` |
| `attributes` | `{}` | `{}` |
| `cascade` (metadata) | `false` | `false` |
| `keyKind` (map) | `primitive` | `primitive` |
| `keyType` (map) | `string` | `string` |

A property that carries only its default value adds noise without information. Omitting it makes artefact definitions more readable and concise.

Conformant parsers MUST accept explicit defaults — the convention is a SHOULD for authors, not a MUST for parsers.

### 16.2 Formatting Conventions

The following formatting conventions are RECOMMENDED for canonical output:

- Two-space indentation
- Object keys sorted alphabetically
- No trailing commas
- LF (`\n`) line endings

These are informative conventions. Parsers MUST accept any valid JSON.

---

## 17. Validation Rules

An OOML artefact (class or attribute definition) is **valid** if and only if all applicable rules below pass. Conformant tools MUST enforce these rules when processing artefacts and SHOULD enforce them during authoring.

### 17.1 Structural Rules

| Rule ID | Description |
|---------|-------------|
| S01 | The `ooml` property MUST be a valid semver string identifying a known specification version. |
| S02 | The namespace portion of `fqn` MUST match `[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)+`. |
| S03 | The class or attribute definition name portion of `fqn` MUST match `[A-Z][A-Za-z0-9]*`. |
| S03a | The `name` property MUST be present and non-empty on all artefacts (classes and attribute definitions). |
| S04 | The version portion of `fqn` MUST be a valid, exact (non-range) semver string. |
| S05 | Attribute slot names MUST match `[a-z][a-zA-Z0-9]*` (camelCase). |
| S06 | Alias names MUST match `[a-z][a-zA-Z0-9]*` (camelCase). |

| S08 | A class MUST NOT be both `abstract: true` and `final: true`. |
| S09 | The `value` property MUST NOT appear on non-`static` attribute slots. |
| S-deprecated | The `deprecated` property, when present on any artefact or attribute slot, MUST be a non-empty string. The value `null` is not permitted; omit the property instead. |
| S10 | A `static` attribute slot's `value`, when provided, MUST be consistent with the slot's declared `type`. |
| S11 | A `static` attribute slot MUST NOT have `required: true`. (Since the default is `false`, omitting `required` on a static slot is always correct.) |
| S12 | A `static` attribute slot MUST NOT have `nullable: true`. |

### 17.2 Type Rules

| Rule ID | Description |
|---------|-------------|
| T01 | The `type` on a `primitive` slot MUST be one of the primitive type names in §7. |
| T02 | The `type` on an `object`, `class`, or `enum` slot MUST resolve to a known class within the resolution context. |
| T03 | The `type` on an `enum` slot defines the enum root. Valid values at runtime are references to classes that are subtypes of the named class, excluding the named class itself. |
| T04 | The `type` on an `attribute` slot MUST resolve to a known attribute definition within the resolution context. |

| T06 | When `valueKind` is `primitive`, `valueType` MUST be a valid primitive type name (§6). |
| T07 | When `valueKind` is `object`, `class`, or `enum`, `valueType` MUST resolve to a known class. When `valueKind` is `attribute`, `valueType` MUST resolve to a known attribute definition. For `valueKind: "enum"`, valid values are subtypes of the resolved class, excluding the resolved class itself. |
| T08 | The `keyType` on a `map` slot MUST be a primitive type name from §7. |

### 17.3 Inheritance Rules

| Rule ID | Description |
|---------|-------------|
| I01 | Every FQN range in `extends` MUST resolve to a known class within the resolution context. |
| I02 | A class MUST NOT extend itself (direct or transitive cycle via inheritance edges). |
| I03 | A class MUST NOT extend a class marked `final: true`. |
| I04 | A class MUST NOT declare an attribute slot whose name conflicts with any non-`local` inherited slot's canonical local name. |
| I05 | A class marked `abstract: false` MUST provide (via its own or inherited slots) all required non-`local` attribute slots needed for instantiation. |
| I06 | A class MUST NOT declare an attribute slot that shadows a `final: true` slot in any ancestor. |

### 17.4 Alias Rules

| Rule ID | Description |
|---------|-------------|
| A01 | The FQN range in an alias declaration MUST match at least one attribute in the class's resolved attribute set. |
| A02 | A given attribute FQN MUST NOT be the target of more than one alias within the same class declaration. |
| A03 | An alias name MUST NOT collide with any own attribute slot name in the same class. |
| A04 | An alias name MUST NOT collide with the unambiguous canonical local name of any attribute in the class's resolved set. |
| A05 | A subclass MUST NOT declare an alias name already used by any ancestor for a different attribute FQN. |

### 17.5 Metadata Rules

| Rule ID | Description |
|---------|-------------|
| M01 | A metadata entry MUST NOT have both `local: true` and `cascade: true`. |
| M02 | A subclass MUST NOT set a value for a metadata entry that is marked `final: true` in any ancestor. |
| M03 | A subclass MUST NOT declare a metadata entry as `local: true` for a slot that is non-local in any ancestor. |
| M04 | A required metadata slot declaration (`required: true`, `value: null`) inherited from an ancestor MUST be satisfied (a non-null value set) somewhere in the inheritance chain before the class is considered fully valid for instantiation. |
| M05 | The `value` of a metadata entry MUST conform to the type declared for that attribute slot in the metadata schema class. |
| M06 | Each key in the `metadata` object MUST be a syntactically valid FQN range resolving to a known class within the resolution context. |

### 17.6 Dependency Rules

| Rule ID | Description |
|---------|-------------|
| D01 | The `dependencies` map MUST contain exactly the set of external FQN base names referenced in `extends`, in all attribute slot `type` and `valueType` properties that resolve to external artefacts, in `aliases` values, and in all `metadata` object keys. No more, no fewer. |
| D02 | All version ranges in `dependencies` MUST be syntactically valid per §15.3. |
| D03 | The dependency graph MUST be acyclic across `extends`, `object`, `attribute-import`, and `metadata` edges. Self-referential `class` and `enum` slot edges are exempt (they are class-hierarchy references, not structural embedding). |
| D04 | All declared version ranges SHOULD be satisfiable by at least one known artefact version within the resolution context at the time of validation. |

### 17.7 Versioning Rules

| Rule ID | Description |
|---------|-------------|
| V01 | Within a given resolution context, a new version of a class or attribute definition MUST have a strictly higher version number than all previously known versions of the same FQN base name. |
| V02 | A change classified as MAJOR per §6.4 MUST result in a MAJOR version increment. |
| V03 | A change classified as MINOR per §6.5 MUST result in at least a MINOR version increment. |
| V04 | OOML RECOMMENDS that artefact versions be treated as immutable once distributed. Distribution systems SHOULD reject attempts to overwrite an existing versioned artefact. |

---

## 18. Complete Example

The following example demonstrates multi-inheritance, standalone attribute definitions, aliases, and metadata. All artefacts are shown in their distributed form with full FQNs.

### 18.1 Standalone Attribute Definition and Enum Root

`Salary` is published as a standalone attribute definition, usable by any class:

```json
{
	"ooml": "0.1.0",
	"fqn": "com.example.finance/Salary@1.0.0",
	"name": "Annual Salary",
	"description": "An annual gross salary amount in the organisation's base currency.",
	"kind": "primitive",
	"type": "decimal",
	"precision": 14,
	"scale": 2,
	"minimum": 0
}
```

`EmploymentType` is the enum root — an ordinary class whose subtypes (excluding itself) are the valid employment type values:

```json
{
	"ooml": "0.1.0",
	"fqn": "com.example.hr/EmploymentType@1.0.0",
	"name": "Employment Type",
	"description": "The nature of an employment relationship. Extend this class to define recognised employment types.",
	"abstract": true
}
```

```json
{
	"ooml": "0.1.0",
	"fqn": "com.example.hr/FullTime@1.0.0",
	"name": "Full Time",
	"description": "Full-time permanent employment.",
	"extends": ["com.example.hr/EmploymentType@^1.0.0"],
	"attributes": {
		"weeklyHours": {
			"kind": "primitive", "type": "uint8",
			"name": "Weekly Hours",
			"required": true,
			"description": "Standard contracted weekly hours."
		}
	}
}
```

Note that `FullTime` carries its own attribute `weeklyHours` — something a traditional enum value could never express.

A metadata schema class `HrSchemaInfo` is published as an ordinary class:

```json
{
	"ooml": "0.1.0",
	"fqn": "com.example.hr.meta/HrSchemaInfo@1.0.0",
	"name": "HR Schema Info",
	"description": "HR-specific schema annotations. Use as a metadata schema on HR artefacts.",
	"attributes": {
		"status": {
			"kind": "enum",
			"type": "com.example.hr.meta/HrSchemaStatus@^1.0.0",
			"name": "Status",
			"required": true,
			"description": "Publication status of this schema."
		},
		"maintainer": {
			"kind": "primitive",
			"type": "string",
			"name": "Maintainer",
			"description": "Team or individual responsible for this schema."
		}
	}
}
```

### 18.2 Example Distributed Class

`Employee` as a standalone distributed artefact with all short names expanded to full FQN ranges:

```json
{
	"ooml": "0.1.0",
	"fqn": "com.example.hr/Employee@1.2.0",
	"name": "Employee",
	"description": "A natural person in an employment relationship with the organisation.",
	"authors": ["Jane Smith <jane@example.com>"],
	"license": "Apache-2.0",
	"extends": ["com.example.hr/Person@^1.0.0"],
	"aliases": {
		"salary": "com.example.finance/Salary@^1.0.0"
	},
	"dependencies": {
		"com.example.hr/Person": "^1.0.0",
		"com.example.hr/Department": "^1.0.0",
		"com.example.hr/EmploymentType": "^1.0.0",
		"com.example.finance/Salary": "^1.0.0"
	},
	"attributes": {
		"employeeNumber": {
			"kind": "primitive", "type": "string",
			"name": "Employee Number",
			"required": true,
			"pattern": "^EMP-[0-9]{6}$",
			"description": "Human-readable employee reference number, e.g. EMP-001234."
		},
		"employmentType": {
			"kind": "enum",
			"type": "com.example.hr/EmploymentType@^1.0.0",
			"name": "Employment Type",
			"required": true,
			"description": "The nature of this person's engagement. Valid values are subtypes of EmploymentType, excluding EmploymentType itself."
		},
		"startDate": {
			"kind": "primitive", "type": "date",
			"name": "Start Date",
			"required": true,
			"description": "Employment start date."
		},
		"endDate": {
			"kind": "primitive", "type": "date",
			"name": "End Date",
			"description": "Employment end date, if applicable.",
			"nullable": true
		},
		"department": {
			"kind": "class",
			"type": "com.example.hr/Department@^1.0.0",
			"name": "Department",
			"required": true,
			"description": "The organisational unit this employee belongs to."
		},
		"manager": {
			"kind": "class",
			"type": "com.example.hr/Employee@^1.2.0",
			"name": "Manager",
			"description": "Direct line manager.",
			"nullable": true
		},
		"annualSalary": {
			"kind": "attribute",
			"type": "com.example.finance/Salary@^1.0.0",
			"name": "Annual Salary",
			"description": "Annual gross salary. Aliased as 'salary' for ergonomic access.",
			"nullable": true
		},
		"schemaVersion": {
			"kind": "primitive", "type": "string",
			"name": "Schema Version",
			"static": true, "final": true, "value": "1",
			"description": "Schema version discriminator for Employee. Fixed for this class and all subclasses."
		}
	}
}
```

### 18.3 Type Hierarchy

With multi-inheritance, the hierarchy is a DAG rather than a tree:

```
com.example.hr/Auditable@1.0.0  (abstract)
└── com.example.hr/Party@1.1.0  (abstract)
    ├── com.example.hr/Department@1.0.0
    └── com.example.hr/Person@1.0.0  (abstract)
        ├── com.example.hr/Employee@1.2.0
        └── com.example.hr/Contractor@1.0.0

com.example.hr/EmploymentType@1.0.0  (enum root)
├── com.example.hr/FullTime@1.0.0
├── com.example.hr/PartTime@1.0.0
├── com.example.hr/Contract@1.0.0
└── com.example.hr/Freelance@1.0.0
```

`EmploymentType` and its subtypes are ordinary classes. The `employmentType` slot on `Employee` uses `"kind": "enum"` to restrict values to subtypes of `EmploymentType`, excluding `EmploymentType` itself — so valid values are `FullTime`, `PartTime`, `Contract`, `Freelance`, or any future subtype.

MRO of `Employee@1.2.0` (depth-first, left-to-right):
`Employee` → `Person` → `Party` → `Auditable`

Full resolved attribute surface of an `Employee` instance (in MRO order):

| Accessor name | Source | Attribute identity |
|---------------|--------|-------------------|
| `createdAt` | `Auditable` | `com.example.hr/Auditable@1.0.0#createdAt` |
| `updatedAt` | `Auditable` | `com.example.hr/Auditable@1.0.0#updatedAt` |
| `id` | `Party` | `com.example.hr/Party@1.1.0#id` |
| `firstName` | `Person` | `com.example.hr/Person@1.0.0#firstName` |
| `lastName` | `Person` | `com.example.hr/Person@1.0.0#lastName` |
| `dateOfBirth` | `Person` | `com.example.hr/Person@1.0.0#dateOfBirth` |
| `addresses` | `Person` | `com.example.hr/Person@1.0.0#addresses` |
| `displayName` *(transient)* | `Person` | `com.example.hr/Person@1.0.0#displayName` |
| `employeeNumber` | `Employee` | `com.example.hr/Employee@1.2.0#employeeNumber` |
| `employmentType` *(enum: EmploymentType subtypes)* | `Employee` | `com.example.hr/Employee@1.2.0#employmentType` |
| `startDate` | `Employee` | `com.example.hr/Employee@1.2.0#startDate` |
| `endDate` | `Employee` | `com.example.hr/Employee@1.2.0#endDate` |
| `department` | `Employee` | `com.example.hr/Employee@1.2.0#department` |
| `manager` | `Employee` | `com.example.hr/Employee@1.2.0#manager` |
| `annualSalary` / `salary` *(alias)* | `Employee` | `com.example.finance/Salary@1.0.0` |
| `schemaVersion` | `Employee` | `com.example.hr/Employee@1.2.0#schemaVersion` |

### 18.4 Dependency Graph

```
com.example.hr/Employee@1.2.0
  --[extends]-->          com.example.hr/Person@^1.0.0
  --[class]-->            com.example.hr/Department@^1.0.0
  --[class]-->            com.example.hr/Employee@^1.2.0   (self-reference; exempt)
  --[enum]-->             com.example.hr/EmploymentType@^1.0.0
  --[attribute-import]--> com.example.finance/Salary@^1.0.0
  --[alias]-->            com.example.finance/Salary@^1.0.0

com.example.hr/Person@1.0.0
  --[extends]-->   com.example.hr/Party@^1.1.0
  --[object]-->    com.example.hr/PostalAddress@^1.0.0

com.example.hr/Party@1.1.0
  --[extends]-->   com.example.hr/Auditable@^1.0.0

com.example.hr/Department@1.0.0
  --[extends]-->   com.example.hr/Party@^1.1.0
  --[class]-->     com.example.hr/Department@^1.0.0  (self-reference; exempt)

com.example.hr/PostalAddress@1.0.0
  --[enum]-->        com.example.hr/AddressType@^1.0.0
```

**Example dependency insight query:** "What directly depends on `com.example.hr/Department@1.0.0`?"

Result (from any tooling that indexes the dependency graph):
- `com.example.hr/Employee@1.2.0` (class edge)
- `com.example.hr/Contractor@1.0.0` (set element class edge)
- `com.example.hr/Department@1.0.0` (self-reference class edge)

**Example dependency insight query:** "What directly depends on `com.example.finance/Salary@1.0.0`?"

Result:
- `com.example.hr/Employee@1.2.0` (attribute-import edge and alias edge)

---

## 19. Grammar (ABNF)

The following ABNF provides a normative grammar for the non-JSON structural elements of OOML.

```abnf
; Namespace
namespace        = lc-segment 1*("." lc-segment)
lc-segment       = LOWER *( LOWER / DIGIT )

; Names
class-name       = UPPER *( ALPHA / DIGIT )        ; PascalCase (classes and enum roots)
attrdef-name     = UPPER *( ALPHA / DIGIT )        ; PascalCase
attr-slot-name   = LOWER *( ALPHA / DIGIT )        ; camelCase
alias-name       = LOWER *( ALPHA / DIGIT )        ; camelCase
group-name       = LOWER *( LOWER / DIGIT / "-" )

; Version (exact)
version          = major "." minor "." trivial [ pre-release ] [ build ]
major            = non-neg-int
minor            = non-neg-int
trivial          = non-neg-int
pre-release      = "-" identifier *("." identifier)
build            = "+" identifier *("." identifier)
identifier       = 1*( ALPHA / DIGIT / "-" )
non-neg-int      = "0" / ( %x31-39 *DIGIT )

; FQN (exact version — OOML artefact identities)
class-fqn        = namespace "/" class-name    "@" version
attrdef-fqn      = namespace "/" attrdef-name  "@" version
owned-attr-fqn   = class-fqn "#" attr-slot-name  ; inline-owned slots only

; FQN range (used in extends, type properties, aliases, dependencies map)
class-fqn-range   = namespace "/" class-name   "@" version-range
attrdef-fqn-range = namespace "/" attrdef-name "@" version-range

; Note: enum roots are ordinary classes; no separate enum-fqn form exists

; self — reserved authoring token; only valid in type, valueType, keyType positions
;        where a class FQN range is expected; MUST be expanded before distribution
self-ref = %s"self"   ; case-sensitive literal

; Version ranges
version-range    = exact-ver / caret-range / tilde-range / wildcard / comparison-range
exact-ver        = version
caret-range      = "^" version
tilde-range      = "~" version
wildcard         = "*"
comparison-range = ">=" version SP "<" version

; Character classes
UPPER  = %x41-5A   ; A-Z
LOWER  = %x61-7A   ; a-z
ALPHA  = UPPER / LOWER
DIGIT  = %x30-39
SP     = %x20
```

---

## 20. Design Notes and Rationale

### 20.1 Why JSON?

JSON is universally supported, human-editable, and requires no specialist tooling to read or write. Alternatives such as YAML or TOML were considered but introduce ambiguities (YAML's multi-document files, TOML's table-ordering behaviour) that complicate deterministic parsing.

### 20.2 Why multi-inheritance, and why does the diamond problem not apply?

OOML adopts multi-inheritance because real-world modelling requires orthogonal concerns to be composable independently of the primary taxonomic hierarchy. The `Commentable`, `Auditable`, `Taggable` pattern is ubiquitous in practice, and single inheritance forces either combinatorial class explosion or pollution of base classes with concerns that only some subtypes need.

The classical diamond problem — where two ancestors provide different definitions of the same attribute, creating an ambiguous resolution — does not arise in OOML because attributes are identified by FQN, not by local name. Two ancestors can both declare an attribute slot named `temperature` without conflict: if their slots reference different attribute definitions, they are simply different attributes that happen to share a local name. The collision is a presentation inconvenience, handled by aliasing (§13), not an identity or semantic conflict requiring a resolution rule.

The only genuine diamond case — where two ancestors both reference the exact same attribute definition FQN — is resolved by deduplication: the attribute appears once in the resolved set. No precedence rule is needed.

### 20.3 Why is the class (not a collection) the unit of versioning?

See the detailed rationale in the §0.2.0 changelog above. The short form: a versioned collection (package/model) creates a coarse, lossy dependency signal and turns dependency insight queries into expensive content-scanning operations. A flat registry of individually versioned classes makes those queries O(1) index lookups. Data models, unlike software libraries, have no holistic runtime behaviour that needs to be tested at collection level, so there is nothing lost by removing the collection as a versioning unit.

### 20.4 Why are authoring workflows not part of the language specification?

How classes are authored, grouped, and published before they become distributed artefacts is a tooling concern, not a language concern. Different tools may use file-based authoring, visual designers, database-backed editors, or direct JSON editing. The language defines only what a valid distributed artefact looks like. Authoring conventions are addressed in a separate tooling document.

### 20.5 Why are enumerations not a first-class artefact type?

Early versions of this specification included a dedicated `Enumeration` artefact type. This was removed in 0.4.0 because enumerations are fully subsumed by the class type hierarchy. A class serves as the enumeration root; its subtypes (excluding itself) are the members. This approach reduces the language surface, keeps the number of artefact types minimal, and gives enumeration members genuine expressive power — they can carry attributes, participate in further type hierarchies, and be independently versioned. The `"kind": "enum"` attribute slot preserves the enumerative constraint (subtypes of the root, excluding the root itself) without requiring a separate artefact type.

### 20.6 Why are self-referential `class` and `enum` attribute slots exempt from cycle detection?

A `class` or `enum` slot holds a reference to a class in the type hierarchy, not a structural embedding of that class's definition. A class declaring a `class` slot whose `type` is itself — or an ancestor of itself — is expressing a data-level relationship: "the value of this slot is a reference to this class or one of its subtypes." The class does not need to structurally contain or inherit from itself to express this. Similarly, an `enum` slot whose root is an ancestor of the declaring class is simply recording that the slot's value must be chosen from a known set of classes — not that the declaring class structurally depends on itself. Only `object` and `attribute-import` slots create structural embedding dependencies that can form genuine definition cycles.

### 20.7 Why `self` resolves to the declaring class rather than the inheriting class

Making `self` covariant — where `self` in a superclass slot resolves to the subclass in each inheriting context — would mean a slot effectively has a different type at each level of the hierarchy. This is a form of implicit type override, which conflicts with OOML's explicit no-override rule (§11.2 rule 3). It also complicates the dependency graph: a covariant `self` slot would create a dependency from every subclass to itself, which is circular.

Non-covariant `self` keeps the semantics simple: the slot is typed to the declaring class, and any subclass that wants a self-typed slot with its own type may declare one explicitly. The inherited slot and the new slot have different types and different slot names, which is unambiguous.

### 20.8 Why use OOML itself as the metadata modelling language?

The alternative — restricting metadata to string key-value pairs — would make metadata human-readable but machine-opaque. A consuming tool could display a `schemaStatus` string but could not validate it, query it structurally, or depend on it with type safety. By using OOML classes as metadata schemas, the metadata system inherits the full capability of the language at no additional specification cost: versioning, inheritance, type safety, registry publication, and dependency tracking all apply automatically. The OSDU interoperability case illustrates this clearly — OSDU-specific schema properties that OOML does not natively support can be carried as typed, versioned metadata rather than freeform strings, enabling tooling to reason about them with the same machinery it uses for native OOML concepts. Metadata schemas are ordinary OOML classes and are managed identically to any other class.

### 20.9 Relationship to OWL/RDF

OWL and RDF provide powerful formal semantics including open-world assumption, reasoning, and logical inference. OOML deliberately adopts the closed-world assumption common in OOP: a class defines exactly the attributes it declares plus what it inherits, and no more. This tradeoff sacrifices some expressive power for significantly greater accessibility and tooling simplicity.

---

*End of OOML Specification Draft 0.1.0*
