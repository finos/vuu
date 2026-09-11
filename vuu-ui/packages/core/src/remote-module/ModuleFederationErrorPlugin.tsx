import type { ModuleFederationRuntimePlugin } from "@module-federation/enhanced/runtime";
import { RemoteModuleLoadError } from "./RemoteModuleLoadError";

export const createRemoteModuleErrorPlugin =
  (): ModuleFederationRuntimePlugin => ({
    name: "vuu-remote-module-error-plugin",
    errorLoadRemote({ error, id, lifecycle }) {
      if (lifecycle !== "onLoad") {
        return undefined;
      }

      return {
        default: () => <RemoteModuleLoadError error={error} moduleId={id} />,
      };
    },
  });
