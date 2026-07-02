import { ObjectAccumulator } from "typed-object-accumulator";

type SupportedValue = string | number | boolean;
type EnvironmentArray = EnvironmentValue[];
type EnvironmentObject = {
  [key: string]: EnvironmentValue;
};
type EnvironmentValue = SupportedValue | EnvironmentObject | EnvironmentArray;
type EnvironmentEntry = {
  key: string;
  value: string;
};
type IndexedEnvironmentEntry = {
  key: string;
  tokens: string[];
  value: string;
};

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

function invalidEnvironmentKey(envKey: string): Error {
  const error = new Error(`Key ${envKey} is not allowed`);

  error.name = "INVALID ENVIRONMENT VARIABLE";

  return error;
}

function isPlainObject(value: unknown): value is EnvironmentObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSupportedValue(value: unknown): value is SupportedValue {
  return (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  );
}

function isNumericSegment(segment: string): boolean {
  return /^\d+$/.test(segment);
}

function normalizeEnvironmentSegment(segment: string): string {
  if (segment.startsWith("_") || segment.endsWith("_")) {
    throw invalidEnvironmentKey(segment);
  }

  return segment
    .split("_")
    .filter(Boolean)
    .map((part, index) => {
      const normalizedPart = part.toLowerCase();

      if (index === 0) {
        return normalizedPart;
      }

      return (
        normalizedPart.charAt(0).toUpperCase() + normalizedPart.slice(1)
      );
    })
    .join("");
}

function camelCaseToEnvironmentKey(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .toUpperCase();
}

function camelCaseToEnvironmentPath(pathSegments: string[]): string {
  return pathSegments.map(camelCaseToEnvironmentKey).join("__");
}

function tokenizeEnvironmentKey(envKey: string): string[] | undefined {
  if (envKey !== envKey.toUpperCase()) {
    return undefined;
  }

  try {
    const rawSegments = envKey.split("__");

    if (rawSegments.some((segment) => segment.length === 0)) {
      return undefined;
    }

    return rawSegments.map((segment) =>
      isNumericSegment(segment) ? segment : normalizeEnvironmentSegment(segment)
    );
  } catch {
    return undefined;
  }
}

function lenientNormalizeEnvironmentPath(
  envKey: string
): string[] | undefined {
  try {
    return envKey.split("__").filter(Boolean).map((segment) =>
      isNumericSegment(segment) ? segment : normalizeEnvironmentSegment(segment)
    );
  } catch {
    return undefined;
  }
}

function looseNormalizeEnvironmentPath(envKey: string): string[] | undefined {
  const tokens = tokenizeEnvironmentKey(envKey);

  if (tokens === undefined) {
    return undefined;
  }

  return tokens.map((token) => token.toLowerCase());
}

function parsePrimitiveValue(
  envKey: string,
  envValue: string,
  expectedType?: "string" | "number" | "boolean"
): SupportedValue {
  if (expectedType === "string") {
    return envValue;
  }

  if (expectedType === "boolean") {
    if (envValue === "true") {
      return true;
    }

    if (envValue === "false") {
      return false;
    }

    throw invalidEnvironmentVariable(envKey, "boolean");
  }

  if (expectedType === "number") {
    const parsedValue = Number(envValue);

    if (Number.isNaN(parsedValue)) {
      throw invalidEnvironmentVariable(envKey, "number");
    }

    return parsedValue;
  }

  if (envValue === "true") {
    return true;
  }

  if (envValue === "false") {
    return false;
  }

  const parsedValue = Number(envValue);

  if (!Number.isNaN(parsedValue) && envValue.trim() !== "") {
    return parsedValue;
  }

  return envValue;
}

function assertSafeKey(key: string): void {
  if (UNSAFE_KEYS.has(key)) {
    const error = new Error(`Key ${key} is not allowed`);

    error.name = "INVALID ENVIRONMENT VARIABLE";

    throw error;
  }
}

function getEnvironmentValue(
  pathSegments: string[]
): EnvironmentEntry | undefined {
  const exactKey = camelCaseToEnvironmentPath(pathSegments);
  const exactValue = process.env[exactKey];

  if (exactValue !== undefined) {
    return { key: exactKey, value: exactValue };
  }

  for (const [envKey, envValue] of Object.entries(process.env)) {
    if (envValue === undefined) {
      continue;
    }

    if (envKey.startsWith("_") || envKey.endsWith("_")) {
      const trimmedKey = envKey.replace(/^_+|_+$/g, "");

      if (
        trimmedKey.length > 0 &&
        looseNormalizeEnvironmentPath(trimmedKey)?.join(".") ===
          pathSegments.join(".")
      ) {
        throw invalidEnvironmentKey(envKey);
      }
    }

    if (looseNormalizeEnvironmentPath(envKey) === undefined) {
      if (lenientNormalizeEnvironmentPath(envKey)?.join(".") ===
        pathSegments.join(".")) {
        throw invalidEnvironmentKey(envKey);
      }
    }
  }

  return undefined;
}

