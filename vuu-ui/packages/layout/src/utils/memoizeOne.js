function areInputsEqual(newInputs, lastInputs) {
  if (newInputs.length !== lastInputs.length) {
    return false;
  }

  for (let i = 0; i < newInputs.length; i++) {
    if (newInputs[i] !== lastInputs[i]) {
      return false;
    }
  }
  return true;
}

export default function memoizeOne(resultFn, isEqual = areInputsEqual) {
  let lastArgs = [];
  let lastResult;
  let calledAtLeastOnce = false;

  function memoized(...newArgs) {
    if (calledAtLeastOnce && isEqual(newArgs, lastArgs)) {
      return lastResult;
    }

    lastResult = resultFn.apply(this, newArgs);
    calledAtLeastOnce = true;
    lastArgs = newArgs;
    return lastResult;
  }

  return memoized;
}
