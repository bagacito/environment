# Spec

## Metadata

- Repository ID: `environment`
- Spec ID: `SPEC-008`
- Status: `draft`
- Title: `Environment custom parsers per field`
- Source: `User request`
- Integrity: `framework template`

## User Request

Create a proposal to implement custom parsers per field.

The proposal should describe the intended behavior, the public API shape, and the runtime resolution strategy.

## Problem Statement

The repository currently infers primitive value types from the default object and applies built-in parsing for strings, booleans, and numbers.

That works for common configuration fields, but it does not cover domain-specific values such as dates, enums, identifiers, or other structured strings that need custom parsing logic on a per-field basis.

Without a field-level parser mechanism, consumers must either post-process the accumulated object or encode custom parsing logic outside the repository, which weakens the repository’s type-driven configuration model.

## Goals

- Allow consumers to define custom parsers for specific fields.
- Keep the current default-object-driven type inference as the baseline.
- Preserve the existing behavior when no custom parser is supplied.
- Support custom parsers for nested fields and array element fields.
- Keep runtime parsing on property access.
- Keep the proposal TypeScript-first and compatible with the current accumulator API.
- Cover the new behavior with focused tests.

## Non-goals

- Introducing JSON-based configuration values.
- Changing the existing uppercase-only environment variable rule.
- Changing camelCase normalization or nested `__` path mapping.
- Replacing the existing built-in scalar parsing rules.
- Adding UI or API endpoints.
- Adding global parser behavior that applies to unrelated fields without explicit configuration.

## Current Behavior

- The accumulator resolves values from uppercase environment variables.
- CamelCase object keys and `__` nested paths are already supported.
- Arrays are already supported through indexed keys.
- Strings, booleans, and numbers are parsed from environment values using the default object type.
- Missing environment variables fall back to the default object value without parsing.
- Invalid values throw `INVALID ENVIRONMENT VARIABLE`.

## Proposed Implementation

### Public API

Extend `Environment.accumulate` to accept an optional second argument:

```ts
Environment.accumulate(defaultObject, {
  parsers: {
    createdAt: (value) => new Date(value),
    nested: {
      id: (value) => Number.parseInt(value, 10),
    },
    servers: {
      port: (value) => Number(value),
    },
  },
});
```

The new option is a parser tree that mirrors the shape of the default object.

### Parser Tree Contract

- A parser tree entry may be defined for any leaf field.
- Nested objects use nested parser objects.
- Arrays reuse the same nested parser tree for every element.
- Primitive arrays may define a parser directly on the array field, and that parser is applied to each indexed element.
- Object array fields may also define a parser directly on the array field, and that parser is applied to the parsed array value after indexed entries are materialized.
- Parser entries are optional and partial.
- When a parser is not defined for a field, the existing built-in parsing logic is used.

### Matching Rules

- The parser lookup follows the same object path as the resolved environment field.
- Array indices are ignored when matching parser trees, so one parser can apply to every element in an array.
- Example: a parser under `servers.port` applies to `SERVERS__0__PORT`, `SERVERS__1__PORT`, and so on.
- Example: a parser under `tags` applies to every indexed `TAGS__0`, `TAGS__1`, and so on.
- Parser lookup is case-sensitive to the normalized object keys, not to the raw environment variable names.

### Runtime Resolution Order

1. Check whether an environment variable is present for the field.
2. If the environment variable is missing, return the default object value unchanged.
3. If a parser exists for the field, run the custom parser on the raw string value.
4. If no parser exists, fall back to the built-in type parser.
5. If parsing fails, throw `INVALID ENVIRONMENT VARIABLE` with the environment key, the expected type or parser target, and the received type.
6. If a custom parser returns a value that does not satisfy the declared field type, throw `INVALID ENVIRONMENT VARIABLE`.

### Validation Rule

- Primitive fields must still resolve to the runtime kind declared by the default object value.
- Array fields must resolve to arrays.
- Object fields must resolve to plain objects.
- For parser-backed fields whose default exemplar is a specific runtime object, such as `Date`, the parser output must match that runtime kind.
- The parser does not change the declared TypeScript shape, it only changes how the runtime value is produced.

### Error Handling

- Parser-thrown errors should be wrapped or normalized into `INVALID ENVIRONMENT VARIABLE`.
- The error should identify the environment key that failed.
- The error should indicate whether the failure happened in a custom parser or the built-in parser path.
- Raw environment values should not be logged or echoed in error messages.

### Type Behavior

- The default object remains the source of truth for the resulting TypeScript type.
- Custom parsers change runtime conversion, not the compile-time shape.
- The parser output must still be validated against the declared field type before it is exposed.
- The accumulated object should still expose the same accumulator typing as before.

