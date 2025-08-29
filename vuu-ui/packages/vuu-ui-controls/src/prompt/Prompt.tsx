import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogHeader,
  DialogHeaderProps,
  DialogProps,
} from "@salt-ds/core";
import cx from "clsx";
import {
  HTMLAttributes,
  MouseEventHandler,
  RefCallback,
  RefObject,
  useCallback,
} from "react";
import { Icon, IconButton } from "../icon-button";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";

import promptCss from "./Prompt.css";

const classBase = "vuuPrompt";

/**
 * Allow fine grained configuration of Prompt buttons
 * The ref is provided to facilitate programmatic focus.
 */
export interface PromptButtonProps {
  disabled?: boolean;
  label?: string;
  ref?: RefObject<HTMLButtonElement | null>;
}

export interface PromptProps
  extends Pick<DialogProps, "onOpenChange" | "open" | "status">,
    Pick<DialogHeaderProps, "disableAccent">,
    Omit<HTMLAttributes<HTMLDivElement>, "content" | "title"> {
  /**
   * For simple configuration, where just a cancel button label is required.
   */
  cancelButtonLabel?: string;
  /**
   * Allow fine grained configuration of cancel button
   */
  cancelButtonProps?: PromptButtonProps;
  /**
   * For simple configuration, where just a confirm button label is required.
   */
  confirmButtonLabel?: string;
  /**
   * Allow fine grained configuration of confirm button
   */
  confirmButtonProps?: PromptButtonProps;
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
}

export const Prompt = ({
  children,
  className,
  cancelButtonLabel = "Cancel",
  cancelButtonProps,
  confirmButtonLabel = "Confirm",
  confirmButtonProps,
  disableAccent,
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
      <DialogHeader
        disableAccent={disableAccent}
        header={header}
        actions={actions}
      />
      <DialogContent>{children}</DialogContent>
      <DialogActions>
        {showCancelButton ? (
          <Button
            className="vuuPromptCancelButton"
            disabled={cancelButtonProps?.disabled}
            onClick={handleCancel}
            ref={cancelButtonProps?.ref}
          >
            {cancelButtonProps?.label ?? cancelButtonLabel}
          </Button>
        ) : null}
        {showConfirmButton ? (
          <Button
            className="vuuPromptConfirmButton"
            disabled={confirmButtonProps?.disabled}
            sentiment="accented"
            onClick={handleConfirm}
            ref={confirmButtonProps?.ref}
          >
            {confirmButtonProps?.label ?? confirmButtonLabel}
          </Button>
        ) : null}
      </DialogActions>
    </Dialog>
  );
};
