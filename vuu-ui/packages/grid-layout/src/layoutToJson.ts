import { ReactElement } from "react";
import { componentToJson } from "./componentToJson";

export function layoutToJSON(component: ReactElement) {
  return componentToJson(component);
}
