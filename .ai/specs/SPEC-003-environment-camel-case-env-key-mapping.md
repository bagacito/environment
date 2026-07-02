# Spec

## Metadata

- Repository ID: `environment`
- Spec ID: `SPEC-003`
- Status: `approved`
- Title: `Environment camelCase environment key mapping`
- Source: `User request`
- Integrity: `framework template`

## User Request

The current mapping to the `Environment` object is made by converting the environment variable name to lower case.
Refactor this behavior so environment variable names map to camelCase object keys instead.
Examples:

- `MODE` maps to `mode`
- `BACKEND_MODE` maps to `backendMode`
- `BACKEND_MODE_TEST` maps to `backendModeTest`
- `_MODE` is rejected
- `MODE_` is rejected
- `BACKEND__MODE` resolves the same as `BACKEND_MODE`

A single underscore character marks the camel case transition.
Leading underscores and trailing underscores are rejected for now.
Repeated internal underscores are ignored when forming the camelCase key.

## Problem Statement

The repository currently normalizes environment variable names by converting them to lower case, which limits the expressiveness of mapped object keys.
Consumers need a predictable camelCase mapping so grouped environment variables can map to nested-style property names without changing the package's object-based API.

## Goals

- Replace lower-case key normalization with camelCase key normalization.
- Keep uppercase environment variables as the supported input form.
- Preserve the existing runtime behavior for value parsing, validation, and property-access refresh.
- Keep the `Environment` API and accumulator behavior stable apart from the key-mapping rule.
- Cover the new mapping behavior with focused tests.

## Non-goals

- Adding support for lowercase or mixed-case environment variable inputs.
- Changing the type inference or supported scalar value parsing from SPEC-001 and SPEC-002.
- Adding UI or API surface.
- Reworking the repository into a configuration framework.

## Current Behavior

- Environment variable names are converted to lower case object keys.
- `BACKEND_MODE` currently maps to `backend_mode`-style normalization rather than camelCase.

## Desired Behavior

- `MODE` maps to `mode`.
- `BACKEND_MODE` maps to `backendMode`.
- `BACKEND_MODE_TEST` maps to `backendModeTest`.
- The mapping treats a single underscore as the camelCase boundary between segments.
- The mapping rejects leading or trailing underscores.
- The mapping ignores repeated internal underscore separators.
- Existing parsing and override behavior continues to work after the key-name transformation.

## Affected Areas

- `src/Environment.ts`
- `tests/unit/`
- `README.md`
- TypeScript exports if the key-mapping contract is documented

## Technical Constraints

- Keep using `typed-object-accumulator`.
- Preserve standard TypeScript export syntax.
- Do not weaken runtime validation or property-access behavior established by prior specs.
- Only uppercase environment variable names remain supported as inputs.
- The key mapping must transform underscore-delimited segments into camelCase keys consistently.

## Constitution Impact

- No constitution change is required.
- The existing repository constitution already covers TypeScript, Jest, coverage, and documentation rules.

## Acceptance Criteria

- Uppercase environment variables map to camelCase keys on the accumulated object.
- `MODE` resolves to `mode`.
- `BACKEND_MODE` resolves to `backendMode`.
- `BACKEND_MODE_TEST` resolves to `backendModeTest`.
- `_MODE` is rejected.
- `MODE_` is rejected.
- `BACKEND__MODE` resolves the same as `BACKEND_MODE`.
- Existing parsing and validation behavior remains intact.
- The changed area is covered by tests.

## Testing Requirements

- Existing relevant tests first.
- Add tests for camelCase key mapping across single and multi-segment environment variable names.
- Add tests for rejected leading and trailing underscore cases.
- Add tests that ensure repeated internal underscores are ignored in the mapping.
- Add tests to confirm parsing and property-access refresh still work after the key transformation.
- Coverage target for changed area: at least 90% when tooling exists.

## Documentation Requirements

- Update `README.md` to document the camelCase mapping rule and examples if the package behavior is user-facing.

## Security Considerations

- Preserve the existing environment parsing protections.
- Avoid introducing unsafe key transformation or property naming behavior.
- Keep error messages from exposing raw environment values where not already allowed by prior specs.

## Risks

- Key transformation bugs can silently mis-map multi-segment environment variables.
- Changing key normalization can break consumers that assumed lower-case keys.
- The new mapping may interact with existing property-access overrides if transformation is not applied consistently.

## Assumptions

- Consumers want camelCase object keys, not nested objects.
- The underscore separator is the only delimiter used for camelCase transitions, with leading and trailing underscores rejected and repeated internal separators ignored.
- Existing uppercase-only environment variable support remains in place.

## Open Questions

- None.

## Implementation Tasks

- `TASK-003-001` Update `src/Environment.ts` so uppercase environment variable names are transformed into camelCase keys using underscore-delimited segments.
- `TASK-003-002` Add or update unit tests to verify single-segment, two-segment, and multi-segment camelCase mappings, rejected leading or trailing underscore cases, repeated internal underscore handling, plus existing parsing and refresh behavior.
- `TASK-003-003` Update `README.md` to document the camelCase mapping contract if the public usage description needs to change.

## Review Notes

- Spec review notes:
- Architect approval notes:
- Task review notes:

## Recommended Next Action

- `review spec environment SPEC-003`
