export function arrayOfIndices(length) {
  // not the neatest, but far and away the fastest way to do this ...
  const result = Array(length);
  for (let i = 0; i < length; i++) {
    result[i] = i;
  }
  return result;
}

export function partition(array, test, pass = [], fail = []) {
  for (let i = 0, len = array.length; i < len; i++) {
    (test(array[i], i) ? pass : fail).push(array[i]);
  }

  return [pass, fail];
}
