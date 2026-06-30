# Spec

## Metadata

- Repository ID: `environment`
- Spec ID: `SPEC-001`
- Status: `approved`
- Title: `Environment object from environment variables`
- Source: `User request`
- Integrity: `framework template`

## User Request

Create an object that is sensible to environment variable changes using `ObjectAccumulator` imported from `typed-object-accumulator`.
The default object should act as an example and only be used in tests.
Production code should export an `Environment` instance from `src/Environment.ts`, and `src/index.ts` should re-export from that file.
The accumulated object should also be sensitive to environment variables.

## Problem Statement

The repository currently exposes only a trivial placeholder function and does not provide a typed environment object that can reflect runtime environment variable overrides.
The package needs a stable, typed export that provides the accumulator primitive now, while tests demonstrate how an example object is accumulated and overridden by environment-driven values.

## Goals

- Export an `Environment` instance backed by `ObjectAccumulator`.
- Keep the public entry point in `src/index.ts` as a re-export from `src/Environment.ts`.
- Keep the example default object available for tests, not as the production export.
- Ensure accumulated objects can reflect environment variable overrides.
- Validate and parse values according to the declared type definition when possible.
- Keep the public API simple and TypeScript-first.
- Cover the behavior with high-confidence Jest tests.

## Non-goals

- UI changes.
- API/server changes.
- Network access.
- Broad framework abstractions beyond the `typed-object-accumulator` usage requested.
- Rewriting the repository into a larger configuration system.
- Exporting a ready-made default environment object from production code.
- Keeping placeholder exports or placeholder tests after the implementation lands.

## Current Behavior

- The package exports a trivial `hello()` function from `src/index.ts`.
- Tests only verify the placeholder `hello()` behavior.
- No typed environment object exists yet.

## Desired Behavior

- `src/Environment.ts` exports a concrete `const Environment` instance created from `ObjectAccumulator`.
- `src/index.ts` re-exports the `Environment` export from `src/Environment.ts`.
- Tests define and use an example default object such as `{ mode: "test" }`.
- The example accumulated object can resolve `MODE=other` to `other` instead of `test`.
- Existing accumulated objects reflect later environment variable changes on subsequent property access.
- The accumulated object preserves the accumulator typing and supports accumulated object typing.
- Accumulated object keys follow lowercase notation.
- Values are parsed and validated from the type definition where possible.
- Only uppercase environment variables are supported for now.
- Uppercase environment variables are converted to lowercase object keys.
- The value type is inferred from the default object used for accumulation.
- Boolean values are parsed by matching the strings `true` or `false`.
- Number values are parsed with `Number(value)`.
- If the environment variable is missing, the default object value is used without parsing.
- Parsing only happens when the corresponding uppercase environment variable is present.
- Example type definitions such as `{ age: number, name: string, active: boolean }` are dynamically adjusted from environment variables like `AGE`, `NAME`, and `ACTIVE`.
- If a value cannot be parsed or validated for the declared type, the code throws a custom error named `INVALID ENVIRONMENT VARIABLE`.
- The error message includes the environment key that failed, the expected value type, and the received value type.
- The repository remains a simple TypeScript library with no UI and no API surface.

## Affected Areas

- `src/index.ts`
- `src/Environment.ts`
- `tests/unit/`
- `tests/integration/`
- `README.md` if public usage changes need to be documented
- TypeScript types and package export surface

## Technical Constraints

- Use `ObjectAccumulator` imported from `typed-object-accumulator` with `import { ObjectAccumulator } from "typed-object-accumulator";`.
- Keep the implementation TypeScript-first and explicit.
- Prefer a small, direct module export over additional abstractions.
- Do not use mocks unless they are strictly necessary for a unit test boundary such as environment access.
- Avoid mocking ordinary internal logic when a real test is practical.
- `src/index.ts` must re-export from `src/Environment.ts`.
- `Environment.ts` must define `const Environment` as the accumulator instance.
- Only uppercase environment variable names are supported.
- Uppercase environment variable names map to lowercase object keys.
- The accumulated value type is inferred from the default object passed to the accumulator.
- Boolean parsing must accept only `true` and `false`.
- Number parsing must use `Number(value)`.
- Default object values are used directly when the matching environment variable is absent.
- Only present environment variables are parsed.
- Remove the placeholder `hello` export and its placeholder test file after implementation.
- Use standard TypeScript export syntax for the code; ESM/CommonJS packaging is handled by the build script.
- Unit tests must live under `tests/unit`.
- Integration tests must live under `tests/integration`.
- Test file names must describe the behavior being tested.
- Any additional scenario-specific tests must live in the corresponding test-type folder.

## Constitution Impact

- No additional constitution change is required.
- The existing constitution already sets the repository scope to TypeScript-only, no UI, no API, and a 90% coverage target for changed areas.

## Acceptance Criteria

