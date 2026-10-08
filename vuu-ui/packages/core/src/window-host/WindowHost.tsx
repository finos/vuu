import { useParams } from "react-router-dom";
import { useModuleRegistry } from "../auth/AuthenticationProvider";
import { PortalModuleRegistryProvider } from "../portal-module-registry/PortalModuleRegistry";
import { PortalLinkProvider } from "../portal-link/PortalLink";
import { getWindowHostPath } from "./window-host-routing";
import {
  WindowShell,
  type WindowShellProps,
} from "../window-shell/WindowShell";
import { RemoteModule } from "../remote-module/RemoteModule";
import { PortalModuleIdContext } from "../notifications/PortalNotificationsContext";

export type WindowHostProps = Omit<WindowShellProps, "children">;

/** Mount at WINDOW_HOST_ROUTE beneath the host's AuthenticationProvider. */
export const WindowHost = (props: WindowHostProps) => {
  const { moduleId } = useParams<"moduleId">();
  const { modules } = useModuleRegistry();
  const descriptor = modules.find(
    ({ enabled, id }) => enabled !== false && String(id) === moduleId,
  );

  return (
    <WindowShell
      openModuleId={descriptor?.id}
      remoteModules={modules}
      {...props}
    >
      {descriptor ? (
        <PortalLinkProvider
          modulePath={descriptor.path}
          windowPath={getWindowHostPath(descriptor.id)}
        >
          <PortalModuleRegistryProvider remoteModules={modules}>
            <PortalModuleIdContext.Provider value={descriptor.id}>
              <RemoteModule key={descriptor.id} {...descriptor} />
            </PortalModuleIdContext.Provider>
          </PortalModuleRegistryProvider>
        </PortalLinkProvider>
      ) : (
        <div role="alert">
          This module is unavailable or you do not have access to it.
        </div>
      )}
    </WindowShell>
  );
};
