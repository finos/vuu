import { useThemeAttributes } from "@finos/vuu-shell";
import { Button } from "@salt-ds/core";
import cx from "classnames";
import { HTMLAttributes, useLayoutEffect, useRef } from "react";
import { PopupComponentProps, useAnchoredPosition } from "../popup";

import "./Prompt.css";

const classBase = "vuuPrompt";

const AnchorBody = { current: document.body };

const EMPTY_PROPS = {};

export interface PromptProps extends HTMLAttributes<HTMLDialogElement> {
  PopupProps?: Partial<PopupComponentProps>;
  cancelButtonLabel?: string;
  confirmButtonLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
  icon?: string;
  text: string;
  variant?: "warn" | "error" | "info";
}

export const Prompt = ({
  PopupProps = EMPTY_PROPS,
  cancelButtonLabel = "Cancel",
  confirmButtonLabel = "Confirm",
  icon,
  onCancel,
  onConfirm,
  style,
  text,
  title,
  variant = "info",
  ...htmlAttributes
}: PromptProps) => {
  const {
    anchorElement = AnchorBody,
    offsetLeft = 0,
    offsetTop = 0,
    placement = "below",
  } = PopupProps;
  const [themeClass, densityClass, dataMode] = useThemeAttributes();
  const position = useAnchoredPosition({
    anchorElement,
    offsetLeft,
    offsetTop,
    placement,
  });
  const rootRef = useRef<HTMLDialogElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  useLayoutEffect(() => {
    if (rootRef.current) {
      rootRef.current.showModal();
      if (confirmRef.current) {
        confirmRef.current.focus();
      }
      if (placement.endsWith("center")) {
        const { width } = rootRef.current.getBoundingClientRect();
        rootRef.current.style.marginLeft = `-${width / 2}px`;
      }
    }
  }, [placement]);

  return (
    <dialog
      {...htmlAttributes}
      className={cx(classBase, `${classBase}-${variant}`, themeClass)}
      data-mode={dataMode}
      ref={rootRef}
      style={{ ...style, ...position }}
    >
      <form className={`${classBase}-form`}>
        <div className={`${classBase}-header`} data-icon={icon}>
          {title}
        </div>
        <div className={`${classBase}-text`}>{text}</div>
        <div className={`${classBase}-buttonBar`}>
          <Button onClick={onCancel} variant="secondary">
            {cancelButtonLabel}
          </Button>
          <Button onClick={onConfirm} ref={confirmRef} value="default">
            {confirmButtonLabel}
          </Button>
        </div>
      </form>
    </dialog>
  );
};
