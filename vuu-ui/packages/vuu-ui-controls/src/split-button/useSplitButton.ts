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
      rootRef.current?.focus();
    }
  }, []);

  const menuProps: PopupMenuProps = {
    ...PopupMenuProps,
    anchorElement: rootRef,
    menuClassName: `${classBase}-menu`,
    onMenuClose,
    popupPlacement: "below-full-width",
  };

  const handleRootFocus = useCallback<FocusEventHandler>(
    (evt) => {
      const { classList } = evt.target as HTMLElement;
      if (!segmented && classList.contains(classBase)) {
        buttonRef.current?.focus();
      }
    },
    [classBase, segmented]
  );

  const handleButtonKeyDown = useCallback<
    KeyboardEventHandler<HTMLButtonElement>
  >(
    (evt) => {
      if (evt.key === "ArrowDown") {
        const popupTrigger = rootRef.current?.querySelector(
          `.${classBase}-secondary`
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
    onFocus: handleRootFocus,
  };
};
