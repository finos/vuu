import { Button } from "@salt-ds/core";
import { CloseIcon } from "@salt-ds/icons";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";
import {
  useCallback,
  useLayoutEffect,
  useRef,
  type KeyboardEventHandler,
  type ReactElement,
  type ReactNode,
} from "react";
import { useHideContextPanel } from "./ContextPanelProvider";

import contextPanelCss from "./ContextPanel.css";

const classBase = "vuuContextPanel";

export interface ContextPanelProps {
  readonly className?: string;
  readonly content?: ReactElement;
  readonly expanded?: boolean;
  readonly id?: string;
  readonly onClose?: () => void;
  readonly overlay?: boolean;
  readonly title?: ReactNode;
}

export const ContextPanel = ({
  className,
  content,
  expanded = false,
  id,
  onClose,
  overlay = false,
  title,
}: ContextPanelProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-core-context-panel",
    css: contextPanelCss,
    window: targetWindow,
  });
  const hideContextPanel = useHideContextPanel();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const handleClose = useCallback(() => {
    hideContextPanel?.();
    onClose?.();
  }, [hideContextPanel, onClose]);
  const handleKeyDown = useCallback<KeyboardEventHandler>(
    (event) => {
      if (event.key === "Escape") {
        handleClose();
      }
    },
    [handleClose],
  );
  useLayoutEffect(() => {
    if (expanded) {
      closeButtonRef.current?.focus();
    }
  }, [expanded]);

  return (
    <div
      aria-hidden={expanded ? undefined : true}
      className={cx(classBase, className, "vuuScrollable", {
        [`${classBase}-expanded`]: expanded,
        [`${classBase}-inline`]: !overlay,
        [`${classBase}-overlay`]: overlay,
      })}
      id={id}
      inert={!expanded}
      onKeyDown={handleKeyDown}
    >
      <div className={`${classBase}-inner`}>
        <div className={`${classBase}-header`}>
          <h2 className={`${classBase}-title`}>{title}</h2>
          <Button
            appearance="transparent"
            aria-label="Close context panel"
            className={`${classBase}-close`}
            onClick={handleClose}
            ref={closeButtonRef}
            sentiment="neutral"
          >
            <CloseIcon aria-hidden />
          </Button>
        </div>
        <div className={`${classBase}-content`}>
          {expanded ? content : null}
        </div>
      </div>
    </div>
  );
};
