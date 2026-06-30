# environment

TypeScript package for environment-driven object accumulation.

## Export

The package exports `Environment` from `src/Environment.ts` and re-exports it from `src/index.ts`.

```ts
import { Environment } from "environment"
```

`Environment` is an `ObjectAccumulator` instance.

## Behavior

- Only uppercase environment variables are read.
- Uppercase environment variables map to lowercase object keys.
- Missing environment variables use the default object value.
- Present environment variables are parsed on property access.
- Supported value types are inferred from the default object:
  - `string`
  - `boolean`
  - `number`
- Boolean values must be `true` or `false`.
- Number values are parsed with `Number(value)`.
- Invalid values throw `INVALID ENVIRONMENT VARIABLE`.
- Invalid value errors identify the environment key, expected type, and received type without echoing the raw value.

## Testing

Example default objects are for tests only and are not exported from the package.

The repository uses Jest tests under `tests/unit` for behavior coverage.
