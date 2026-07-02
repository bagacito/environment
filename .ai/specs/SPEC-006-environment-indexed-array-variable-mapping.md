# Spec

## Metadata

- Repository ID: `environment`
- Spec ID: `SPEC-006`
- Status: `draft`
- Title: `Environment indexed array variable mapping`
- Source: `User request`
- Integrity: `framework template`

## User Request

Turn the array-handling analysis into an implementation-ready spec.

The implementation should support arrays from environment variables using indexed keys.

## Problem Statement

The environment accumulator currently supports scalar values and nested object paths, but it does not yet support arrays.

Consumers need a predictable way to express array-shaped configuration values using environment variables while preserving the repository’s existing uppercase input rule, camelCase object keys, nested object mapping, and type-driven parsing.

## Goals

- Support arrays using indexed environment variable keys.
- Keep the existing uppercase-only input rule.
- Preserve camelCase mapping for non-array object keys.
- Preserve nested object mapping with `__`.
- Parse primitive arrays and arrays of nested objects from the default object shape.
- Ignore undeclared environment variables.
- Preserve the existing property-access refresh behavior.
- Keep array handling TypeScript-first and compatible with the current accumulator API.
- Cover the new behavior with focused tests.

## Non-goals

- Supporting JSON array strings.
- Supporting delimiter-separated array strings.
- Supporting lowercase or mixed-case environment variable names.
- Changing the existing scalar parsing rules for strings, booleans, or numbers.
- Adding UI or API surface.

## Baseline Behavior

- Uppercase environment variables map to camelCase keys.
- Double underscore separates nested object levels.
- Undeclared variables are ignored.
- Scalar values are parsed from strings into the declared default type.
- Invalid scalar values throw `INVALID ENVIRONMENT VARIABLE`.

## Array Contract

- Arrays are encoded with numeric segments in the environment variable name.
- Numeric segments are treated as array indices only.
- A numeric suffix that is part of a segment name, such as `VAR0`, belongs to the property name.
- A numeric segment after `__` is treated as an array index only.
- Array indices are zero-based.
- Sparse indices are allowed.
- Missing indices are left unset in the resulting array.
- Empty arrays are supported.
- Primitive arrays and arrays of objects are both supported.
- Arrays of primitives use indexed leaf values.
- Arrays of objects use indexed nested paths.

## Examples

Primitive arrays:

- `TAGS__0=alpha`
- `TAGS__1=beta`
- `PORTS__0=3000`
- `PORTS__1=3001`

Object arrays:

- `SERVERS__0__HOST=api`
- `SERVERS__0__PORT=3000`
- `SERVERS__1__HOST=web`
- `SERVERS__1__PORT=3001`

The object shape inside array elements is not validated from the default object value.
Array elements are driven by the indexed environment variables that are present.

## Desired Behavior

- `TAGS__0` maps to `environment.tags[0]`.
- `TAGS__1` maps to `environment.tags[1]`.
- `SERVERS__0__HOST` maps to `environment.servers[0].host`.
- `SERVERS__1__PORT` maps to `environment.servers[1].port`.
- Numeric segments are accepted only as array indices.
- `VAR0` is treated as the property name `var0`, not as an array index.
- Non-numeric segments in array positions are ignored when they do not resolve to a declared path outside an array.
- Undeclared child keys inside a declared array object, such as `SERVERS__0__UNKNOWN`, are allowed and become part of the array element object.
- Malformed indexed paths that target a declared array path should throw `INVALID ENVIRONMENT VARIABLE`.
- Existing flat and nested object behavior continues to work.
- Undeclared environment variables remain ignored.
- Empty arrays remain valid even when no indexed variables are provided.

## Affected Areas

- `src/Environment.ts`
- `tests/unit/`
- `README.md`
- TypeScript type behavior if array inference needs documentation

## Technical Constraints

- Keep using `typed-object-accumulator`.
- Preserve standard TypeScript export syntax.
- Do not weaken runtime validation or property-access behavior established by prior specs.
- Keep uppercase environment variables as the only supported input form.
- Apply camelCase normalization within object segments.
- Preserve the existing security checks for unsafe keys and invalid values.
- Arrays must be inferred from the default object value passed to `Environment.accumulate(...)`.
- Array element object properties are not validated from a default sample element so empty arrays remain possible.
- Implement indexed arrays without changing the existing object-path contract for non-array values.

## Constitution Impact

- No constitution change is required.
- The existing constitution already covers TypeScript, Jest, coverage, and documentation rules.

## Acceptance Criteria

- `TAGS__0` and `TAGS__1` map to array entries on the accumulated object.
- `SERVERS__0__HOST` and `SERVERS__1__PORT` map to nested object entries inside arrays.
- Numeric segments are treated as array indices only.
- Array indices are zero-based.
- Sparse indices do not break the array contract.
- Undeclared array-like environment variables are ignored.
- Invalid array values on declared array paths throw `INVALID ENVIRONMENT VARIABLE`.
- Existing scalar and nested object behavior remains intact.
- The changed area is covered by tests.

## Testing Requirements

- Existing relevant tests first.
- Add tests for primitive arrays with at least two entries.
- Add tests for arrays of nested objects with at least two entries.
- Add tests for sparse indices.
- Add tests for undeclared array-like environment variables being ignored.
- Add tests for rejected undeclared child keys inside declared array objects.
- Add tests for invalid array values on declared array paths.
- Add tests to confirm existing scalar and nested object behavior still works.
- Coverage target for changed area: at least 90% when tooling exists.

## Documentation Requirements

- Update `README.md` to document indexed array environment variables, numeric segments as indices, and sparse index handling.

## Security Considerations

- Preserve the existing environment parsing protections.
- Avoid prototype pollution in array and object traversal.
- Keep error messages specific without exposing sensitive values.

## Risks

- Array indexing can collide with object traversal if numeric segments are not handled consistently.
- Sparse arrays can introduce unexpected gaps if not documented clearly.
- Arrays of objects increase the recursive parsing surface area.
- A naive implementation could accidentally treat numeric keys on ordinary objects as arrays.
- Declared array objects intentionally reject undeclared child keys to avoid inconsistent partial parsing.

## Assumptions

- The default object passed to `Environment.accumulate(...)` defines whether a path is an array.
- Numeric segments only represent array indices when they appear in an array path.
- Missing indices remain unset rather than being compacted.
- The environment variable examples in this spec are demonstrations only and must not be added as production exports.
- Segments like `VAR0` remain ordinary property names and are only treated as array indices when they appear immediately after `__`.
- Undeclared child keys inside declared array objects are allowed.
- Empty arrays are valid and do not require a sample element in the default object.

## Implementation Tasks

- `TASK-006-001` Update `src/Environment.ts` so indexed environment variables are mapped into arrays when the default object declares an array path.
- `TASK-006-002` Add or update unit tests for primitive arrays, arrays of objects, sparse indices, ignored undeclared variables, and invalid array values.
- `TASK-006-003` Update `README.md` to document indexed arrays and numeric index behavior.

## Review Notes

- Spec review notes:
- Architect approval notes:
- Task review notes:

## Recommended Next Action

- `review spec environment SPEC-006`
