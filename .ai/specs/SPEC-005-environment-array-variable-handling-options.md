# Spec

## Metadata

- Repository ID: `environment`
- Spec ID: `SPEC-005`
- Status: `completed`
- Title: `Environment array variable handling options`
- Source: `User request`
- Integrity: `framework template`

## User Request

Analyze ways to handle arrays from environment variables and draft a document showing possible solutions.

The document should compare candidate approaches rather than commit to one implementation immediately.

## Problem Statement

The current environment accumulator handles scalar values and nested object access, but there is no defined contract for array-shaped configuration values.

Array support is a common requirement for configuration systems, but the encoding choice affects:

- runtime parsing behavior
- type inference
- validation rules
- compatibility with existing scalar and nested mapping rules
- ease of use for consumers

The repository needs a clear analysis of the design space before choosing an implementation strategy.

## Goals

- Document multiple viable array encoding strategies for environment variables.
- Compare the tradeoffs of each approach.
- Identify the impact on parsing, validation, typing, and ergonomics.
- Keep the discussion consistent with the repository’s TypeScript-first, no-UI, no-API scope.
- Preserve the existing scalar and nested object rules as the baseline context for the analysis.

## Non-goals

- Implementing array support in code.
- Changing the current behavior for scalars, nested object paths, or uppercase env variable normalization.
- Introducing runtime or API changes before the design is selected.
- Adding UI, network, or service behavior.

## Baseline Behavior

- Uppercase environment variables map to camelCase keys.
- Double underscore separates nested object levels.
- Undeclared variables are ignored.
- Scalar values are parsed from strings into the declared default type.
- Invalid scalar values throw `INVALID ENVIRONMENT VARIABLE`.

## Candidate Solutions

### Option 1: JSON Array Strings

Use a single environment variable whose value is a JSON array.

Examples:

- `TAGS='["alpha","beta"]'`
- `PORTS='[3000, 3001]'`

Pros:

- Familiar to many developers.
- Supports nested arrays and arrays of objects naturally.
- Preserves a single-variable-per-field model.
- Easy to validate with `JSON.parse`.

Cons:

- Requires escaping and quoting in shells and deployment tools.
- More fragile to formatting mistakes.
- Harder to edit manually than simple scalar strings.
- Type validation becomes more complex for mixed structures.

Best fit:

- Arrays of objects.
- Arrays with nested data.
- Systems where JSON config is already accepted.

### Option 2: Delimiter-Separated Lists

Use a string delimiter such as `,` or `;` to split values into arrays.

Examples:

- `TAGS=alpha,beta,gamma`
- `PORTS=3000,3001,3002`

Pros:

- Easy to read and author manually.
- Works well for simple string or number arrays.
- Common in environment-driven configuration.
- No JSON escaping required.

Cons:

- Ambiguous when values may contain the delimiter.
- Requires escaping rules if arbitrary strings are allowed.
- Limited expressiveness for nested structures.
- Parsing becomes type-sensitive and heuristic-heavy.

Best fit:

- Flat arrays of strings, numbers, or booleans.
- Simple deployment setups.

### Option 3: Indexed Environment Keys

Represent arrays with numbered suffixes or nested indices in the key name.

Examples:

- `TAGS__0=alpha`
- `TAGS__1=beta`
- `SERVERS__0__HOST=api`
- `SERVERS__0__PORT=3000`

Numeric segments in this option are treated as array indices only.
They are not treated as ordinary object property names.

Pros:

- Works naturally with the existing `__` nesting rule.
- Supports arrays of objects without JSON parsing.
- Preserves per-element typing and validation.
- Avoids delimiter ambiguity inside values.

Cons:

- More verbose to author.
- Ordering and sparsity rules must be defined.
- Requires explicit handling for array length discovery.
- Less ergonomic for simple arrays of primitives.

Best fit:

- Arrays of objects.
- Arrays that should align with the current nested-key design.
- Strictly typed configuration contracts.

### Option 4: Type-Driven Hybrid

Choose the encoding based on the default object type:

- primitive arrays use delimiter-separated lists
- object arrays use indexed keys or JSON
- opt-in annotations or conventions decide the exact parser

Pros:

- Can optimize ergonomics per data shape.
- Gives a more flexible consumer experience.
- Can preserve type-driven parsing semantics.

Cons:

- Highest complexity.
- Hardest to document and reason about.
- Increases the chance of ambiguous parsing behavior.
- More implementation and test surface.

Best fit:

- Advanced consumers who need multiple array forms.
- A later-stage enhancement after simpler contracts are proven.

## Decision Direction

Option 3, indexed environment keys, is the preferred approach for implementation.

Reasoning:

- It aligns with the current `__`-based nested property model.
- It avoids delimiter collisions.
- It supports arrays of objects without requiring JSON formatting.
- Numeric segments are unambiguous array indices under this rule.

Other options remain documented for reference, but no classification or ranking is required beyond the preference for Option 3.

## Open Questions

- Should arrays be supported only when the default object type is explicitly an array?
- Should primitive arrays and object arrays use different encodings?
- Should malformed array values be ignored or throw an invalid environment variable error?
- Should empty arrays be expressible, and if so, how?
- Should mixed encodings be allowed in the same repository?
- Should sparse indices be allowed, and if so, how should missing slots be represented?
- Should array indices be required to start at `0`?

## Affected Areas

- `src/Environment.ts`
- `tests/unit/`
- `README.md`
- TypeScript type behavior if array inference is added later

## Testing Considerations

If array support is implemented later, the test plan should likely include:

- flat string array parsing
- number array parsing
- boolean array parsing
- nested object arrays
- invalid array syntax handling
- ignored undeclared array variables
- property-access refresh behavior

## Documentation Considerations

Any eventual implementation should document:

- the chosen array encoding
- how values are parsed
- how empty arrays are represented
- how arrays interact with nested keys
- how invalid values are reported

## Recommended Next Action

- `review spec environment SPEC-006`
