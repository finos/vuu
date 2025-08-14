import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogHeader,
  DialogProps,
} from "@salt-ds/core";
import cx from "clsx";
import { HTMLAttributes, MouseEventHandler, useCallback } from "react";
import { IconButton } from "../icon-button";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";

import promptCss from "./Prompt.css";

const classBase = "vuuPromptNext";

export interface PromptProps
  extends Pick<DialogProps, "onOpenChange" | "open">,
    Omit<HTMLAttributes<HTMLDivElement>, "content" | "title"> {
  onCancel?: () => void;
  onConfirm: () => void;
  title: string;
}

export const Prompt = ({
  children,
  className,
  onCancel,
  onConfirm,
  onOpenChange,
  open,
  title,
  ...htmlAttributes
}: PromptProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-prompt-next",
    css: promptCss,
    window: targetWindow,
  });

  const handleCancel = useCallback<MouseEventHandler<HTMLButtonElement>>(() => {
    onCancel?.();
    onOpenChange?.(false);
  }, [onCancel, onOpenChange]);

  const handleConfirm = useCallback<
    MouseEventHandler<HTMLButtonElement>
  >(() => {
    onConfirm();
    onOpenChange?.(false);
  }, [onConfirm, onOpenChange]);

  return (
    <Dialog
      {...htmlAttributes}
      className={cx(classBase, className)}
      onOpenChange={onOpenChange}
      open={open}
    >
      <DialogHeader
        header={title}
        actions={
          <IconButton icon="close" onClick={() => onOpenChange?.(false)} />
        }
      />
      <DialogContent>{children}</DialogContent>
      <DialogActions>
        <Button onClick={handleCancel}>Cancel</Button>
        <Button sentiment="accented" onClick={handleConfirm}>
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
};
