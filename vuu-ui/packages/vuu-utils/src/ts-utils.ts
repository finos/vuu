export function isNotNullOrUndefined<T>(
  value: T | undefined | null,
): value is NonNullable<T> {
  return value !== undefined && value !== null;
}

export const isObject = (o: unknown): o is object =>
  typeof o === "object" && o !== null;
