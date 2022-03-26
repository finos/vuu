export function arrayOfIndices(length: number): number[] {
  // not the neatest, but far and away the fastest way to do this ...
  const result = Array(length);
  for (let i = 0; i < length; i++) {
    result[i] = i;
  }
  return result;
}

export type PartitionTest<T> = (value: T, index: number) => boolean;

export function partition<T>(array: T[], test: PartitionTest<T>, pass: T[] = [], fail: T[] = []): [T[], T[]] {
  for (let i = 0, len = array.length; i < len; i++) {
    (test(array[i], i) ? pass : fail).push(array[i]);
  }

  return [pass, fail];
}
