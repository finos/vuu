import { useParams } from "react-router-dom";
import { useModuleRegistry } from "../auth/AuthenticationProvider";
import { PortalModuleRegistryProvider } from "../portal-module-registry/PortalModuleRegistry";
import {
  WindowShell,
  type WindowShellProps,
} from "../window-shell/WindowShell";
import { RemoteModule } from "../remote-module/RemoteModule";

export type WindowHostProps = Omit<WindowShellProps, "children">;

/** Mount at WINDOW_HOST_ROUTE beneath the host's AuthenticationProvider. */
export const WindowHost = (props: WindowHostProps) => {
  const { moduleId } = useParams<"moduleId">();
  const { modules } = useModuleRegistry();
  const descriptor = modules.find(
    ({ enabled, id }) => enabled !== false && String(id) === moduleId,
  );

  return (
    <WindowShell {...props}>
      {descriptor ? (
        <PortalModuleRegistryProvider remoteModules={modules}>
          <RemoteModule key={descriptor.id} {...descriptor} />
        </PortalModuleRegistryProvider>
      ) : (
        <div role="alert">
          This module is unavailable or you do not have access to it.
        </div>
      )}
    </WindowShell>
  );
};
