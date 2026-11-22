import cx from "clsx";
import { dispatchMouseEvent } from "@vuu-ui/vuu-utils";
import {
  FocusEventHandler,
  KeyboardEventHandler,
  useCallback,
  useRef,
} from "react";
import { PopupMenuProps } from "../popup-menu";
import { SplitButtonProps } from "./SplitButton";

export interface SplitButtonHookProps
  extends Pick<
    SplitButtonProps,
    "PopupMenuProps" | "ButtonProps" | "onClick" | "segmented"
  > {
  classBase: string;
}

const focusTargetIsEditableLabel = (target: EventTarget) => {
  if ((target as HTMLElement).tagName === "INPUT") {
    return true;
  }
  return false;
};

export const useSplitButton = ({
  ButtonProps: ButtonPropsProp,
  PopupMenuProps,
  classBase,
  onClick,
}: // segmented,
SplitButtonHookProps) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const onMenuClose = useCallback(() => {
    const buttonMain = rootRef.current?.querySelector(
      ".vuuSplitButton-main",
    ) as HTMLElement;
    buttonMain?.focus();
  }, []);

  const menuProps: PopupMenuProps = {
    ...PopupMenuProps,
    anchorElement: rootRef,
    menuClassName: cx(`${classBase}-menu`, PopupMenuProps?.menuClassName),
    onMenuClose,
  };

  const handleRootFocus = useCallback<FocusEventHandler>((evt) => {
    const { current: splitButton } = rootRef;
    if (splitButton && !splitButton.classList.contains("vuuFocusVisible")) {
      splitButton.classList.add("vuuFocusVisible");
      if (
        evt.target !== buttonRef.current &&
        !focusTargetIsEditableLabel(evt.target)
      ) {
        // focus may have moved on, e.g. into an editable label, before
        // the next frame
        requestAnimationFrame(() => {
          const { activeElement } = splitButton.ownerDocument;
          if (
            activeElement !== null &&
            splitButton.contains(activeElement) &&
            !focusTargetIsEditableLabel(activeElement)
          ) {
            buttonRef.current?.focus();
          }
        });
      }
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
          `.${classBase}-trigger`,
        ) as HTMLElement;
        if (popupTrigger) {
          dispatchMouseEvent(popupTrigger, "mousedown");
        }
      }
    },
    [classBase],
  );

  const ButtonProps = {
    ...ButtonPropsProp,
    onClick,
    onKeyDown: handleButtonKeyDown,
  };

  return {
    ButtonProps,
    PopupMenuProps: menuProps,
    buttonRef,
    rootRef,
    onBlur: handleRootBlur,
    onFocus: handleRootFocus,
  };
};
