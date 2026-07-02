# Spec

## Metadata

- Repository ID: `environment`
- Spec ID: `SPEC-004`
- Status: `draft`
- Title: `Environment nested double-underscore key mapping`
- Source: `User request`
- Integrity: `framework template`

## User Request

Add functionality to `Environment` beyond the current camelCase mapping behavior.
When an environment variable uses a double underscore, it should map to nested properties on the accumulated object.

Examples:

- `BASE__HOSTNAME` maps to `Environment.base.hostname`
- `BASE__HOSTNAME__URL` maps to `Environment.base.hostname.url`
- `BASE__HOST_NAME__URL` maps to `Environment.base.hostName.url`

A double underscore separates nesting levels.
Single underscores inside each segment still mark camelCase transitions.
Repeated double underscore sequences are rejected.
Leading and trailing double underscores are rejected.
The nested properties must be resolved from the default object shape supplied to `Environment.accumulate(...)`.
The example shapes in this spec are demonstrations only and must not be added as production exports.
Environment variables that do not map to a property declared in the default object shape are ignored.
Malformed environment variables are also ignored when they do not map to a declared property path.

## Problem Statement

The current mapping supports only flat camelCase keys derived from uppercase environment variables.
That is sufficient for single-level configuration, but it cannot express nested configuration objects such as `base.hostname.url`.

Consumers need a predictable nesting rule so grouped environment variables can populate nested object shapes without changing the package’s accumulator-based API.

## Goals

- Keep the existing uppercase-environment-variable behavior.
- Preserve the current camelCase mapping within a segment.
- Introduce nested property mapping when `__` is present in the environment variable name.
- Map each `__` boundary to one nesting level on the accumulated object.
- Reject repeated `__` sequences, including empty segments caused by consecutive separators.
- Reject leading and trailing `__`.
- Keep property access dynamic so changes in `process.env` are observed on subsequent reads.
- Preserve the existing parsing, validation, and security rules from prior specs.
- Ignore environment variables that are not declared by the default object shape.
- Ignore malformed environment variables when they do not resolve to a declared property path.
- Cover the new nested mapping with focused tests.

## Non-goals

- Supporting lowercase or mixed-case environment variable names.
- Adding array indexing or bracket-style path syntax.
- Inferring nested structure without a matching object shape in the default accumulator input.
- Changing the scalar parsing rules for strings, booleans, or numbers.
- Adding UI or API surface.

## Current Behavior

- Uppercase environment variables map to flat camelCase keys.
- `BACKEND_MODE` resolves to `backendMode`.
- Nested property access is not currently driven by environment variable name structure.

## Desired Behavior

- `BASE__HOSTNAME` resolves to `Environment.base.hostname`.
- `BASE__HOSTNAME__URL` resolves to `Environment.base.hostname.url`.
- `BASE__HOST_NAME__URL` resolves to `Environment.base.hostName.url`.
- A double underscore marks a nesting boundary.
- Single underscores within each segment still create camelCase transitions.
- `BASE____HOSTNAME` is rejected.
- `_BASE__HOSTNAME` is rejected.
- `BASE__HOSTNAME_` is rejected.
- The accumulated object should expose the nested shape through normal property access.
- Existing flat key mapping continues to work for single-segment names such as `MODE`.
- Existing parsing and refresh behavior continues to work after the nested mapping is applied.
- Unmatched environment variables such as `SOME_OTHER_VAR` are ignored.
- Only declared properties such as `SOME_VAR` are validated and parsed.

## Affected Areas

- `src/Environment.ts`
- `tests/unit/`
- `README.md`

## Technical Constraints

- Keep using `typed-object-accumulator`.
- Preserve standard TypeScript export syntax.
- Do not weaken runtime validation or property-access behavior established by prior specs.
- Keep uppercase environment variables as the only supported input form for now.
- Apply camelCase normalization within each nested segment.
- Preserve the existing security checks for unsafe keys and invalid values.
- The nested mapping must remain compatible with the current accumulator typing approach.
- Nested mapping must use the default object shape supplied to `Environment.accumulate(...)` as the source of truth for the available nested properties.
- Environment variables that do not resolve to a declared property path are ignored instead of raising an error.
- Recursive traversal of the default object shape should only attach accessors for declared object paths and declared scalar leaf properties.

