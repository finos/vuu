import { type ReactNode, useMemo } from "react";
import {
  ApplicationStateProvider,
  useOptionalApplicationState,
  useOptionalPortalPersistence,
} from "./PersistenceContext";
import {
  PORTAL_APPLICATION_KEY,
  PORTAL_APPLICATION_VERSION,
} from "./StateDocument";

/**
 * Within a remote module, gives its children the portal's saved state
 * rather than the module's, so that portal components rendered by the module
 * (e.g. the Panels palette) share the user's portal settings. Outside a
 * portal shell, children keep the enclosing store.
 */
export const PortalStateScope = ({ children }: { children: ReactNode }) => {
  const service = useOptionalPortalPersistence();
  const enclosingStore = useOptionalApplicationState();
  const store = useMemo(
    () =>
      service
        ? service.getStore(PORTAL_APPLICATION_KEY, PORTAL_APPLICATION_VERSION)
        : enclosingStore,
    [enclosingStore, service],
  );
  return (
    <ApplicationStateProvider store={store}>
      {children}
    </ApplicationStateProvider>
  );
};
