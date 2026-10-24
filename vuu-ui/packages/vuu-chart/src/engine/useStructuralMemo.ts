import { useRef } from "react";

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  value !== null &&
  typeof value === "object" &&
  (Object.getPrototypeOf(value) === Object.prototype ||
    Object.getPrototypeOf(value) === null);

/**
 * Structural equality for plain objects and arrays. Class instances (e.g.
 * DataSource) and functions are compared by identity.
 */
export const isStructurallyEqual = (a: unknown, b: unknown): boolean => {
  if (a === b) {
    return true;
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    return (
      a.length === b.length && a.every((v, i) => isStructurallyEqual(v, b[i]))
    );
  }
  if (isPlainObject(a) && isPlainObject(b)) {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    return (
      keysA.length === keysB.length &&
      keysA.every((key) => isStructurallyEqual(a[key], b[key]))
    );
  }
  return false;
};

/**
 * Returns the previous value if structurally equal to the new value. Allows
 * consumers to pass inline object/array literals as props without causing
 * the chart structure to be rebuilt on every render.
 */
export const useStructuralMemo = <T>(value: T): T => {
  const ref = useRef(value);
  if (!isStructurallyEqual(ref.current, value)) {
    ref.current = value;
  }
  return ref.current;
};
