import { useMemo } from "react";

let vuuComponentIdCount = 0;

export const useId = (id?: string) =>
  useMemo(() => id ?? `vuu-${++vuuComponentIdCount}`, [id]);
