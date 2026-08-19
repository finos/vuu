import type { ReactElement } from "react";
import { componentToJson } from "./componentToJson";

/** @deprecated Use encodeGridLayoutDocument for GridLayout persistence. */
export function layoutToJSON(component: ReactElement) {
  return componentToJson(component);
}
