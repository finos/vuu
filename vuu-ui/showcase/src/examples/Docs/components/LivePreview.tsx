import cx from "clsx";
import type { HTMLAttributes } from "react";

import "./LivePreview.css";

export interface LivePreviewProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Lay children out in a column with a gap between them, useful when an
   * example renders controls alongside a Table.
   */
  stacked?: boolean;
}

/**
 * Frames a live example within a documentation page. A fenced code block
 * immediately following a LivePreview is visually attached to it.
 */
export const LivePreview = ({
  children,
  className,
  stacked = false,
  ...htmlAttributes
}: LivePreviewProps) => (
  <div
    {...htmlAttributes}
    className={cx("vuuDocsLivePreview", className, {
      "vuuDocsLivePreview-stacked": stacked,
    })}
  >
    {children}
  </div>
);
