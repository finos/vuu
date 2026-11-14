import { useModal } from "@vuu-ui/vuu-ui-controls";
import { createElement, useCallback } from "react";

export interface ConfirmDiscardHookProps {
  /** @default "Discard changes?" */
  title?: string;
  /** @default "You have unsaved changes. Discard them?" */
  message?: string;
  /** @default "Discard" */
  confirmButtonLabel?: string;
  /** @default "Keep editing" */
  cancelButtonLabel?: string;
}

/**
 * Returns a function that asks the user to confirm discarding unsaved
 * changes. Resolves true if the user confirms. Pass it to
 * `EditButtons.confirmCancel`, or call it before changing selection or
 * closing a form.
 *
 * Requires a `ModalProvider` in scope.
 *
 * @example
 * const confirmDiscard = useConfirmDiscard();
 * <EditButtons confirmCancel={confirmDiscard} ... />
 */
export const useConfirmDiscard = ({
  cancelButtonLabel = "Keep editing",
  confirmButtonLabel = "Discard",
  message = "You have unsaved changes. Discard them?",
  title = "Discard changes?",
}: ConfirmDiscardHookProps = {}) => {
  const { closePrompt, showPrompt } = useModal();

  return useCallback(
    () =>
      new Promise<boolean>((resolve) => {
        let resolved = false;
        const settle = (confirmed: boolean) => {
          if (!resolved) {
            resolved = true;
            resolve(confirmed);
          }
        };
        showPrompt(createElement("span", null, message), {
          cancelButtonLabel,
          confirmButtonLabel,
          initialFocusedItem: "cancel",
          onCancel: () => settle(false),
          onConfirm: () => settle(true),
          onOpenChange: (open) => {
            if (!open) {
              settle(false);
            }
          },
          status: "warning",
          title,
        });
      }).finally(closePrompt),
    [
      cancelButtonLabel,
      closePrompt,
      confirmButtonLabel,
      message,
      showPrompt,
      title,
    ],
  );
};
