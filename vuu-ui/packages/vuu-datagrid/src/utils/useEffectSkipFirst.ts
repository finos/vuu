import { useEffect, useRef } from 'react';

export const useEffectSkipFirst = (func: (...args: unknown[]) => void, deps: unknown[]) => {
  const goodToGo = useRef(false);
  useEffect(() => {
    if (goodToGo.current) {
      func();
    } else {
      goodToGo.current = true;
    }
  }, deps);
};