## Constitution Impact

- No constitution change is required.
- The existing constitution already covers TypeScript, Jest, coverage, and documentation rules.

## Acceptance Criteria

- `BASE__HOSTNAME` maps to `Environment.base.hostname`.
- `BASE__HOSTNAME__URL` maps to `Environment.base.hostname.url`.
- `BASE__HOST_NAME__URL` maps to `Environment.base.hostName.url`.
- Single underscore segments still map to camelCase within a nesting level.
- `BASE____HOSTNAME` is rejected.
- `_BASE__HOSTNAME` is rejected.
- `BASE__HOSTNAME_` is rejected.
- Existing flat mappings such as `MODE -> mode` still work.
- `SOME_VAR` is validated when declared in the default object shape.
- `SOME_OTHER_VAR` is ignored when it is not declared in the default object shape.
- Malformed undeclared variables such as `_SOME_OTHER_VAR`, `SOME_OTHER_VAR_`, or `SOME____OTHER__VAR` are ignored if they do not resolve to a declared path.
- Property reads continue to refresh from `process.env` on access.
- Invalid values still throw `INVALID ENVIRONMENT VARIABLE` with the expected type information.
- The changed area is covered by tests.

## Testing Requirements

- Existing relevant tests first.
- Add tests for single-level, two-level, and multi-level nested mappings.
- Add tests for mixed underscore forms such as `BASE__HOST_NAME__URL`.
- Add tests for rejected repeated separators, leading separators, and trailing separators.
- Add tests to confirm existing flat camelCase mapping still works.
- Add tests to confirm undeclared environment variables are ignored.
- Add tests to confirm malformed undeclared environment variables are ignored.
- Add tests to confirm declared nested properties are still validated and parsed.
- Add tests to confirm property-access refresh still works with nested properties.
- Add tests for invalid values and unsafe key behavior if the nested implementation touches those paths.
- Coverage target for changed area: at least 90% when tooling exists.

## Documentation Requirements

- Update `README.md` to document the nested double-underscore mapping rule and examples if the package usage description changes.

## Security Considerations

- Preserve the existing environment parsing protections.
- Avoid introducing path traversal or prototype pollution behavior through nested key mapping.
- Keep error messages specific without exposing sensitive values.

## Risks

- Nested key mapping can silently mis-route values if path normalization is inconsistent across levels.
- A naive nested implementation could break the existing flat mapping behavior.
- Property access refresh may need careful handling when nested objects are resolved lazily.
- Unsafe key handling must still reject prototype-pollution vectors at every level.

## Assumptions

- The default object passed to `Environment.accumulate(...)` defines the nested shape available at runtime.
- `__` is the nesting separator.
- Single underscores inside a segment only affect camelCase conversion.
- Nested paths beyond the provided examples should follow the same recursive rule.
- Missing intermediate objects are not inferred beyond the default object shape.
- The test examples in this spec are demonstrations only and must remain test fixtures, not exported production values.
- The runtime should traverse the default object recursively and only attach accessors to declared object paths and declared scalar leaf properties.

## Implementation Tasks

- `TASK-004-001` Update `src/Environment.ts` so uppercase environment variables using `__` resolve to nested object paths while keeping current camelCase mapping within each segment.
- `TASK-004-002` Add or update unit tests for nested property mapping, mixed underscore segments, refresh behavior, and any edge cases clarified by the spec.
- `TASK-004-003` Update `README.md` to document the nested double-underscore mapping contract if the public usage description needs to change.

## Review Notes

- Spec review notes:
- Architect approval notes:
- Task review notes:

## Recommended Next Action

- `review spec environment SPEC-004`
