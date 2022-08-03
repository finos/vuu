import { MutableRefObject, Ref, useMemo } from 'react';

type RefValue<T> = MutableRefObject<T | null> | ((instance: T | null) => void) | null | undefined;

function setRef<T>(ref: RefValue<T>, value: T | null) {
  if (typeof ref === 'function') {
    ref(value);
  } else if (ref) {
    ref.current = value;
  }
}

export function useForkRef<T>(
  refA: Ref<T> | null | undefined,
  refB: Ref<T> | null | undefined
): Ref<T> | null {
  /**
   * This will create a new function if the ref props change and are defined.
   * This means react will call the old forkRef with `null` and the new forkRef
   * with the ref. Cleanup naturally emerges from this behavior
   */
  return useMemo(() => {
    if (refA == null && refB == null) {
      return null;
    }
    return (refValue) => {
      setRef(refA, refValue);
      setRef(refB, refValue);
    };
  }, [refA, refB]);
}
