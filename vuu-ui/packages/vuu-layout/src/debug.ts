import { ReactElement } from "react";
import { typeOf } from "./utils";

export const tree = (el: ReactElement, depth = 0) => {
  const type = typeOf(el);
  const spaces = "          ";
  let str = `\n${spaces.slice(0, depth)}${type}`;
  if (type !== "View") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const els = (el.props as any).children || [];
    (Array.isArray(els) ? els : [els]).forEach((child) => {
      str += tree(child, depth + 1);
    });
  }

  return str;
};
