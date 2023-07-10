import { useMemo, useRef } from "react";

export const useInitialValue = <T = unknown>(value: T): T => {
  const ref = useRef<T>(value);
  return useMemo(() => ref.current, []);
};
