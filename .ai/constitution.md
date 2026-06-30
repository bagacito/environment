# Constitution

## Repository identity

- Repository ID: `environment`
- Status: `draft`
- Constitution version: `1.0`

## Purpose

Repository-scoped spec-driven work for the `environment` repository.
This repository is a simple TypeScript package with no UI and no API surface.

## Technology stack

- Status: `confirmed`
- Primary language: TypeScript
- Frameworks: Node.js package tooling
- Test tools: Jest, ts-jest
- UI tools: none

## Rule inheritance

- Follow the framework global rules as the baseline for workflow, coding, testing, review, and security.
- This constitution only adds repository-specific constraints and may not weaken framework rules.

## Repository structure

- `src/` contains the TypeScript source code.
- `tests/` contains Jest tests.
- `package.json` defines scripts, metadata, and package entry points.
- `tsconfig.json` defines strict TypeScript compilation settings.
- `jest.config.cjs` defines the Jest test runner configuration.
- `eslint.config.js` defines linting rules.
- `README.md` documents the package purpose.
- Generated output is expected under `lib/`, with documentation or report artifacts under `docs/` or `workdocs/` when created by tooling.

## Architecture rules

- Keep the repository small and focused on TypeScript library code.
- Prefer direct, explicit functions and modules over framework-style abstractions.
- Avoid adding UI, API, browser, or server layers unless a spec explicitly changes the repository scope.
- Keep side effects isolated and easy to test.

## Coding rules

- Use strict TypeScript and keep types explicit where they clarify contracts.
- Prefer readable, small functions with stable exported APIs.
- Avoid unsafe `any` unless there is a documented and approved reason.
- Validate untrusted input at boundaries.
- Fail explicitly instead of hiding errors.

## Testing rules

- Existing relevant tests must run before new tests are added.
- Protect existing behavior tests unless the user explicitly approves changes.
- Prefer unit tests for all logic that can be exercised in isolation.
- Minimize mocks.
- Only mock network or filesystem boundaries in unit tests when strictly necessary.
- Do not use mocks to replace ordinary internal logic when a real test is practical.
- Add tests for new or changed behavior.
- Keep tests deterministic and focused on observable behavior.

## Coverage target

- Target for changed or newly added areas: 90% when coverage tooling exists.
- Coverage scope:
- Focus coverage on the changed or newly added code paths, not unrelated files.

## Jest rules

- Use Jest for unit and integration-style library tests.
- Prefer clear assertions over implementation-detail checks.
- Use real code paths wherever practical.
- Use mocks only when a dependency boundary must be isolated for a unit test and no simpler test is practical.

## Playwright rules

- Not applicable.

## Angular rules

- Not applicable.

## NestJS rules

- Not applicable.

## API rules

- Not applicable.

## UI rules

- No UI is part of this repository.

## Documentation rules

- Update `README.md` and related docs when package behavior, scripts, setup, or public usage changes.
- Keep documentation aligned with the approved spec and the current package structure.

## Security rules

- Avoid unsafe filesystem, process, or shell behavior unless a spec explicitly requires it.
- Keep secrets and credentials out of source control, logs, and test output.
- Treat external input as untrusted.

## Security review rules

- Security review must check filesystem access, command execution, dependency risk, secret handling, and error leakage.
- High and critical findings block final approval unless the user explicitly accepts the risk.

## Forbidden patterns

- UI implementation.
- API implementation.
- Broad mocking that hides real behavior.
- Unsafe `any` without justification.
- Silent failure paths.

## Project commands

- Use the package scripts in `package.json` as the project command surface.
- Test commands are centered on Jest, with `test:unit`, `test:integration`, and `coverage` available.

## Spec rules

- Specs are repository-scoped and stored under `.ai/specs/`.
- Specs must define the scope before implementation starts.

## Task rules

- Tasks live inside their parent spec.
- Tasks must be approved before execution.
- Implementation starts only through `task execute`.

## Report rules

- Validation and review reports must exist before final approval when the workflow requires them.
- Reports are stored under `.ai/reports/`.

## Constitution changelog

- 2026-06-30: Initialized repository constitution.
- 2026-06-30: Updated repository to TypeScript-only scope, inherited global rules, described current structure, and raised test coverage target to 90%.
