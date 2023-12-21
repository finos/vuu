import { DependencyList, EffectCallback, useLayoutEffect, useRef } from "react";

export const useLayoutEffectSkipFirst = (
  func: EffectCallback,
  deps: DependencyList
) => {
  const goodToGo = useRef(false);
  useLayoutEffect(() => {
    if (goodToGo.current) {
      func();
    } else {
      goodToGo.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
};
