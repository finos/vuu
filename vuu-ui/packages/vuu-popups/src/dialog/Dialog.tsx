import React, { HTMLAttributes, useCallback, useRef, useState } from "react";
import cx from "classnames";
import { Portal } from "../portal";
import { Scrim } from "@heswell/salt-lab";

import { Text } from "@salt-ds/core";
import { Toolbar, ToolbarButton } from "@heswell/salt-lab";

import "./Dialog.css";

const classBase = "vuuDialog";

export interface DialogProps extends HTMLAttributes<HTMLDivElement> {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Dialog = ({
  children,
  className,
  isOpen = false,
  onClose,
  title,
  ...props
}: DialogProps) => {
  const root = useRef<HTMLDivElement>(null);
  const [posX, setPosX] = useState(0);
  const [posY, setPosY] = useState(0);

  const close = useCallback(() => {
    // TODO
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
      <Scrim className={`${classBase}-scrim`} open={isOpen}>
        <div {...props} className={cx(classBase, className)} ref={root}>
          <Toolbar className={`${classBase}-header`}>
            <Text>{title}</Text>
            <ToolbarButton
              key="close"
              onClick={close}
              data-align-end
              data-icon="close"
            />
          </Toolbar>
          {children}
        </div>
      </Scrim>
    </Portal>
  );
};
