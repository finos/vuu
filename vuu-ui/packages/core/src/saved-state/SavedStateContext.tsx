import { createContext, useContext, useMemo } from "react";
import type { CarryForwardReport } from "../persistence/ApplicationStateStore";
import type { RemoteModuleDescriptor } from "../RemoteModuleDescriptor";
import type { SavedStateApplicationInfo } from "./saved-state-model";
import type { SavedStateToastProps } from "./SavedStateToasts";

export interface SavedStateContextValue {
  /** Opens the Saved state dialog, scoped to one application if given (§9.4). */
  open: (applicationKey?: string) => void;
  /** The saved-state key of a registered module, if it has one. */
  applicationKeyForModule: (
    moduleId: RemoteModuleDescriptor["id"],
  ) => string | undefined;
  /** Shows a toast and announces it (§9.7). */
  notify: (toast: SavedStateToastProps) => void;
  /** Tells the user what wasn't carried forward to a new version (§5.4.7). */
  reportCarryForward: (report: CarryForwardReport) => void;
}

export const SavedStateContext = createContext<SavedStateContextValue | null>(
  null,
);

/** The key a remote module's saved state is stored under (§5.2). */
export const getApplicationKey = ({
  clientIdentifier,
  persistenceKey,
}: Pick<RemoteModuleDescriptor, "clientIdentifier" | "persistenceKey">) =>
  persistenceKey || clientIdentifier || undefined;

/**
 * Registered modules as Saved state applications, in navigation order:
 * grouped by their top-level navigation location, as PortalAppSwitcher does.
 */
export const toSavedStateApplications = (
  remoteModules: readonly RemoteModuleDescriptor[],
): SavedStateApplicationInfo[] => {
  const groups: string[] = [];
  const available = remoteModules.filter(
    (module) => module.enabled !== false && getApplicationKey(module),
  );
  for (const { navLocation } of available) {
    const group = navLocation?.split("/").filter(Boolean)[0] ?? "";
    if (!groups.includes(group)) groups.push(group);
  }
  const groupOf = ({ navLocation }: RemoteModuleDescriptor) =>
    groups.indexOf(navLocation?.split("/").filter(Boolean)[0] ?? "");
  return available
    .map((module, index) => ({ module, index }))
    .sort((a, b) => groupOf(a.module) - groupOf(b.module) || a.index - b.index)
    .map(({ module }) => ({
      applicationKey: getApplicationKey(module) as string,
      title: module.title || module.name,
      version: module.version,
    }));
};

export const useOptionalSavedState = () => useContext(SavedStateContext);

const unavailable = {
  available: false,
  open: () => {
    console.warn(
      "[useSavedStateDialog] the Saved state dialog is provided by the portal shell",
    );
  },
};

/**
 * Opens the Saved state dialog from anywhere in the shell, e.g. from an
 * application's own "Reset view" action (§9.2). Outside a portal shell,
 * `available` is false and `open` does nothing.
 */
export const useSavedStateDialog = (): {
  available: boolean;
  open: (applicationKey?: string) => void;
} => {
  const context = useContext(SavedStateContext);
  return useMemo(
    () => (context ? { available: true, open: context.open } : unavailable),
    [context],
  );
};
