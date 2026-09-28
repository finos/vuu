import { useAriaAnnouncer } from "@salt-ds/core";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { CarryForwardReport } from "../persistence/ApplicationStateStore";
import { useOptionalPortalPersistence } from "../persistence/PersistenceContext";
import type { RemoteModuleDescriptor } from "../RemoteModuleDescriptor";
import { formatList, plural } from "./saved-state-format";
import {
  getApplicationKey,
  SavedStateContext,
  type SavedStateContextValue,
  toSavedStateApplications,
} from "./SavedStateContext";
import { SavedStateDialog } from "./SavedStateDialog";
import {
  type SavedStateToastItem,
  type SavedStateToastProps,
  SavedStateToasts,
} from "./SavedStateToasts";

/** How long success and info toasts stay up. Errors stay until dismissed. */
export const TOAST_TIMEOUT_MS = 8000;

const describeCarryForward = (
  report: CarryForwardReport,
): SavedStateToastProps | undefined => {
  const title = report.applicationTitle ?? report.applicationKey;
  const notes = report.notifications.join(" ");
  if (report.aborted) {
    return {
      status: "warning",
      title: "Some saved state wasn't carried forward",
      body: `${title} has been updated. Its saved state couldn't be kept, so it has opened with its default view.${notes ? ` ${notes}` : ""}`,
    };
  }
  if (report.rejected.length > 0) {
    const labels = report.rejected.map(({ key, label }) => label ?? key);
    return {
      status: "warning",
      title: "Some saved state wasn't carried forward",
      body: `${title} has been updated. ${plural(report.rejected.length, "item")} couldn't be kept: ${formatList(labels)}.${notes ? ` ${notes}` : ""}`,
    };
  }
  if (notes) {
    return {
      status: "info",
      title: "Saved state carried forward",
      body: `${title} has been updated. ${notes}`,
    };
  }
  return undefined;
};

export interface SavedStateProviderProps {
  children: ReactNode;
  /** Registered modules, for titles, order and availability (§9.3, §9.9). */
  remoteModules?: readonly RemoteModuleDescriptor[];
}

/**
 * Provides the Saved state dialog and its toasts to the shell. Renders
 * nothing extra until they are needed.
 */
export const SavedStateProvider = ({
  children,
  remoteModules,
}: SavedStateProviderProps) => {
  const service = useOptionalPortalPersistence();
  const { announce } = useAriaAnnouncer();
  const [dialog, setDialog] = useState<
    { applicationKey?: string; instance: number } | undefined
  >(undefined);
  const [toasts, setToasts] = useState<SavedStateToastItem[]>([]);
  const nextId = useRef(1);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const applications = useMemo(
    () => (remoteModules ? toSavedStateApplications(remoteModules) : undefined),
    [remoteModules],
  );

  const dismiss = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer !== undefined) clearTimeout(timer);
    timers.current.delete(id);
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  useEffect(() => {
    const pending = timers.current;
    return () => {
      for (const timer of pending.values()) clearTimeout(timer);
      pending.clear();
    };
  }, []);

  const notify = useCallback(
    (toast: SavedStateToastProps) => {
      const id = nextId.current++;
      setToasts((current) => [...current, { ...toast, id }]);
      announce(toast.body ? `${toast.title}. ${toast.body}` : toast.title);
      if (toast.status === "success" || toast.status === "info") {
        timers.current.set(
          id,
          setTimeout(() => dismiss(id), TOAST_TIMEOUT_MS),
        );
      }
    },
    [announce, dismiss],
  );

  const open = useCallback((applicationKey?: string) => {
    setDialog((current) => ({
      applicationKey,
      instance: (current?.instance ?? 0) + 1,
    }));
  }, []);

  const reportCarryForward = useCallback(
    (report: CarryForwardReport) => {
      const toast = describeCarryForward(report);
      if (toast) {
        notify({
          ...toast,
          action:
            report.rejected.length > 0
              ? { label: "Review", onAction: () => open(report.applicationKey) }
              : undefined,
        });
      }
    },
    [notify, open],
  );

  const applicationKeyForModule = useCallback(
    (moduleId: RemoteModuleDescriptor["id"]) => {
      const module = remoteModules?.find(
        ({ id }) => String(id) === String(moduleId),
      );
      return module ? getApplicationKey(module) : undefined;
    },
    [remoteModules],
  );

  const value = useMemo<SavedStateContextValue>(
    () => ({ applicationKeyForModule, notify, open, reportCarryForward }),
    [applicationKeyForModule, notify, open, reportCarryForward],
  );

  return (
    <SavedStateContext.Provider value={value}>
      {children}
      {dialog && service ? (
        <SavedStateDialog
          applications={applications}
          initialApplicationKey={dialog.applicationKey}
          key={dialog.instance}
          onOpenChange={(isOpen) => {
            if (!isOpen) setDialog(undefined);
          }}
          open
        />
      ) : null}
      <SavedStateToasts onDismiss={dismiss} toasts={toasts} />
    </SavedStateContext.Provider>
  );
};
