import { Button } from "@salt-ds/core";
import { CloseIcon } from "@salt-ds/icons";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  type ReactElement,
  type ReactNode,
  type Ref,
} from "react";
import { useHideContextPanel } from "./ContextPanelProvider";

import contextPanelCss from "./ContextPanel.css";

const classBase = "vuuContextPanel";

export interface ContextPanelProps {
  readonly className?: string;
  readonly content?: ReactElement;
  /** The element within which content is displayed, for a React portal. */
  readonly contentRef?: Ref<HTMLDivElement>;
  readonly expanded?: boolean;
  readonly id?: string;
  /** Called to close the panel. Defaults to `hideContextPanel`. */
  readonly onClose?: () => void;
  readonly overlay?: boolean;
  readonly title?: ReactNode;
}

export const ContextPanel = ({
  className,
  content,
  contentRef,
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
  const rootRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const handleClose = useCallback(() => {
    if (onClose) {
      onClose();
    } else {
      hideContextPanel?.();
    }
  }, [hideContextPanel, onClose]);

  // A native listener, as the React events of portalled content propagate
  // through its owner's tree, not the panel's.
  useEffect(() => {
    const root = rootRef.current;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleClose();
      }
    };
    root?.addEventListener("keydown", handleKeyDown);
    return () => root?.removeEventListener("keydown", handleKeyDown);
  }, [handleClose]);

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
      ref={rootRef}
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
        <div className={`${classBase}-content`} ref={contentRef}>
          {expanded ? content : null}
        </div>
      </div>
    </div>
  );
};
