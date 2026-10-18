import { Button } from "@salt-ds/core";
import { ChromeIcon } from "../chrome/ChromeIcon";
import { toastStore, useToast } from "./toast-store";

import "./Toast.css";

const classBase = "ShowcaseToast";

/** Renders the current toast, at the foot of the content area */
export const ToastHost = () => {
  const toast = useToast();
  return toast ? (
    <div className={classBase} key={toast.id} role="status">
      <span className={`${classBase}-message`}>{toast.message}</span>
      {toast.action ? (
        <Button
          appearance="transparent"
          className={`${classBase}-action`}
          onClick={() => {
            toast.action?.onClick();
            toastStore.dismiss(toast.id);
          }}
        >
          {toast.action.label}
        </Button>
      ) : null}
      <Button
        appearance="transparent"
        aria-label="Dismiss"
        className={`${classBase}-close`}
        onClick={() => toastStore.dismiss(toast.id)}
      >
        <ChromeIcon name="close" size={14} />
      </Button>
    </div>
  ) : null;
};

/** A hint shown while dragging, styled as a toast but not dismissable */
export const ToastHint = ({ children }: { children: React.ReactNode }) => (
  <div className={`${classBase} ${classBase}-hint`} role="status">
    <span className={`${classBase}-message`}>{children}</span>
  </div>
);
