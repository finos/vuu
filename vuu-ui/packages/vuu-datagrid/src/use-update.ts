import { useLayoutEffect, useRef } from "react";

export default function useUpdate(
  callback: () => void,
  dependencies: unknown[]
) {
  const initialRender = useRef(true);

  /* eslint-disable react-hooks/exhaustive-deps */
  useLayoutEffect(() => {
    if (initialRender.current) {
      initialRender.current = false;
    } else {
      callback();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);
}
