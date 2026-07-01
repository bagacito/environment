# Spec

## Metadata

- Repository ID: `environment`
- Spec ID: `SPEC-002`
- Status: `approved`
- Title: `Typed environment accumulator return types`
- Source: `User request`
- Integrity: `framework template`

## User Request

`Environment.accumulate(...)` currently returns a type that collapses to `never`.
The `Environment` export should be declared with an explicit accumulator base type, using `ObjectAccumulator<Record<string, string | number | boolean>>` or an equivalent concrete base type, so that when a default config object is accumulated, TypeScript preserves both the accumulator methods and the accumulated config fields.
For example, a test-only config such as `type config = { mode: string, active: boolean, sequence: number }` with `const defaultConfig: config = { mode: "maintenance", active: true, sequence: 1 }` should allow `const environment = Environment.accumulate(defaultConfig)` and then `environment.mode` and `environment.accumulate(...)` should both be available in TypeScript.
The example config is for testing the type contract and does not need to be implemented as production code.

## Problem Statement

The repository already provides an environment-aware accumulator, but its TypeScript type surface does not preserve the accumulated object shape when `.accumulate(...)` is used.
That prevents ergonomic use of the returned value and makes the accumulator less useful for consumers who need both the object fields and the accumulator methods.

## Goals

- Give `Environment` a defined accumulator base type instead of collapsing to `never`, using `Record<string, string | number | boolean>` or an equivalent explicit concrete base type.
- Preserve accumulated object properties on the return type of `Environment.accumulate(...)`.
- Preserve the accumulator methods on the returned object so callers can continue to chain `.accumulate(...)`.
- Keep the source implementation TypeScript-first and explicit.
- Cover the type behavior with tests that use simple example config objects.

## Non-goals

- Changing the runtime environment parsing behavior already implemented in SPEC-001.
- Adding UI or API surface.
- Exporting the example config objects from production code.
- Reworking the repository into a broader configuration library.

## Current Behavior

- `Environment.accumulate(defaultConfig)` does not provide a useful preserved object type in TypeScript.
- Consumers cannot rely on the returned value exposing both the accumulated fields and the accumulator methods with good inference.

## Desired Behavior

- `Environment` has a defined generic accumulator base type such as `Record<string, string | number | boolean>`.
- `Environment.accumulate(defaultConfig)` returns a value typed as the accumulated config plus the accumulator methods.
- Accessing `environment.mode`, `environment.active`, and `environment.sequence` is type-safe in TypeScript.
- Chaining `environment.accumulate(...)` remains type-safe after accumulation.
- The examples used to verify the type contract remain test-only.

## Affected Areas

- `src/Environment.ts`
- `tests/unit/`
- `README.md` if the public typing contract needs to be documented
- TypeScript type exports and the accumulator generic declaration

## Technical Constraints

- Keep using `typed-object-accumulator`.
- Preserve standard TypeScript export syntax.
- Do not weaken the runtime behavior established by SPEC-001.
- The accumulator return type must include both the accumulated object fields and the accumulator methods.
- Type tests may use example config objects such as `config` and `defaultConfig`, but those examples stay in tests.

## Constitution Impact

- No constitution change is required.
- The existing repository constitution already applies strict TypeScript, testing, and coverage rules.

## Acceptance Criteria

- `Environment` is declared with a defined accumulator type that does not collapse to `never`.
- `Environment.accumulate(defaultConfig)` preserves the fields from `defaultConfig` in its returned type.
- The returned value still exposes accumulator methods such as `.accumulate(...)`.
- Test-only example configs can demonstrate type-safe access to `mode`, `active`, and `sequence`.
- Existing runtime behavior from SPEC-001 remains unchanged.

## Testing Requirements

- Existing relevant tests first.
- New tests for TypeScript inference and chained accumulator usage.
- Add compile-time type tests that verify `Environment.accumulate(defaultConfig)` preserves both the object fields and accumulator methods. The type tests must fail at compile time if the inferred return type collapses to `never` or omits the accumulator methods, using explicit type assertions such as assignability checks or `@ts-expect-error` guards in `tests/unit`, and the repository must run an explicit TypeScript type-check step such as `tsc --noEmit` or an equivalent build-time type-check in CI so those failures are enforced before runtime tests pass.
- Add at least one runtime smoke test that confirms the accumulated object shape still behaves as expected at runtime.
- Coverage target for changed area: at least 90% when tooling exists.

## Documentation Requirements

- Update `README.md` only if the public typing contract needs to be explained to consumers.

## Security Considerations

- No new security-sensitive behavior is expected.
- Preserve the existing environment parsing protections from SPEC-001.

## Risks

- TypeScript generic changes can accidentally degrade inference for chained `.accumulate(...)` calls.
- A type-only fix could pass tests while leaving the runtime implementation untouched, so tests should exercise both type expectations and runtime shape.

## Assumptions

- Consumers need the accumulator methods on the accumulated object, not just the plain object fields.
- The example `config` and `defaultConfig` objects are test fixtures only.

## Implementation Tasks

- `TASK-002-001` Update `src/Environment.ts` so the exported accumulator uses an explicit base type such as `Record<string, string | number | boolean>` instead of collapsing to `never`, while keeping the runtime behavior from SPEC-001 unchanged.
- `TASK-002-002` Add compile-time type tests and a runtime smoke test that use test-only example config objects to verify TypeScript inference, chained `.accumulate(...)` usage, and the preserved accumulator return type.
- `TASK-002-003` Update documentation only if the new typing contract needs to be called out explicitly.

## Review Notes

- Spec review notes:
- Architect approval notes:
- Task review notes:

## Recommended Next Action

- `review spec environment SPEC-002`
