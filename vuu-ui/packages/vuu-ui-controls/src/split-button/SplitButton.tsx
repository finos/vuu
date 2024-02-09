import { PopupMenu, PopupMenuProps } from "@finos/vuu-popups";
import { Button, ButtonProps } from "@salt-ds/core";
import { HTMLAttributes } from "react";
import { useSplitButton } from "./useSplitButton";
import cx from "clsx";

import "./SplitButton.css";

export interface SplitButtonProps extends HTMLAttributes<HTMLDivElement> {
  ButtonProps?: Partial<ButtonProps>;
  PopupMenuProps?: Partial<PopupMenuProps>;
  buttonText: string;
  segmented?: boolean;
}

const classBase = "vuuSplitButton";

export const SplitButton = ({
  ButtonProps: ButtonPropsProp,
  PopupMenuProps: PopupMenuPropsProp,
  buttonText,
  onClick,
  segmented = false,
  ...htmlAttributes
}: SplitButtonProps) => {
  const { ButtonProps, buttonRef, rootRef, PopupMenuProps, ...rootProps } =
    useSplitButton({
      ButtonProps: ButtonPropsProp,
      PopupMenuProps: PopupMenuPropsProp,
      classBase,
      onClick,
      segmented,
    });

  console.log({ ButtonProps });

  return (
    <div
      {...htmlAttributes}
      {...rootProps}
      className={cx(classBase, {
        [`${classBase}-segmented`]: segmented,
      })}
      ref={rootRef}
      data-showcase-center
      tabIndex={segmented ? undefined : 0}
    >
      <Button
        {...ButtonProps}
        className={`${classBase}-primary`}
        ref={buttonRef}
        variant="secondary"
      >
        {buttonText}
      </Button>
      <PopupMenu
        {...PopupMenuProps}
        className={`${classBase}-secondary`}
        icon={PopupMenuProps?.icon ?? "chevron-down"}
        tabIndex={segmented ? 0 : -1}
      />
    </div>
  );
};
