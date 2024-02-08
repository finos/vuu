import { Button, ButtonProps } from "@salt-ds/core";
import { PopupMenu, PopupMenuProps } from "@finos/vuu-popups";
import { HTMLAttributes, useRef } from "react";

import "./SplitButton.css";

export interface SplitButtonProps extends HTMLAttributes<HTMLDivElement> {
  ButtonProps?: Partial<ButtonProps>;
  PopupMenuProps?: Partial<PopupMenuProps>;
  buttonText: string;
}

const classBase = "vuuSplitButton";

export const SplitButton = ({
  ButtonProps,
  PopupMenuProps: MenuProps,
  buttonText,
  ...htmlAttributes
}: SplitButtonProps) => {
  const rootRef = useRef<HTMLDivElement>(null);

  const PopupMenuProps: PopupMenuProps = {
    ...MenuProps,
    anchorElement: rootRef,
    menuClassName: `${classBase}-menu`,
    popupPlacement: "below-full-width",
  };

  return (
    <div
      {...htmlAttributes}
      className={classBase}
      ref={rootRef}
      data-showcase-center
    >
      <Button
        {...ButtonProps}
        className={`${classBase}-primary`}
        variant="secondary"
      >
        {buttonText}
      </Button>
      <PopupMenu
        {...PopupMenuProps}
        className={`${classBase}-secondary`}
        icon="chevron-down"
      />
    </div>
  );
};
