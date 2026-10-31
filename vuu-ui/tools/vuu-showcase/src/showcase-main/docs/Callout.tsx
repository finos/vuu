import type { ReactNode } from "react";
import { ChromeIcon, type ChromeIconName } from "../chrome/ChromeIcon";

export type CalloutType = "note" | "tip" | "info" | "warning" | "danger";

export interface CalloutProps {
  children?: ReactNode;
  type?: CalloutType;
}

const icons: Record<CalloutType, ChromeIconName> = {
  danger: "warning",
  info: "info",
  note: "info",
  tip: "lightbulb",
  warning: "warning",
};

const classBase = "ShowcaseCallout";

/**
 * An admonition (:::note etc, see scripts/remark-admonitions.ts) or a
 * blockquote, in a document. The first child of an admonition is its title.
 */
export const Callout = ({ children, type = "note" }: CalloutProps) => (
  <aside className={`${classBase} ${classBase}-${type}`}>
    <ChromeIcon className={`${classBase}-icon`} name={icons[type] ?? "info"} />
    <div className={`${classBase}-body`}>{children}</div>
  </aside>
);
