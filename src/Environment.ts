import { ObjectAccumulator } from "typed-object-accumulator";

type SupportedValue = string | number | boolean;
type EnvironmentShape = Record<string, SupportedValue>;
const UNSAFE_KEYS = new Set(["__proto__", "prototype", "constructor"]);

function invalidEnvironmentVariable(
  envKey: string,
  expectedType: string
): Error {
  const error = new Error(
    `Key ${envKey} expected ${expectedType} but received type string`
  );

  error.name = "INVALID ENVIRONMENT VARIABLE";

  return error;
}

function readValue(key: string, defaultValue: SupportedValue): SupportedValue {
  const envKey = key.toUpperCase();
  const envValue = process.env[envKey];

  if (envValue === undefined) {
    return defaultValue;
  }

  if (typeof defaultValue === "string") {
    return envValue;
  }

  if (typeof defaultValue === "boolean") {
    if (envValue === "true") {
      return true;
    }

    if (envValue === "false") {
      return false;
    }

    throw invalidEnvironmentVariable(envKey, "boolean");
  }

  const parsedValue = Number(envValue);

  if (Number.isNaN(parsedValue)) {
    throw invalidEnvironmentVariable(envKey, "number");
  }

  return parsedValue;
}

function assertSafeKey(key: string): void {
  if (UNSAFE_KEYS.has(key)) {
    const error = new Error(`Key ${key} is not allowed`);

    error.name = "INVALID ENVIRONMENT VARIABLE";

    throw error;
  }
}

function defineEnvironmentProperty<T extends object>(
  target: T,
  key: string,
  defaultValue: SupportedValue
): void {
  let overrideValue: SupportedValue | undefined;

  Object.defineProperty(target, key, {
    configurable: true,
    enumerable: true,
    get() {
      const envKey = key.toUpperCase();
      const envValue = process.env[envKey];

      if (envValue !== undefined) {
        return readValue(key, defaultValue);
      }

      return overrideValue ?? defaultValue;
    },
    set(nextValue: SupportedValue) {
      overrideValue = nextValue;
    },
  });
}

class EnvironmentAccumulator<
  T extends object = EnvironmentShape,
> extends ObjectAccumulator<T> {
  override accumulate<V extends object>(
    value: V
  ): T & V & ObjectAccumulator<T & V> {
    for (const [key, defaultValue] of Object.entries(value)) {
      assertSafeKey(key);
    }

    const accumulated = super.accumulate(value);

    for (const [key, defaultValue] of Object.entries(value)) {
      if (
        typeof defaultValue === "string" ||
        typeof defaultValue === "number" ||
        typeof defaultValue === "boolean"
      ) {
        defineEnvironmentProperty(
          accumulated,
          key,
          defaultValue as SupportedValue
        );
      }
    }

    return accumulated;
  }
}

export const Environment = new EnvironmentAccumulator<EnvironmentShape>();