## Examples

### Date field

```ts
type Config = {
  createdAt: Date;
};

const defaultConfig: Config = {
  createdAt: new Date("2024-01-01T00:00:00.000Z"),
};

const config = Environment.accumulate(defaultConfig, {
  parsers: {
    createdAt: (value) => new Date(value),
  },
});
```

### Primitive array field

```ts
type Config = {
  tags: string[];
};

const defaultConfig: Config = {
  tags: ["alpha"],
};

const config = Environment.accumulate(defaultConfig, {
  parsers: {
    tags: (value) => value.trim(),
  },
});
```

### Nested numeric field

```ts
type Config = {
  nested: {
    retryAfterSeconds: number;
  };
};

const defaultConfig: Config = {
  nested: {
    retryAfterSeconds: 10,
  },
};

const config = Environment.accumulate(defaultConfig, {
  parsers: {
    nested: {
      retryAfterSeconds: (value) => Number(value),
    },
  },
});
```

### Array element field

```ts
type Config = {
  servers: {
    host: string;
    port: number;
  }[];
};

const defaultConfig: Config = {
  servers: [
    {
      host: "localhost",
      port: 3000,
    },
  ],
};

const config = Environment.accumulate(defaultConfig, {
  parsers: {
    servers: {
      port: (value) => Number(value),
    },
  },
});
```

## Affected Areas

- `src/Environment.ts`
- `tests/unit/`
- `README.md`
- TypeScript type definitions for the accumulator options

## Technical Constraints

- Preserve the current default behavior when no parser is supplied.
- Keep using `typed-object-accumulator`.
- Keep standard TypeScript export syntax.
- Keep property-access refresh behavior intact.
- Keep validation strict for malformed environment values.
- Preserve uppercase-only environment input.
- Preserve existing array and nested object path handling.
- Keep the parser tree safe from prototype pollution by rejecting unsafe keys.

## Constitution Impact

- No constitution change is required.
- The existing constitution already covers TypeScript, Jest, coverage, and documentation rules.

## Acceptance Criteria

- Consumers can define a parser for a specific field.
- Consumers can define parsers for nested object fields.
- Consumers can define parsers for array element fields.
- Missing environment values still return the default object value without invoking parsers.
- Built-in parsing continues to work when no custom parser is registered.
- Custom parser failures surface as `INVALID ENVIRONMENT VARIABLE`.
- Existing environment mapping behavior remains intact.

## Testing Requirements

- Add unit tests for a custom parser on a scalar field.
- Add unit tests for a custom parser on a nested field.
- Add unit tests for a custom parser on an array element field.
- Add unit tests confirming the parser is not called when the environment variable is missing.
- Add unit tests confirming parser errors become `INVALID ENVIRONMENT VARIABLE`.
- Add unit tests confirming built-in parsing still works on fields without custom parsers.
- Keep the changed area at or above 90% coverage when tooling exists.

## Documentation Requirements

- Update `README.md` to show the optional parser configuration.
- Document that parser trees mirror the default object shape.
- Document that array indices are ignored during parser matching.

## Security Considerations

- Treat parser functions as application-provided code and keep the library’s own validation strict.
- Do not echo raw environment values in error messages.
- Reject unsafe parser tree keys to avoid prototype pollution.
- Preserve the existing environment parsing protections.

## Risks

- Parser tree matching could become ambiguous if the API is too loose.
- Consumers may expect custom parsers to also alter compile-time types, which this proposal does not do.
- Array parser matching needs to ignore indices consistently or fields will be parsed unreliably.
- Wrapping parser errors without losing useful context requires careful error design.

## Assumptions

- The default object remains the source of truth for the field shape.
- Parser functions operate on raw string environment values.
- A parser tree is preferable to a stringly-typed registry because it mirrors the object structure already used by the repository.
- Array element parsers should apply to every indexed element of the same field.
- Custom parsing is only applied when the corresponding environment variable is present.
- Parser-backed fields may use any default value that is assignable to the declared TypeScript field type, including non-primitive runtime values when appropriate.

## Implementation Tasks

- `TASK-008-001` Extend the accumulator API to accept an optional parser tree alongside the default object.
- `TASK-008-002` Implement parser lookup for nested object paths and array element paths.
- `TASK-008-003` Add unit tests for scalar, nested, and array parser behavior.
- `TASK-008-004` Update `README.md` with parser configuration examples and matching rules.

## Review Notes

- Spec review notes:
- Architect approval notes:
- Task review notes:

## Recommended Next Action

- `review spec environment SPEC-008`
