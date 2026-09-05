import {
  GridLayout,
  GridLayoutProvider,
  type GridLayoutDocumentError,
} from "@heswell/grid-layout";
import { IconButton } from "@vuu-ui/vuu-ui-controls";
import { useCallback } from "react";
import { WorkspacePersistentStateProvider } from "./WorkspacePersistentState";
import { useWorkspace } from "./WorkspaceProvider";

const WorkspaceGrid = ({
  active,
  controller,
}: {
  readonly active: boolean;
  readonly controller: NonNullable<
    ReturnType<typeof useWorkspace>["activeWorkspace"]
  >;
}) => {
  const handleDocumentError = useCallback((error: GridLayoutDocumentError) => {
    throw new Error(
      `Invalid workspace document at ${error.path}: ${error.message}`,
    );
  }, []);
  return (
    <section
      aria-hidden={!active}
      className="vuuWorkspaceHost-workspace"
      data-workspace-instance-id={controller.instanceId}
      hidden={!active}
    >
      <WorkspacePersistentStateProvider store={controller.persistentState}>
        <GridLayoutProvider
          componentRenderers={controller.renderers}
          document={controller.snapshot.layout}
          documentController={controller.documentController}
          onDocumentChange={controller.handleDocumentChange}
          onDocumentError={handleDocumentError}
          settingsCodecs={controller.settingsCodecs}
        >
          <GridLayout id={controller.snapshot.layout.layout.id} />
        </GridLayoutProvider>
      </WorkspacePersistentStateProvider>
    </section>
  );
};

export const WorkspaceHost = () => {
  const {
    activeWorkspaceInstanceId,
    closeWorkspace,
    controllers,
    error,
    selectWorkspace,
    status,
  } = useWorkspace();

  if (status === "loading") {
    return (
      <div className="vuuWorkspaceHost-state" role="status">
        Loading workspaces…
      </div>
    );
  }
  if (status === "error") {
    return (
      <div className="vuuWorkspaceHost-state" role="alert">
        {error?.message ?? "Unable to load workspaces"}
      </div>
    );
  }
  if (status === "empty") {
    return (
      <div className="vuuWorkspaceHost-state">
        Select a workspace from My Layouts to begin.
      </div>
    );
  }

  return (
    <div className="vuuWorkspaceHost">
      <div
        aria-label="Open workspaces"
        className="vuuWorkspaceHost-tabs"
        role="tablist"
      >
        {controllers.map((controller) => {
          const active = controller.instanceId === activeWorkspaceInstanceId;
          return (
            <div className="vuuWorkspaceHost-tab" key={controller.instanceId}>
              <button
                aria-selected={active}
                onClick={() => void selectWorkspace(controller.instanceId)}
                role="tab"
                type="button"
              >
                {controller.name}
              </button>
              <IconButton
                aria-label={`Close ${controller.name}`}
                appearance="transparent"
                icon="close"
                onClick={() => void closeWorkspace(controller.instanceId)}
                sentiment="neutral"
              />
            </div>
          );
        })}
      </div>
      <div className="vuuWorkspaceHost-content">
        {controllers.map((controller) => (
          <WorkspaceGrid
            active={controller.instanceId === activeWorkspaceInstanceId}
            controller={controller}
            key={controller.instanceId}
          />
        ))}
      </div>
    </div>
  );
};
