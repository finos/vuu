import { Button, ButtonProps, useForkRef } from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { ContextMenuProvider } from "@vuu-ui/vuu-context-menu";
import { PopupMenu, PopupMenuProps } from "@vuu-ui/vuu-popups";
import cx from "clsx";
import { forwardRef, HTMLAttributes } from "react";
import { useSplitButton } from "./useSplitButton";

import splitButtonCss from "./SplitButton.css";

export interface SplitButtonProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onClick">,
    Pick<ButtonProps, "onClick"> {
  ButtonProps?: Partial<Omit<ButtonProps, "onClick" | "variant">>;
  PopupMenuProps?: Partial<PopupMenuProps>;
  disabled?: boolean;
  segmented?: boolean;
  variant?: ButtonProps["variant"];
}

const classBase = "vuuSplitButton";

export const SplitButton = forwardRef<HTMLDivElement, SplitButtonProps>(
  function SplitButton(
    {
      ButtonProps: ButtonPropsProp,
      PopupMenuProps: PopupMenuPropsProp,
      children,
      className,
      disabled = false,
      onClick,
      segmented = false,
      variant = "primary",
      ...htmlAttributes
    },
    forwardedRef,
  ) {
    const targetWindow = useWindow();
    useComponentCssInjection({
      testId: "vuu-split-button",
      css: splitButtonCss,
      window: targetWindow,
    });

    const { ButtonProps, buttonRef, rootRef, PopupMenuProps, ...rootProps } =
      useSplitButton({
        ButtonProps: ButtonPropsProp,
        PopupMenuProps: PopupMenuPropsProp,
        classBase,
        onClick,
        segmented,
      });

    return (
      <ContextMenuProvider>
        <div
          {...htmlAttributes}
          {...rootProps}
          className={cx(classBase, `${classBase}-${variant}`, className, {
            [`${classBase}-disabled`]: disabled,
            [`${classBase}-segmented`]: segmented,
          })}
          ref={useForkRef(forwardedRef, rootRef)}
          data-showcase-center
          tabIndex={-1}
        >
          <Button
            {...ButtonProps}
            appearance="solid"
            className={`${classBase}-main`}
            disabled={disabled}
            ref={buttonRef}
            sentiment="neutral"
          >
            {children}
          </Button>
          <PopupMenu
            {...PopupMenuProps}
            appearance="solid"
            className={`${classBase}-trigger`}
            disabled={disabled}
            icon={PopupMenuProps?.icon ?? "chevron-down"}
            tabIndex={segmented ? 0 : -1}
            sentiment="neutral"
          />
        </div>
      </ContextMenuProvider>
    );
  },
);