function defineScalarProperty(
  target: EnvironmentObject,
  key: string,
  pathSegments: string[],
  defaultValue: SupportedValue
): void {
  let overrideValue: SupportedValue | undefined;

  Object.defineProperty(target, key, {
    configurable: true,
    enumerable: true,
    get() {
      if (overrideValue !== undefined) {
        return overrideValue;
      }

      const envEntry = getEnvironmentValue(pathSegments);

      if (envEntry === undefined) {
        return defaultValue;
      }

      return parsePrimitiveValue(
        envEntry.key,
        envEntry.value,
        typeof defaultValue as "string" | "number" | "boolean"
      );
    },
    set(nextValue: SupportedValue) {
      overrideValue = nextValue;
    },
  });
}

function buildObjectView(
  defaultObject: EnvironmentObject,
  pathSegments: string[]
): EnvironmentObject {
  const view = Object.create(null) as EnvironmentObject;

  for (const [key, defaultValue] of Object.entries(defaultObject)) {
    assertSafeKey(key);

    const nextPath = [...pathSegments, key];

    if (Array.isArray(defaultValue)) {
      defineArrayProperty(view, key, nextPath, defaultValue);
      continue;
    }

    if (isPlainObject(defaultValue)) {
      defineObjectProperty(view, key, nextPath, defaultValue);
      continue;
    }

    if (isSupportedValue(defaultValue)) {
      defineScalarProperty(view, key, nextPath, defaultValue);
    }
  }

  return view;
}

function defineObjectProperty(
  target: EnvironmentObject,
  key: string,
  pathSegments: string[],
  defaultValue: EnvironmentObject
): void {
  let overrideValue: EnvironmentObject | undefined;

  Object.defineProperty(target, key, {
    configurable: true,
    enumerable: true,
    get() {
      if (overrideValue !== undefined) {
        return overrideValue;
      }

      return buildObjectView(defaultValue, pathSegments);
    },
    set(nextValue: EnvironmentObject) {
      overrideValue = nextValue;
    },
  });
}

function collectIndexedEntries(
  pathSegments: string[]
): IndexedEnvironmentEntry[] {
  const entries: IndexedEnvironmentEntry[] = [];

  for (const [envKey, envValue] of Object.entries(process.env)) {
    if (envValue === undefined) {
      continue;
    }

    const tokens = tokenizeEnvironmentKey(envKey);

    if (tokens === undefined || tokens.length <= pathSegments.length) {
      continue;
    }

    const matchesPrefix = pathSegments.every(
      (segment, index) => tokens[index] === segment
    );

    if (!matchesPrefix) {
      continue;
    }

    const indexToken = tokens[pathSegments.length];

    if (!isNumericSegment(indexToken)) {
      continue;
    }

    entries.push({
      key: envKey,
      tokens: tokens.slice(pathSegments.length),
      value: envValue,
    });
  }

  return entries;
}

function materializeArrayFromEntries(
  entries: IndexedEnvironmentEntry[],
  templateArray: EnvironmentArray
): EnvironmentArray {
  if (entries.length === 0) {
    return templateArray;
  }

  const groupedByIndex = new Map<number, IndexedEnvironmentEntry[]>();

  for (const entry of entries) {
    const [indexToken, ...tokens] = entry.tokens;
    const index = Number(indexToken);

    const bucket = groupedByIndex.get(index);

    if (bucket === undefined) {
      groupedByIndex.set(index, [
        {
          key: entry.key,
          tokens,
          value: entry.value,
        },
      ]);
      continue;
    }

    bucket.push({
      key: entry.key,
      tokens,
      value: entry.value,
    });
  }

  const result: EnvironmentValue[] = [];
  const templateElement = templateArray[0];

  for (const index of Array.from(groupedByIndex.keys()).sort((a, b) => a - b)) {
    const elementEntries = groupedByIndex.get(index);

    const materializedElement = materializeArrayElement(
      elementEntries as IndexedEnvironmentEntry[],
      templateElement
    );

    if (materializedElement !== undefined) {
      result[index] = materializedElement;
    }
  }

  return result;
}

function materializeArrayElement(
  entries: IndexedEnvironmentEntry[],
  templateElement: EnvironmentValue | undefined
): EnvironmentValue | undefined {
  if (entries.length === 0) {
    return undefined;
  }

  const leafEntries = entries.filter((entry) => entry.tokens.length === 0);
  const nestedEntries = entries.filter((entry) => entry.tokens.length > 0);

  if (leafEntries.length > 0 && nestedEntries.length > 0) {
    throw invalidEnvironmentKey(leafEntries[0].key);
  }

  if (nestedEntries.length > 0) {
    if (isSupportedValue(templateElement)) {
      throw invalidEnvironmentKey(nestedEntries[0].key);
    }

    if (Array.isArray(templateElement)) {
      return materializeArrayFromEntries(nestedEntries, templateElement);
    }

    return materializeObjectFromEntries(
      nestedEntries,
      isPlainObject(templateElement) ? templateElement : undefined,
      true
    );
  }

  const leafEntry = leafEntries[0];

  if (Array.isArray(templateElement)) {
    throw invalidEnvironmentKey(leafEntry.key);
  }

  if (isPlainObject(templateElement)) {
    throw invalidEnvironmentKey(leafEntry.key);
  }

  return parsePrimitiveValue(
    leafEntry.key,
    leafEntry.value,
    isSupportedValue(templateElement)
      ? (typeof templateElement as "string" | "number" | "boolean")
      : undefined
  );
}

