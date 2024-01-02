export function isNotNullOrUndefined<T extends any>(
  value: T | undefined | null
): value is NonNullable<T> {
  return value !== undefined && value !== null;
}
