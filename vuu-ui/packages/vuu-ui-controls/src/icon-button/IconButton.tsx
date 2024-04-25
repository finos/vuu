import cx from "clsx";
import { Button, ButtonProps } from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { Icon } from "./Icon";
import { forwardRef } from "react";

import iconButtonCss from "./IconButton.css";

const classBase = "vuuIconButton";

export interface IconButtonProps extends Omit<ButtonProps, "children"> {
  icon: string;
  size?: number;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton(
    { "aria-label": ariaLabel, className, icon, size, ...buttonProps },
    ref
  ) {
    const targetWindow = useWindow();
    useComponentCssInjection({
      testId: "vuu-icon-button",
      css: iconButtonCss,
      window: targetWindow,
    });

    return (
      <Button {...buttonProps} className={cx(classBase, className)} ref={ref}>
        <Icon aria-label={ariaLabel} name={icon} size={size} />
      </Button>
    );
  }
);
