import { Portal } from "@vuu-ui/vuu-popups";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { forwardRef } from "react";
import { Rect } from "./dragDropTypes";

import dropIndicatorCss from "./DropIndicator.css";

export const DropIndicator = forwardRef<
  HTMLDivElement,
  { className?: string; rect: Rect }
>(function DropIndicator({ rect }, forwardedRef) {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-drop-indicator",
    css: dropIndicatorCss,
    window: targetWindow,
  });

  const { left, top, width, height } = rect;
  return (
    <Portal>
      <div
        className={`vuuDropIndicator`}
        ref={forwardedRef}
        style={{ left, top, width, height }}
      />
    </Portal>
  );
});
