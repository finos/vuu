import { useEffect, useRef } from 'react';

// eslint-disable-next-line react-hooks/exhaustive-deps
const useEffectSkipFirst = (func, deps) => {
  const goodToGo = useRef(false);
  useEffect(() => {
    if (goodToGo.current) {
      func();
    } else {
      goodToGo.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
};

export default useEffectSkipFirst;
