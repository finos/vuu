import { useCallback } from "react";
import { useLogout } from "@vuu-ui/core";
import { useOptionalPortalPersistence } from "../persistence/PersistenceContext";

/**
 * Logs out, first writing any pending saved state and disposing the
 * persistence service, so that nothing is written after the user has gone
 * (FR-15).
 */
export const usePortalLogout = () => {
  const logout = useLogout();
  const persistence = useOptionalPortalPersistence();
  return useCallback(async () => {
    if (persistence && !persistence.isDisposed()) {
      try {
        await persistence.flushAll();
      } catch (error) {
        console.warn("[PortalLogout] unable to write saved state", error);
      }
      persistence.dispose();
    }
    await logout();
  }, [logout, persistence]);
};
