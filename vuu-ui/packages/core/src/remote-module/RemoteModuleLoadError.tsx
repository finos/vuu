const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

export const RemoteModuleLoadError = ({
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
