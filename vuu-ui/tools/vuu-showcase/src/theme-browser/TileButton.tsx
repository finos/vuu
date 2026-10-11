import { Button, type ButtonProps } from "@salt-ds/core";
import cx from "clsx";
import { forwardRef } from "react";

/**
 * A Salt Button that takes its appearance entirely from the theme browser
 * class it is given (cards, rows, swatches, links).
 */
export const TileButton = forwardRef<HTMLButtonElement, ButtonProps>(
  function TileButton({ className, ...props }, ref) {
    return (
      <Button
        appearance="transparent"
        className={cx("tb-tile", className)}
        ref={ref}
        {...props}
      />
    );
  },
);
