import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogHeader,
  DialogProps,
} from "@salt-ds/core";
import cx from "clsx";
import {
  HTMLAttributes,
  MouseEventHandler,
  RefCallback,
  useCallback,
} from "react";
import { Icon, IconButton } from "../icon-button";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";

import promptCss from "./Prompt.css";

const classBase = "vuuPromptNext";

export interface PromptProps
  extends Pick<DialogProps, "onOpenChange" | "open" | "status">,
    Omit<HTMLAttributes<HTMLDivElement>, "content" | "title"> {
  cancelButtonLabel?: string;
  confirmButtonLabel?: string;
  icon?: string;
  /**
   * Set this prop if one of the three built-in buttons should receive initial focus.
   * Allows user to quickly dismiss/confirm prompt from keyboard. If the prompt content
   * contains focusable item(s), focus should be controlled by caller.
   */
  initialFocusedItem?: "confirm" | "cancel" | "close";
  onCancel?: () => void;
  onConfirm?: () => void;
  onClose?: () => void;
  showCancelButton?: boolean;
  showCloseButton?: boolean;
  showConfirmButton?: boolean;
  title: string;
  variant?: "warn";
}

export const Prompt = ({
  children,
  className,
  cancelButtonLabel = "Cancel",
  confirmButtonLabel = "Confirm",
  icon,
  initialFocusedItem,
  onCancel,
  onClose,
  onConfirm,
  onOpenChange,
  open,
  showCancelButton = true,
  showCloseButton = true,
  showConfirmButton = true,
  status,
  title,

  ...htmlAttributes
}: PromptProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-prompt-next",
    css: promptCss,
    window: targetWindow,
  });

  const close = useCallback(() => {
    onClose?.();
    onOpenChange?.(false);
  }, [onClose, onOpenChange]);

  const callbackRef = useCallback<RefCallback<HTMLDivElement>>(
    (el) => {
      if (el) {
        let target: HTMLButtonElement | null = null;
        if (initialFocusedItem === "confirm" && showConfirmButton) {
          target = el.querySelector(".vuuPromptConfirmButton");
        } else if (initialFocusedItem === "cancel" && showCancelButton) {
          target = el.querySelector(".vuuPromptCancelButton");
        } else if (initialFocusedItem === "close" && showCloseButton) {
          target = el.querySelector(".vuuPromptCloseButton");
        }

        if (target) {
          setTimeout(() => {
            target.focus();
          }, 200);
        }
      }
    },
    [initialFocusedItem, showCancelButton, showCloseButton, showConfirmButton],
  );

  const handleCancel = useCallback<MouseEventHandler<HTMLButtonElement>>(() => {
    onCancel?.();
    close();
  }, [close, onCancel]);

  const handleConfirm = useCallback<
    MouseEventHandler<HTMLButtonElement>
  >(() => {
    onConfirm?.();
    close();
  }, [close, onConfirm]);

  const actions = showCloseButton ? (
    <IconButton
      appearance="transparent"
      className="vuuPromptCloseButton"
      data-embedded
      icon="close"
      onClick={close}
    />
  ) : null;

  const header = icon ? (
    <>
      <Icon name={icon} />
      <span>{title}</span>
    </>
  ) : (
    title
  );

  return (
    <Dialog
      {...htmlAttributes}
      className={cx(classBase, className)}
      onOpenChange={onOpenChange}
      open={open}
      ref={callbackRef}
      status={status}
    >
      <DialogHeader header={header} actions={actions} />
      <DialogContent>{children}</DialogContent>
      <DialogActions>
        {showCancelButton ? (
          <Button className="vuuPromptCancelButton" onClick={handleCancel}>
            {cancelButtonLabel}
          </Button>
        ) : null}
        {showConfirmButton ? (
          <Button
            className="vuuPromptConfirmButton"
            sentiment="accented"
            onClick={handleConfirm}
          >
            {confirmButtonLabel}
          </Button>
        ) : null}
      </DialogActions>
    </Dialog>
  );
};
