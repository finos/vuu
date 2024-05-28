import cx from "clsx";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { useThemeAttributes } from "@finos/vuu-utils";
import { HTMLAttributes, useCallback, useLayoutEffect, useRef } from "react";
import { DialogHeader } from "../dialog-header";
import { PopupComponentProps, useAnchoredPosition } from "../popup";

import dialogCss from "./Dialog.css";

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
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-dialog",
    css: dialogCss,
    window: targetWindow,
  });

  const {
    anchorElement = AnchorBody,
    offsetLeft = 0,
    offsetTop = 0,
    placement = "auto",
  } = PopupProps;

  const rootRef = useRef<HTMLDialogElement>(null);
  const portalRef = useRef<HTMLDivElement>(null);
  const [themeClass, _, dataMode] = useThemeAttributes();
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
      if (isOpen) {
        // rootRef.current.showModal();
        rootRef.current.show();

        const { left, top } = rootRef.current.getBoundingClientRect();
        if (portalRef.current) {
          portalRef.current.style.cssText = `left:-${left}px;position:absolute;top:-${top}px;`;
        }
      } else {
        rootRef.current.close();
      }
      if (placement.endsWith("center")) {
        const { width } = rootRef.current.getBoundingClientRect();
        rootRef.current.style.marginLeft = `-${width / 2}px`;
      }
    }
  }, [isOpen, placement]);

  return (
    <dialog
      {...htmlAttributes}
      className={cx(classBase, themeClass)}
      data-mode={dataMode}
      onClose={close}
      id="vuu-dialog"
      ref={rootRef}
      style={{ ...style, ...position }}
    >
      <DialogHeader
        hideCloseButton={hideCloseButton}
        onClose={close}
        title={title}
      />
      <div className={`${classBase}-body`}>{children}</div>
      <div id="vuu-dialog-portal-root" ref={portalRef} />
    </dialog>
  );
};
