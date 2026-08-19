export type JsonPrimitive = boolean | number | string | null;
export type JsonValue =
  | JsonPrimitive
  | readonly JsonValue[]
  | { readonly [key: string]: JsonValue };

export type JsonValueErrorCode =
  | "CYCLE"
  | "INVALID_NUMBER"
  | "NON_PLAIN_OBJECT"
  | "UNSUPPORTED_VALUE";

export interface JsonValueIssue {
  readonly code: JsonValueErrorCode;
  readonly message: string;
  readonly path: string;
}

export type JsonValueResult =
  | { readonly ok: true; readonly value: JsonValue }
  | { readonly error: JsonValueIssue; readonly ok: false };

const error = (
  code: JsonValueErrorCode,
  message: string,
  path: string,
): JsonValueResult => ({ error: { code, message, path }, ok: false });

/**
 * Validate and detach data at the persistence boundary. JSON.stringify is not
 * used because it silently drops unsupported values and coerces non-finite
 * numbers.
 */
export const toJsonValue = (value: unknown, path = "$"): JsonValueResult => {
  const ancestors = new Set<object>();

  const visit = (
    candidate: unknown,
    candidatePath: string,
  ): JsonValueResult => {
    if (
      candidate === null ||
      typeof candidate === "string" ||
      typeof candidate === "boolean"
    ) {
      return { ok: true, value: candidate };
    }
    if (typeof candidate === "number") {
      return Number.isFinite(candidate)
        ? { ok: true, value: candidate }
        : error("INVALID_NUMBER", "numbers must be finite", candidatePath);
    }
    if (typeof candidate !== "object") {
      return error(
        "UNSUPPORTED_VALUE",
        `${typeof candidate} values are not valid JSON`,
        candidatePath,
      );
    }
    if (ancestors.has(candidate)) {
      return error("CYCLE", "cyclic values are not valid JSON", candidatePath);
    }

    const prototype = Object.getPrototypeOf(candidate);
    if (
      !Array.isArray(candidate) &&
      prototype !== Object.prototype &&
      prototype !== null
    ) {
      return error(
        "NON_PLAIN_OBJECT",
        "only arrays and plain objects are valid JSON",
        candidatePath,
      );
    }
    if (Object.getOwnPropertySymbols(candidate).length > 0) {
      return error(
        "UNSUPPORTED_VALUE",
        "symbol-keyed properties are not valid JSON",
        candidatePath,
      );
    }

    ancestors.add(candidate);
    if (Array.isArray(candidate)) {
      const propertyNames = Object.getOwnPropertyNames(candidate);
      const unexpectedProperty = propertyNames.find(
        (key) =>
          key !== "length" &&
          (!/^(?:0|[1-9]\d*)$/.test(key) || Number(key) >= candidate.length),
      );
      if (unexpectedProperty) {
        return error(
          "UNSUPPORTED_VALUE",
          `array property "${unexpectedProperty}" is not valid JSON`,
          `${candidatePath}.${unexpectedProperty}`,
        );
      }
      const result: JsonValue[] = [];
      for (let index = 0; index < candidate.length; index += 1) {
        const item = visit(candidate[index], `${candidatePath}[${index}]`);
        if (!item.ok) {
          return item;
        }
        result.push(item.value);
      }
      ancestors.delete(candidate);
      return { ok: true, value: result };
    }

    const result: Record<string, JsonValue> = {};
    for (const key of Object.getOwnPropertyNames(candidate).sort()) {
      const item = visit(
        (candidate as Record<string, unknown>)[key],
        candidatePath === "$" ? `$.${key}` : `${candidatePath}.${key}`,
      );
      if (!item.ok) {
        return item;
      }
      result[key] = item.value;
    }
    ancestors.delete(candidate);
    return { ok: true, value: result };
  };

  return visit(value, path);
};
