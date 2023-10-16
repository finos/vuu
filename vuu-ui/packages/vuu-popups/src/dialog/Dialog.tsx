import { Scrim } from "@salt-ds/lab";
import cx from "classnames";
import { HTMLAttributes, useCallback, useRef, useState } from "react";
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
  const [posX] = useState(0);
  const [posY] = useState(0);

  const close = useCallback(() => {
    onClose?.();
  }, [onClose]);

  const handleRender = useCallback(() => {
    //   if (center && isOpen && root.current) {
    //     const { width, height } = root.current.getBoundingClientRect();
    //     const { innerWidth, innerHeight } = window;
    //     const x = innerWidth / 2 - width / 2;
    //     const y = innerHeight / 2 - height / 2;
    //     setPosX(x);
    //     setPosY(y);
    // }
  }, []);

  if (!isOpen) {
    return null;
  }

  return (
    <Portal onRender={handleRender} x={posX} y={posY}>
      <Scrim className={`${classBase}-scrim`} open={isOpen} autoFocusRef={root}>
        <div {...props} className={cx(classBase, className)} ref={root}>
          <DialogHeader
            hideCloseButton={hideCloseButton}
            onClose={close}
            title={title}
          />
          {children}
        </div>
      </Scrim>
    </Portal>
  );
};
