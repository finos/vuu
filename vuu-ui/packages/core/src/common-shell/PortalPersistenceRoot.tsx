import { type ReactNode, useEffect, useMemo } from "react";
import { useOptionalAuthenticatedUser } from "@vuu-ui/core";
import { InMemoryPersistenceBackend } from "../persistence/InMemoryPersistenceBackend";
import {
  DEFAULT_PORTAL_ID,
  LocalStoragePersistenceBackend,
} from "../persistence/LocalStoragePersistenceBackend";
import type { PersistenceBackend } from "../persistence/PersistenceBackend";
import {
  ApplicationStateProvider,
  PortalPersistenceProvider,
} from "../persistence/PersistenceContext";
import {
  type PortalPersistenceService,
  createPortalPersistenceService,
} from "../persistence/PortalPersistenceService";
import {
  PORTAL_APPLICATION_KEY,
  PORTAL_APPLICATION_VERSION,
} from "../persistence/StateDocument";

/** Used when a shell is rendered without an identity AuthenticationProvider. */
export const ANONYMOUS_USER = "anonymous";

export const PORTAL_APPLICATION_TITLE = "Portal";

export interface PortalPersistenceProps {
  /**
   * Storage backend for saved application state. Pass a stable instance.
   * Default: LocalStoragePersistenceBackend.
   * Pass `false` to disable persistence (applications receive an in-memory store).
   */
  persistence?: PersistenceBackend | false;
  /**
   * Separates the saved state of portals on the same origin. PortalShell
   * uses its `id`. Default "vuu-portal".
   */
  portalId?: string;
}

const createDefaultBackend = (portalId = DEFAULT_PORTAL_ID) => {
  try {
    return new LocalStoragePersistenceBackend({ portalId });
  } catch (error) {
    console.warn(
      "[PortalPersistence] localStorage is not available, saved state will not outlive this page",
      error,
    );
    return new InMemoryPersistenceBackend();
  }
};

const pendingDisposal = new WeakMap<
  PortalPersistenceService,
  ReturnType<typeof setTimeout>
>();

/**
 * Disposes the service after unmount (or when the user changes). Disposal is
 * deferred so that StrictMode's unmount/remount doesn't dispose a service
 * that is still in use.
 */
const useDisposeOnUnmount = (service: PortalPersistenceService) => {
  useEffect(() => {
    const timer = pendingDisposal.get(service);
    if (timer !== undefined) {
      clearTimeout(timer);
      pendingDisposal.delete(service);
    }
    return () => {
      pendingDisposal.set(
        service,
        setTimeout(() => {
          pendingDisposal.delete(service);
          service.dispose();
        }, 0),
      );
    };
  }, [service]);
};

/**
 * Creates the PortalPersistenceService for the authenticated user (FR-1) and
 * provides it, along with the portal's own `vuu.portal` store, to the shell.
 */
export const PortalPersistenceRoot = ({
  children,
  persistence,
  portalId,
}: PortalPersistenceProps & { children: ReactNode }) => {
  const user = useOptionalAuthenticatedUser()?.userName || ANONYMOUS_USER;
  const backend = useMemo(
    () =>
      persistence === false
        ? new InMemoryPersistenceBackend()
        : (persistence ?? createDefaultBackend(portalId)),
    [persistence, portalId],
  );
  const service = useMemo(
    () => createPortalPersistenceService({ backend, user }),
    [backend, user],
  );
  useDisposeOnUnmount(service);

  const portalStore = useMemo(
    () =>
      service.getStore(PORTAL_APPLICATION_KEY, PORTAL_APPLICATION_VERSION, {
        title: PORTAL_APPLICATION_TITLE,
      }),
    [service],
  );

  return (
    <PortalPersistenceProvider service={service}>
      <ApplicationStateProvider store={portalStore}>
        {children}
      </ApplicationStateProvider>
    </PortalPersistenceProvider>
  );
};
