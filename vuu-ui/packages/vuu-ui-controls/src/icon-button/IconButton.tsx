import cx from "clsx";
import { Button, ButtonProps } from "@salt-ds/core";
import { Icon } from "@finos/vuu-icons";

import "./IconButton.css";

const classBase = "vuuIconButton";

export interface IconButtonProps extends Omit<ButtonProps, "children"> {
  icon: string;
}

export const IconButton = ({
  className,
  icon,
  ...buttonProps
}: IconButtonProps) => {
  return (
    <Button {...buttonProps} className={cx(classBase, className)}>
      <Icon name={icon} />
    </Button>
  );
};
