import { Scrim } from "@salt-ds/lab";
import cx from "classnames";
import { HTMLAttributes, useCallback, useRef } from "react";
import { Portal } from "../portal";
import { DialogHeader } from "../dialog-header";

import "./Dialog.css";

const classBase = "vuuDialog";

export interface DialogProps extends HTMLAttributes<HTMLDivElement> {
  isOpen?: boolean;
  onClose?: () => void;
  hideCloseButton?: boolean;
}

export const Dialog = ({
  children,
  className,
  isOpen = false,
  onClose,
  title,
  hideCloseButton = false,
  ...props
}: DialogProps) => {
  const root = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    onClose?.();
  }, [onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <Portal>
      <Scrim className={`${classBase}-scrim`} open={isOpen} autoFocusRef={root}>
        <div {...props} className={cx(classBase, className)} ref={root}>
          <DialogHeader
            hideCloseButton={hideCloseButton}
            onClose={close}
            title={title}
          />
          <div className={`${classBase}-body`}>{children}</div>
        </div>
      </Scrim>
    </Portal>
  );
};
