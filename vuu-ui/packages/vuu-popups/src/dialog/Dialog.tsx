import cx from "classnames";
import { useThemeAttributes } from "@finos/vuu-utils";
import { HTMLAttributes, useCallback, useLayoutEffect, useRef } from "react";
import { DialogHeader } from "../dialog-header";

import "./Dialog.css";
import { PopupComponentProps, useAnchoredPosition } from "../popup";

const classBase = "vuuDialog";

const AnchorBody = { current: document.body };
const EMPTY_PROPS = {};

export interface DialogProps extends HTMLAttributes<HTMLDialogElement> {
  PopupProps?: Partial<PopupComponentProps>;
  isOpen?: boolean;
  onClose?: () => void;
  hideCloseButton?: boolean;
}

export const Dialog = ({
  PopupProps = EMPTY_PROPS,
  children,
  className,
  isOpen = false,
  onClose,
  style,
  title,
  hideCloseButton = false,
  ...htmlAttributes
}: DialogProps) => {
  const {
    anchorElement = AnchorBody,
    offsetLeft = 0,
    offsetTop = 0,
    placement = "below",
  } = PopupProps;

  const rootRef = useRef<HTMLDialogElement>(null);
  const [themeClass, densityClass, dataMode] = useThemeAttributes();
  const { position } = useAnchoredPosition({
    anchorElement,
    offsetLeft,
    offsetTop,
    placement,
  });

  const close = useCallback(() => {
    onClose?.();
  }, [onClose]);

  // if (!isOpen) {
  //   return null;
  // }

  useLayoutEffect(() => {
    if (rootRef.current) {
      rootRef.current.showModal();
      // if (confirmRef.current) {
      //   confirmRef.current.focus();
      // }
      if (placement.endsWith("center")) {
        const { width } = rootRef.current.getBoundingClientRect();
        rootRef.current.style.marginLeft = `-${width / 2}px`;
      }
    }
  }, [placement]);

  return (
    <dialog
      {...htmlAttributes}
      className={cx(classBase, themeClass)}
      data-mode={dataMode}
      ref={rootRef}
      style={{ ...style, ...position }}
    >
      <DialogHeader
        hideCloseButton={hideCloseButton}
        onClose={close}
        title={title}
      />
      <div className={`${classBase}-body`}>{children}</div>
    </dialog>
  );
};
