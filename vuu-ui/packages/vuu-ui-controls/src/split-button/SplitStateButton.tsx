import { SplitButton, SplitButtonProps } from "./SplitButton";
import cx from "clsx";
import { forwardRef } from "react";

import "./SplitStateButton.css";

const classBase = "vuuSplitStateButton";

export interface SplitStateButtonProps extends SplitButtonProps {
  selected: boolean;
}

export const SplitStateButton = forwardRef<
  HTMLDivElement,
  SplitStateButtonProps
>(function SplitStateButton(
  { className, selected, ...splitButtonProps },
  forwardedRef
) {
  return (
    <SplitButton
      {...splitButtonProps}
      aria-checked={selected}
      className={cx(classBase, className)}
      ref={forwardedRef}
    />
  );
});
