import {
  Button,
  Text,
  Toast,
  ToastContent,
  type ValidationStatus,
} from "@salt-ds/core";
import { CloseIcon } from "@salt-ds/icons";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { createPortal } from "react-dom";

import savedStateToastsCss from "./SavedStateToasts.css";

const classBase = "vuuSavedStateToasts";

export interface SavedStateToastAction {
  label: string;
  onAction: () => void;
}

export interface SavedStateToastProps {
  status: ValidationStatus;
  title: string;
  body?: string;
  action?: SavedStateToastAction;
}

export interface SavedStateToastItem extends SavedStateToastProps {
  id: number;
}

export interface SavedStateToastsProps {
  onDismiss: (id: number) => void;
  toasts: readonly SavedStateToastItem[];
}

/**
 * Salt's Toast is presentational, so the portal places and stacks them.
 * Rendered only while there are toasts, so that a Dialog opened earlier
 * treats them as content injected after it opened, not as an outside press.
 */
export const SavedStateToasts = ({
  onDismiss,
  toasts,
}: SavedStateToastsProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-saved-state-toasts",
    css: savedStateToastsCss,
    window: targetWindow,
  });
  const container = (targetWindow ?? window).document.body;
  if (toasts.length === 0) return null;
  return createPortal(
    <div className={classBase}>
      {toasts.map(({ action, body, id, status, title }) => (
        <Toast className={`${classBase}-toast`} key={id} status={status}>
          <ToastContent>
            <Text>
              <strong>{title}</strong>
            </Text>
            {body ? <Text>{body}</Text> : null}
          </ToastContent>
          {action ? (
            <Button
              appearance="bordered"
              onClick={() => {
                onDismiss(id);
                action.onAction();
              }}
              sentiment="neutral"
            >
              {action.label}
            </Button>
          ) : null}
          <Button
            appearance="transparent"
            aria-label="Dismiss"
            onClick={() => onDismiss(id)}
            sentiment="neutral"
          >
            <CloseIcon aria-hidden />
          </Button>
        </Toast>
      ))}
    </div>,
    container,
  );
};
