# environment

TypeScript package for environment-driven object accumulation.

## Export

The package exports `Environment` from `src/Environment.ts` and re-exports it from `src/index.ts`.

```ts
import { Environment } from "environment"
```

`Environment` is an `ObjectAccumulator` instance.
`Environment.accumulate(defaultConfig)` preserves the default config fields in the returned TypeScript type and keeps accumulator methods available for chaining.

```ts
type Config = {
  mode: string;
  nested: {
    id: number;
    token: string;
    active: boolean;
  };
  someVar: string;
  tags: string[];
  servers: {
    host: string;
    port: number;
  }[];
};

const defaultConfig: Config = {
  mode: "maintenance",
  nested: {
    id: 1,
    token: "secret",
    active: true,
  },
  someVar: "value",
  tags: ["alpha", "beta"],
  servers: [
    {
      host: "localhost",
      port: 3000,
    },
  ],
};

const environment = Environment.accumulate(defaultConfig);

environment.mode;
environment.nested.id;
environment.tags[0];
environment.servers[0].host;
environment.accumulate({ region: "eu-west-1" });
```

## Behavior

- Only uppercase environment variables are read.
- Uppercase environment variables map to camelCase object keys.
- `MODE` maps to `mode`.
- `NESTED__ID` maps to `nested.id`.
- `NESTED__TOKEN` maps to `nested.token`.
- `NESTED__ACTIVE` maps to `nested.active`.
- `TAGS__0` maps to `tags[0]`.
- `TAGS__1` maps to `tags[1]`.
- `SERVERS__0__HOST` maps to `servers[0].host`.
- `SERVERS__0__PORT` maps to `servers[0].port`.
- `BASE__HOSTNAME` maps to `base.hostname`.
- `BASE__HOSTNAME__URL` maps to `base.hostname.url`.
- `BASE__HOST_NAME__URL` maps to `base.hostName.url`.
- Array indices are zero-based.
- Sparse array indices are preserved.
- Empty arrays are supported.
- Leading and trailing underscores are rejected.
- Repeated `__` sequences are rejected when they target a declared property path.
- Environment variables that do not map to a declared property path are ignored.
- Undeclared keys inside declared array objects are allowed.
- Missing environment variables use the default object value.
- Present environment variables are parsed on property access.
- Supported value types are inferred from the default object:
  - `string`
  - `boolean`
  - `number`
- Array values follow the default array shape when available.
- Boolean values must be `true` or `false`.
- Number values are parsed with `Number(value)`.
- Invalid values throw `INVALID ENVIRONMENT VARIABLE`.
- Invalid value errors identify the environment key, expected type, and received type without echoing the raw value.

## Testing

Example default objects are for tests only and are not exported from the package.

The repository uses Jest tests under `tests/unit` for behavior coverage.
