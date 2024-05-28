import { SplitButton, SplitButtonProps } from "./SplitButton";
import cx from "clsx";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { forwardRef } from "react";

import splitStateButtonCss from "./SplitStateButton.css";

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
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-split-state-button",
    css: splitStateButtonCss,
    window: targetWindow,
  });

  return (
    <SplitButton
      {...splitButtonProps}
      aria-checked={selected}
      className={cx(classBase, className)}
      ref={forwardedRef}
    />
  );
});
