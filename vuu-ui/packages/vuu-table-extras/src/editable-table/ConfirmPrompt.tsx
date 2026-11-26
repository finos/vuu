import { Prompt } from "@vuu-ui/vuu-ui-controls";
import { type ReactNode, useCallback, useRef, useState } from "react";

/** The text and icon of a confirmation Prompt. */
export interface ConfirmPromptOptions {
  /** @default "Cancel" */
  cancelButtonLabel?: string;
  /** @default "Confirm" */
  confirmButtonLabel?: string;
  /** Name of a Vuu icon, shown in the header. An empty string shows none. */
  icon?: string;
  message?: ReactNode;
  title?: string;
}

interface PromptRequest<T> {
  resolve: (confirmed: boolean) => void;
  value: T;
}

/**
 * A pending request to confirm something. `ask` opens it, with a value for
 * the Prompt to show, and resolves once the user answers.
 */
export const usePromptRequest = <T,>(onSettled?: (value: T) => void) => {
  const [request, setRequest] = useState<PromptRequest<T>>();
  const requestRef = useRef(request);
  requestRef.current = request;
  const onSettledRef = useRef(onSettled);
  onSettledRef.current = onSettled;

  const ask = useCallback(
    (value: T) =>
      new Promise<boolean>((resolve) => {
        setRequest({ resolve, value });
      }),
    [],
  );

  // settled once, by whichever of confirm, cancel or close comes first
  const settle = useCallback((confirmed: boolean) => {
    const current = requestRef.current;
    if (current) {
      requestRef.current = undefined;
      setRequest(undefined);
      current.resolve(confirmed);
      onSettledRef.current?.(current.value);
    }
  }, []);

  return { ask, request, settle };
};

export interface ConfirmPromptProps
  extends Required<Omit<ConfirmPromptOptions, "icon" | "message">> {
  children?: ReactNode;
  className?: string;
  icon?: string;
  onSettle: (confirmed: boolean) => void;
  testId: string;
}

/** A Vuu `Prompt` that settles a confirmation request. */
export const ConfirmPrompt = ({
  cancelButtonLabel,
  children,
  className,
  confirmButtonLabel,
  icon,
  onSettle,
  testId,
  title,
}: ConfirmPromptProps) => (
  <Prompt
    cancelButtonLabel={cancelButtonLabel}
    className={className}
    confirmButtonLabel={confirmButtonLabel}
    data-testid={testId}
    icon={icon || undefined}
    initialFocusedItem="confirm"
    onCancel={() => onSettle(false)}
    onConfirm={() => onSettle(true)}
    onOpenChange={(open) => {
      if (!open) {
        onSettle(false);
      }
    }}
    open
    title={title}
  >
    {children}
  </Prompt>
);