- `src/Environment.ts` exports `const Environment`.
- `src/index.ts` re-exports from `src/Environment.ts`.
- The example default object is only used in tests.
- Tests can create an accumulated object from the exported accumulator and example object.
- The accumulated example object resolves `mode` from environment variables when present.
- The accumulated example object reflects environment variable changes on property access without needing a new export.
- The accumulated object keys use lowercase notation.
- Supported value types cover strings, booleans, and numbers, with parsing and validation driven by the declared type.
- Example type definitions are adjusted from matching environment variables such as `AGE`, `NAME`, and `ACTIVE`.
- Boolean values are parsed from `true` and `false`.
- Number values are parsed with `Number(value)`.
- Invalid values throw `INVALID ENVIRONMENT VARIABLE` with the failing environment key, the expected type, and the received type.
- The exported value keeps the relevant accumulator typing.
- Existing relevant tests are executed before or alongside new tests.

## Testing Requirements

- Existing relevant tests first.
- New tests for the exported accumulator, the test-only example object, and override behavior.
- Tests should cover multiple examples beyond the provided `mode` sample where practical.
- Remove the placeholder `hello` test file instead of keeping it alongside the real tests.
- Place unit coverage under `tests/unit`.
- Place integration coverage under `tests/integration`.
- Name test files after the behavior under test.
- Coverage target for changed area: 90% when tooling exists.
- Prefer direct state setup over mocks.
- If `process.env` must be adjusted in a unit test, restore it after the assertion.

## Documentation Requirements

- Update `README.md` to reflect the spec changes, including the exported accumulator API, test-only example object usage, and environment override behavior.

## Security Considerations

- Treat environment variables as untrusted input.
- Avoid logging secrets or dumping the full environment.
- Keep error messages specific without exposing sensitive data.

## Risks

- The accumulator library may have specific key-mapping behavior that needs confirmation.
- Environment-based tests can become flaky if `process.env` is not restored carefully.
- The placeholder export and placeholder test file must be removed without breaking the package entry point.
- Type-driven parsing may differ between string, boolean, and number fields depending on the accumulator library's runtime behavior.
- The custom error path may need careful handling if the library defers parsing until property access.

## Assumptions

- `typed-object-accumulator` is the intended runtime dependency.
- The accumulator maps uppercase environment variables to lowercase object keys, such as `MODE` to `mode`.
- The package is intended to export a library API rather than a CLI or service.
- Type definitions are the source of truth for parsing and validation when environment values are read.

## Open Questions

- None.

## Implementation Tasks

- `TASK-001-001` Create `src/Environment.ts` with the `Environment` accumulator instance and make `src/index.ts` re-export it.
- `TASK-001-002` Add unit tests under `tests/unit` for default fallback, uppercase env overrides, lowercased keys, property-access refresh, boolean parsing, number parsing, and `INVALID ENVIRONMENT VARIABLE` error details.
- `TASK-001-003` Remove the placeholder `hello` export and placeholder test file, then update `README.md` to reflect the exported accumulator API and test-only usage.

## Review Notes

- Spec review notes:
- Architect approval notes:
- Task review notes:
- TASK-001-001 completed: added `src/Environment.ts` with `Environment` export and re-exported it from `src/index.ts`.
- TASK-001-002 completed: added unit tests under `tests/unit` covering default fallback, property-access refresh, uppercase env overrides, lowercase keys, boolean parsing, number parsing, and invalid value errors.
- TASK-001-002 verified with `npm test -- --runInBand`.
- TASK-001-003 completed: removed the placeholder test file and updated `README.md` to reflect the exported accumulator API and test-only usage.
- TASK-001-003 completed: placeholder `hello` export removed from `src/index.ts`.
- Validation completed with `npm run test:unit` and `npx jest tests/unit/environment-accumulator-behavior.test.ts --coverage --collectCoverageFrom='src/**/*.{ts,tsx}' --passWithNoTests --detectOpenHandles --runInBand`.
- Coverage for touched source files: 93.75% statements, 88.23% branches, 85.71% functions, 93.54% lines.
- Code review fix applied: fallback now uses the original default value when the environment variable is absent, and invalid-value errors report the received type explicitly.
- Security review fix applied: invalid-value errors no longer echo the raw environment value.
- Security hardening applied: unsafe accumulator keys (`__proto__`, `prototype`, `constructor`) are rejected before property definition.
- Validation report created at `.ai/reports/SPEC-001-test-report.md`.
- Documentation report created at `.ai/reports/SPEC-001-documentation-report.md`; README.md required no further changes.
- Code review report created at `.ai/reports/SPEC-001-code-review.md` with one requested fix: reject unsafe keys before mutating the accumulator.
- Code review fix applied: unsafe-key validation now runs before any accumulator mutation, with regression coverage added.
- Security report created at `.ai/reports/SPEC-001-security-review.md`; no open findings remain.
- Final report created at `.ai/reports/SPEC-001-final-report.md` with final decision `approved`.

## Recommended Next Action

- `review spec environment SPEC-001`
