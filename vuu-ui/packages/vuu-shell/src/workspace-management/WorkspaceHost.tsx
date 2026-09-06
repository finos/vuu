import {
  GridLayout,
  GridLayoutProvider,
  type GridLayoutDocument,
  type GridLayoutDocumentError,
} from "@heswell/grid-layout";
import { IconButton } from "@vuu-ui/vuu-ui-controls";
import { useCallback, useRef, useState } from "react";
import {
  WorkspacePersistentStateProvider,
  WorkspacePersistentStateStore,
} from "./WorkspacePersistentState";
import { emptyWorkspaceSnapshot, useWorkspace } from "./WorkspaceProvider";
import { WORKSPACE_SNAPSHOT_VERSION } from "./workspace-schemas";

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

const EmptyWorkspaceDropTarget = () => {
  const { componentRenderers, createWorkspaceFromSnapshot, settingsCodecs } =
    useWorkspace();
  const creating = useRef(false);
  const [creationPending, setCreationPending] = useState(false);
  const [generation, setGeneration] = useState(0);
  const [persistentState, setPersistentState] = useState(
    () => new WorkspacePersistentStateStore(),
  );
  const handleDocumentError = useCallback((error: GridLayoutDocumentError) => {
    throw new Error(
      `Invalid empty workspace document at ${error.path}: ${error.message}`,
    );
  }, []);
  const handleDocumentChange = useCallback(
    (document: GridLayoutDocument) => {
      if (creating.current || document.components.length === 0) {
        return;
      }
      creating.current = true;
      setCreationPending(true);
      void createWorkspaceFromSnapshot(
        {
          componentState: persistentState.getSnapshot(),
          layout: document,
          version: WORKSPACE_SNAPSHOT_VERSION,
        },
        "Untitled",
      ).catch(() => {
        creating.current = false;
        setCreationPending(false);
        setPersistentState(new WorkspacePersistentStateStore());
        setGeneration((current) => current + 1);
      });
    },
    [createWorkspaceFromSnapshot, persistentState],
  );

  if (!componentRenderers || !settingsCodecs) {
    return (
      <div className="vuuWorkspaceHost-state" role="alert">
        Workspace component registries are not configured.
      </div>
    );
  }

  if (creationPending) {
    return (
      <div className="vuuWorkspaceHost-empty">
        <div className="vuuWorkspaceHost-state" role="status">
          Creating workspace…
        </div>
      </div>
    );
  }

  return (
    <div className="vuuWorkspaceHost-empty">
      <WorkspacePersistentStateProvider store={persistentState}>
        <GridLayoutProvider
          componentRenderers={componentRenderers}
          key={generation}
          onDocumentChange={handleDocumentChange}
          onDocumentError={handleDocumentError}
          settingsCodecs={settingsCodecs}
        >
          <GridLayout
            className="vuuWorkspaceHost-emptyGrid"
            colsAndRows={{ cols: ["1fr"], rows: ["1fr"] }}
            id={emptyWorkspaceSnapshot.layout.layout.id}
          />
        </GridLayoutProvider>
      </WorkspacePersistentStateProvider>
      <div className="vuuWorkspaceHost-emptyLabel">
        Drop a feature here or select a workspace from My Layouts to begin.
      </div>
    </div>
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
    return <EmptyWorkspaceDropTarget />;
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
