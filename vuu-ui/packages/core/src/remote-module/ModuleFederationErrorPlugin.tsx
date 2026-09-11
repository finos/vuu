import type { ModuleFederationRuntimePlugin } from "@module-federation/enhanced/runtime";

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

const RemoteModuleLoadError = ({
  moduleId,
  error,
}: {
  error: unknown;
  moduleId: string;
}) => (
  <div role="alert">
    <h1>Unable to load {moduleId}</h1>
    <p>
      This module is incompatible with the version of VUU used by this portal.
      Contact your portal administrator to deploy compatible versions.
    </p>
    <p>{getErrorMessage(error)}</p>
  </div>
);

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