function materializeObjectFromEntries(
  entries: IndexedEnvironmentEntry[],
  templateObject: EnvironmentObject | undefined,
  allowUnknownKeys: boolean
): EnvironmentObject {
  const result = Object.create(null) as EnvironmentObject;
  const groupedByKey = new Map<string, IndexedEnvironmentEntry[]>();

  for (const entry of entries) {
    const [key, ...tokens] = entry.tokens;

    const bucket = groupedByKey.get(key);

    if (bucket === undefined) {
      groupedByKey.set(key, [
        {
          key: entry.key,
          tokens,
          value: entry.value,
        },
      ]);
      continue;
    }

    bucket.push({
      key: entry.key,
      tokens,
      value: entry.value,
    });
  }

  for (const [key, childEntries] of groupedByKey.entries()) {
    const hasTemplate = templateObject !== undefined && key in templateObject;

    if (!hasTemplate && !allowUnknownKeys) {
      continue;
    }

    const templateValue = hasTemplate ? templateObject[key] : undefined;
    const childValue = materializeValueFromEntries(
      childEntries,
      templateValue,
      true
    );

    if (childValue !== undefined) {
      result[key] = childValue;
    }
  }

  return result;
}

function materializeValueFromEntries(
  entries: IndexedEnvironmentEntry[],
  templateValue: EnvironmentValue | undefined,
  allowUnknownKeys: boolean
): EnvironmentValue | undefined {
  if (entries.length === 0) {
    return undefined;
  }

  if (Array.isArray(templateValue)) {
    return materializeArrayFromEntries(entries, templateValue);
  }

  const leafEntries = entries.filter((entry) => entry.tokens.length === 0);
  const nestedEntries = entries.filter((entry) => entry.tokens.length > 0);

  if (leafEntries.length > 0 && nestedEntries.length > 0) {
    throw invalidEnvironmentKey(leafEntries[0].key);
  }

  if (nestedEntries.length > 0) {
    if (isSupportedValue(templateValue)) {
      throw invalidEnvironmentKey(nestedEntries[0].key);
    }

    return materializeObjectFromEntries(
      nestedEntries,
      isPlainObject(templateValue) ? templateValue : undefined,
      allowUnknownKeys
    );
  }

  const leafEntry = leafEntries[0];

  if (leafEntry === undefined) {
    return undefined;
  }

  if (isPlainObject(templateValue)) {
    throw invalidEnvironmentKey(leafEntry.key);
  }

  return parsePrimitiveValue(
    leafEntry.key,
    leafEntry.value,
    isSupportedValue(templateValue)
      ? (typeof templateValue as "string" | "number" | "boolean")
      : undefined
  );
}

function defineArrayProperty(
  target: EnvironmentObject,
  key: string,
  pathSegments: string[],
  defaultValue: EnvironmentArray
): void {
  let overrideValue: EnvironmentArray | undefined;

  Object.defineProperty(target, key, {
    configurable: true,
    enumerable: true,
    get() {
      if (overrideValue !== undefined) {
        return overrideValue;
      }

      const entries = collectIndexedEntries(pathSegments);

      if (entries.length === 0) {
        return defaultValue;
      }

      return materializeArrayFromEntries(entries, defaultValue);
    },
    set(nextValue: EnvironmentArray) {
      overrideValue = nextValue;
    },
  });
}

class EnvironmentAccumulator<
  T extends object = EnvironmentObject,
> extends ObjectAccumulator<T> {
  override accumulate<V extends object>(
    value: V
  ): T & V & ObjectAccumulator<T & V> {
    for (const [key] of Object.entries(value)) {
      assertSafeKey(key);
    }

    const accumulated = super.accumulate(value);
    const environmentObject = buildObjectView(
      value as EnvironmentObject,
      []
    ) as V;
    const wrappedObject = environmentObject as Record<string, unknown>;

    for (const key of Object.keys(environmentObject)) {
      Object.defineProperty(accumulated, key, {
        configurable: true,
        enumerable: true,
        get() {
          return wrappedObject[key];
        },
        set(nextValue: unknown) {
          wrappedObject[key] = nextValue;
        },
      });
    }

    return accumulated;
  }
}

export const Environment = new EnvironmentAccumulator<EnvironmentObject>();
