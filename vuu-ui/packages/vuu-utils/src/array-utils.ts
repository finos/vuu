export type PartitionTest<T> = (value: T, index: number) => boolean;

export function partition<T>(
  array: T[],
  test: PartitionTest<T>,
  pass: T[] = [],
  fail: T[] = []
): [T[], T[]] {
  for (let i = 0, len = array.length; i < len; i++) {
    (test(array[i], i) ? pass : fail).push(array[i]);
  }
  return [pass, fail];
}
