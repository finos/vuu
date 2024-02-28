import { PopupMenu, PopupMenuProps } from "@finos/vuu-popups";
import { Button, ButtonProps } from "@salt-ds/core";
import { HTMLAttributes } from "react";
import { useSplitButton } from "./useSplitButton";
import cx from "clsx";

import "./SplitButton.css";

export interface SplitButtonProps extends HTMLAttributes<HTMLDivElement> {
  ButtonProps?: Partial<Omit<ButtonProps, "variant">>;
  PopupMenuProps?: Partial<PopupMenuProps>;
  buttonText: string;
  segmented?: boolean;
  variant?: ButtonProps["variant"];
}

const classBase = "vuuSplitButton";

export const SplitButton = ({
  ButtonProps: ButtonPropsProp,
  PopupMenuProps: PopupMenuPropsProp,
  buttonText,
  onClick,
  segmented = false,
  variant = "primary",
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

  return (
    <div
      {...htmlAttributes}
      {...rootProps}
      className={cx(classBase, `${classBase}-${variant}`, {
        [`${classBase}-segmented`]: segmented,
      })}
      ref={rootRef}
      data-showcase-center
      // tabIndex={segmented ? undefined : 0}
    >
      <Button
        {...ButtonProps}
        className={`${classBase}-main`}
        ref={buttonRef}
        variant={variant}
      >
        {buttonText}
      </Button>
      <PopupMenu
        {...PopupMenuProps}
        className={`${classBase}-trigger`}
        icon={PopupMenuProps?.icon ?? "chevron-down"}
        tabIndex={segmented ? 0 : -1}
        variant={variant}
      />
    </div>
  );
};
