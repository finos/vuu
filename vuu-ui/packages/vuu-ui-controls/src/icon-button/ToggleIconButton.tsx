import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";
import { IconButton, IconButtonProps } from "./IconButton";

import toggleIconCss from "./ToggleIconButton.css";

const classBase = "vuuToggleIconButton";

export interface ToggleIconButtonProps extends Omit<IconButtonProps, "icon"> {
  isExpanded: boolean;
}

export const ToggleIconButton = ({
  className,
  isExpanded,
  size = 7,
  variant = "secondary",
  ...props
}: ToggleIconButtonProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-toggle-icon-button",
    css: toggleIconCss,
    window: targetWindow,
  });

  const icon = isExpanded ? "triangle-down" : "triangle-right";
  return (
    <IconButton
      {...props}
      className={cx(classBase, className)}
      icon={icon}
      size={size}
      variant={variant}
    />
  );
};
