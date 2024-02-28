import { MenuCloseHandler, PopupMenuProps } from "@finos/vuu-popups";
import { dispatchMouseEvent } from "@finos/vuu-utils";
import {
  FocusEventHandler,
  KeyboardEventHandler,
  useCallback,
  useRef,
} from "react";
import { SplitButtonProps } from "./SplitButton";

export interface SplitButtonHookProps
  extends Pick<
    SplitButtonProps,
    "PopupMenuProps" | "ButtonProps" | "onClick" | "segmented"
  > {
  classBase: string;
}

export const useSplitButton = ({
  ButtonProps: ButtonPropsProp,
  PopupMenuProps,
  classBase,
  onClick,
  segmented,
}: SplitButtonHookProps) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const onMenuClose = useCallback<MenuCloseHandler>((reason) => {
    if (reason?.type !== "tab-away") {
      const buttonMain = rootRef.current?.querySelector(
        ".vuuSplitButton-main"
      ) as HTMLElement;
      buttonMain?.focus();
    }
  }, []);

  const menuProps: PopupMenuProps = {
    ...PopupMenuProps,
    anchorElement: rootRef,
    menuClassName: `${classBase}-menu`,
    onMenuClose,
    popupPlacement: "below-full-width",
  };

  const handleRootFocus = useCallback<FocusEventHandler>(() => {
    const { current: splitButton } = rootRef;
    if (!splitButton?.classList.contains("vuuFocusVisible")) {
      splitButton?.classList.add("vuuFocusVisible");
    }
  }, []);

  const handleRootBlur = useCallback<FocusEventHandler>((evt) => {
    const { current: splitButton } = rootRef;
    const target = evt.relatedTarget as HTMLElement;
    if (!splitButton?.contains(target)) {
      if (splitButton?.classList.contains("vuuFocusVisible")) {
        splitButton.classList.remove("vuuFocusVisible");
      }
    }
  }, []);

  const handleButtonKeyDown = useCallback<
    KeyboardEventHandler<HTMLButtonElement>
  >(
    (evt) => {
      if (evt.key === "ArrowDown") {
        const popupTrigger = rootRef.current?.querySelector(
          `.${classBase}-trigger`
        ) as HTMLElement;
        if (popupTrigger) {
          dispatchMouseEvent(popupTrigger, "click");
        }
      }
    },
    [classBase]
  );

  const handleClick = useCallback(
    (evt) => {
      onClick?.(evt);
    },
    [onClick]
  );

  const ButtonProps = {
    ...ButtonPropsProp,
    onClick: segmented ? handleClick : undefined,
    onKeyDown: handleButtonKeyDown,
  };

  return {
    ButtonProps,
    PopupMenuProps: menuProps,
    buttonRef,
    rootRef,
    onClick: segmented ? undefined : handleClick,
    onBlur: handleRootBlur,
    onFocus: handleRootFocus,
  };
};
