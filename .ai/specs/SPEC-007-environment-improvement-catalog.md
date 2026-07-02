# Spec

## Metadata

- Repository ID: `environment`
- Spec ID: `SPEC-007`
- Status: `draft`
- Title: `Environment improvement catalog`
- Source: `User request`
- Integrity: `framework template`

## User Request

Create a list with improvements or new functionalities that can be applied to the environment repository.

The goal of this spec is to document a practical backlog of follow-on capabilities for the current TypeScript environment accumulator.

## Problem Statement

The repository already covers the core environment-to-object mapping flow, including uppercase key handling, camelCase normalization, nested paths, type-driven parsing, array support, and property-access refresh behavior.

That leaves a set of adjacent improvements that could strengthen usability, validation, extensibility, and operational safety. The repository needs a clear, organized list of possible next steps so future specs can be selected without re-discovering the same options.

## Goals

- Document a useful list of improvements or new functionalities for the repository.
- Group the ideas by theme so the backlog is easy to scan.
- Keep the ideas aligned with the repository’s TypeScript-first, test-heavy, no-UI, no-API scope.
- Prefer items that build naturally on the current implementation.
- Distinguish between small quality-of-life changes and larger feature additions.

## Non-goals

- Implementing any of the listed improvements in this spec.
- Rewriting the current environment accumulator behavior.
- Expanding the repository into UI or API concerns.
- Re-litigating features that are already implemented and validated.

## Repository Snapshot

The current implementation already supports:

- uppercase-only environment variables
- camelCase key mapping
- nested object traversal with `__`
- indexed array traversal
- type-driven parsing for strings, booleans, and numbers
- invalid value errors with `INVALID ENVIRONMENT VARIABLE`
- property-access refresh behavior
- ignored undeclared environment variables
- TypeScript type preservation through the accumulator API

## Improvement Catalog

### 1. Custom parsers per field

Allow consumers to register parsing functions for specific keys or types.

Examples:

- `date` fields parsed through `new Date(...)`
- `bigint` fields parsed from string inputs
- enum-like string fields validated against an allowed set

Why it matters:

- reduces consumer-side boilerplate
- improves support for domain-specific config values
- keeps parsing rules explicit instead of heuristic

### 2. Optional and nullable values

Support fields that may be missing or intentionally empty.

Examples:

- `string | undefined`
- `number | null`
- nested optional branches

Why it matters:

- reflects real configuration shapes more accurately
- avoids sentinel defaults for values that are not always present

### 3. Strict mode for unknown variables

Add an opt-in mode that reports undeclared environment variables instead of ignoring them.

Possible behaviors:

- warn on unknown keys
- throw on unknown keys
- collect unknown keys for diagnostics

Why it matters:

- helps detect typos in deployment configuration
- makes production configuration drift easier to catch

### 4. Richer diagnostics

Improve error reporting with structured information.

Possible additions:

- source environment key
- expected type
- received value and inferred type
- path segments involved in the failure
- whether the failure came from a scalar, object, or array branch

Why it matters:

- makes debugging configuration failures faster
- improves automation around validation output

### 5. Multiple environment sources

Allow the accumulator to merge values from more than one source.

Examples:

- `process.env`
- a `.env` file snapshot
- a test-specific override object
- explicit runtime override layers

Why it matters:

- supports local development and deployment parity
- makes test setup easier without mutating global process state

### 6. Key prefix scoping

Support a configurable prefix for environment variables.

Examples:

- `APP_MODE`
- `SERVICE_DB__HOST`
- `ENVIRONMENT__NESTED__VALUE`

Why it matters:

- reduces naming collisions in shared deployment environments
- improves portability across services in the same runtime

### 7. Schema-driven validation

Support a richer schema layer on top of the default object shape.

Possible additions:

- min/max for numbers
- string length constraints
- pattern matching
- enum membership
- array length constraints

Why it matters:

- lets the repository validate beyond primitive type conversion
- makes configuration contracts more precise

### 8. Immutable snapshots

Offer an explicit snapshot mode that returns a frozen configuration view.

Why it matters:

- prevents accidental mutation after config resolution
- gives consumers a stable runtime object for production use

### 9. Cached resolution

Cache parsed values per access path until the relevant environment state changes.

Why it matters:

- reduces repeated parsing overhead
- keeps property-access refresh behavior available when needed

### 10. Support for additional primitive types

Extend parsing support beyond string, boolean, and number.

Candidates:

- `bigint`
- `Date`
- `symbol`-like tokens through custom parsers
- `null` and `undefined` through explicit conventions

Why it matters:

- broadens the usable configuration surface
- aligns the library with richer domain models

### 11. Config serialization helpers

Provide utilities to serialize accumulated objects back into env-compatible shapes.

Why it matters:

- useful for debugging
- useful for generating test fixtures
- useful for documentation and migration tooling

### 12. Developer tooling and examples

Add more repo-level support artifacts.

Examples:

- additional unit test fixtures
- type-inference examples
- README sections for common patterns
- migration notes for new parsing rules

Why it matters:

- reduces onboarding time
- makes future spec work easier to validate

## Suggested Priorities

### Near-term

- richer diagnostics
- strict mode for unknown variables
- optional and nullable values
- custom parsers per field

### Medium-term

- multiple environment sources
- key prefix scoping
- schema-driven validation
- immutable snapshots

### Long-term

- cached resolution
- additional primitive types
- serialization helpers
- broader developer tooling

## Affected Areas

- `src/Environment.ts`
- `tests/unit/`
- `README.md`
- `.ai/specs/`

## Open Questions

- Which of the catalog items should be turned into implementation specs first?
- Should strict mode warn or throw by default?
- Should custom parsers be declared on the default object, or through a separate schema input?
- Should cached resolution be opt-in or the default behavior?

## Review Notes

- Spec review notes:
- Architect approval notes:
- Task review notes:

## Recommended Next Action

- Review this catalog and select one improvement for the next implementation spec.
