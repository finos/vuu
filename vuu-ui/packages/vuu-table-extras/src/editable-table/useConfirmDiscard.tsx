import { useCallback } from "react";
import {
  ConfirmPrompt,
  type ConfirmPromptProps,
  usePromptRequest,
} from "./ConfirmPrompt";

/** The Prompt shown before unsaved changes are discarded. */
export interface ConfirmDiscardOptions extends ConfirmPromptProps {
  /** @default "warn-triangle" */
  icon?: string;
  /**
   * @default "All your changes will be lost. Do you want to discard changes and exit Edit mode ?"
   */
  message?: ConfirmPromptProps["message"];
  /** @default "Discard changes" */
  title?: string;
}

/**
 * Asks the user to confirm discarding unsaved changes. Returns
 * `confirmCancel`, undefined when `options` is false, and the Prompt.
 */
export const useConfirmDiscardPrompt = (
  options: boolean | ConfirmDiscardOptions = true,
) => {
  const { ask, request, settle } = usePromptRequest<undefined>();
  const {
    cancelButtonLabel = "Cancel",
    className,
    confirmButtonLabel = "Confirm",
    icon = "warn-triangle",
    message = "All your changes will be lost. Do you want to discard changes and exit Edit mode ?",
    title = "Discard changes",
  } = typeof options === "object" ? options : {};

  const confirm = useCallback(() => ask(undefined), [ask]);

  const prompt =
    options && request ? (
      <ConfirmPrompt
        cancelButtonLabel={cancelButtonLabel}
        className={className}
        confirmButtonLabel={confirmButtonLabel}
        icon={icon}
        onSettle={settle}
        testId="confirm-discard"
        title={title}
      >
        {message}
      </ConfirmPrompt>
    ) : null;

  return {
    confirmCancel: options ? confirm : undefined,
    prompt,
  };
};
