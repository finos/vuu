import { Button, Text } from "@salt-ds/core";
import { HTMLAttributes } from "react";
import cx from "classnames";

import "./DialogHeader.css";

const classBase = "vuuDialogHeader";

export interface DialogHeaderProps extends HTMLAttributes<HTMLDivElement> {
  hideCloseButton?: boolean;
  onClose: () => void;
}

export const DialogHeader = ({
  hideCloseButton = false,
  title,
  onClose,
  ...htmlAttributes
}: DialogHeaderProps) => {
  return (
    <div {...htmlAttributes} className={cx(classBase, "vuuToolbarProxy")}>
      <Text className="dialogHeader">{title}</Text>
      {!hideCloseButton && (
        <Button
          key="close"
          onClick={onClose}
          data-align="end"
          data-icon="close"
          variant="secondary"
        />
      )}
    </div>
  );
};
