import { Button, Text } from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { HTMLAttributes } from "react";
import cx from "clsx";

import dialogHeaderCss from "./DialogHeader.css";

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
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-dialoh-header",
    css: dialogHeaderCss,
    window: targetWindow,
  });

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
