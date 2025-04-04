import { LayoutJSON, LayoutModel, WithType } from "@finos/vuu-utils";
import { ReactElement } from "react";

export function typeOf(element?: LayoutModel | WithType): string | undefined {
  if (element) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const type = element.type as any;
    if (typeof type === "function" || typeof type === "object") {
      const elementName = type.displayName || type.name || type.type?.name;
      if (typeof elementName === "string") {
        return elementName;
      }
    }
    if (typeof element.type === "string") {
      return element.type;
    }
    if (element.constructor) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (element.constructor as any).displayName as string;
    }
    throw Error(`typeOf unable to determine type of element`);
  }
}

export const isTypeOf = (element: ReactElement, type: string) =>
  typeOf(element) === type;

export const isLayoutJSON = (layout: LayoutJSON): layout is LayoutJSON =>
  layout !== undefined && "type" in layout;
