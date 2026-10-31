import {
  GridLayout,
  GridLayoutProvider,
  type GridLayoutDocument,
  type GridLayoutDocumentError,
} from "@heswell/grid-layout";
import {
  Tab,
  Tabstrip,
  type ExitTabEditModeHandler,
} from "@vuu-ui/vuu-ui-controls";
import { useCallback, useRef, useState } from "react";
import {
  WorkspacePersistentStateProvider,
  WorkspacePersistentStateStore,
} from "./WorkspacePersistentState";
import { emptyWorkspaceSnapshot, useWorkspace } from "./WorkspaceProvider";
import { WorkspaceStartPanel } from "./WorkspaceStartPanel";
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
  const [isEmpty, setIsEmpty] = useState(
    controller.snapshot.layout.components.length === 0,
  );
  const handleDocumentError = useCallback((error: GridLayoutDocumentError) => {
    throw new Error(
      `Invalid workspace document at ${error.path}: ${error.message}`,
    );
  }, []);
  const handleDocumentChange = useCallback(
    (
      document: GridLayoutDocument,
      change: Parameters<typeof controller.handleDocumentChange>[1],
    ) => {
      setIsEmpty(document.components.length === 0);
      controller.handleDocumentChange(document, change);
    },
    [controller],
  );
  return (
    <section
      aria-hidden={!active}
      aria-labelledby={`${controller.instanceId}-tab`}
      className="vuuWorkspaceHost-workspace"
      data-workspace-instance-id={controller.instanceId}
      hidden={!active}
      id={controller.instanceId}
      role="tabpanel"
    >
      <WorkspacePersistentStateProvider store={controller.persistentState}>
        <GridLayoutProvider
          componentRenderers={controller.renderers}
          document={controller.snapshot.layout}
          documentController={controller.documentController}
          onDocumentChange={handleDocumentChange}
          onDocumentError={handleDocumentError}
          settingsCodecs={controller.settingsCodecs}
        >
          <GridLayout
            id={controller.snapshot.layout.layout.id}
            placeholderContent={isEmpty ? <WorkspaceStartPanel /> : undefined}
          />
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
            placeholderContent={<WorkspaceStartPanel />}
          />
        </GridLayoutProvider>
      </WorkspacePersistentStateProvider>
    </div>
  );
};

export const WorkspaceHost = () => {
  const {
    activeWorkspaceInstanceId,
    closeWorkspace,
    controllers,
    createWorkspaceFromSnapshot,
    error,
    renameWorkspace,
    selectWorkspace,
    status,
  } = useWorkspace();
  const [tabRevision, setTabRevision] = useState(0);
  const activeWorkspaceIndex = controllers.findIndex(
    ({ instanceId }) => instanceId === activeWorkspaceInstanceId,
  );
  const handleActiveChange = useCallback(
    (tabIndex: number) => {
      const controller = controllers[tabIndex];
      if (controller) {
        void selectWorkspace(controller.instanceId);
      }
    },
    [controllers, selectWorkspace],
  );
  const handleCloseTab = useCallback(
    (tabIndex: number) => {
      const controller = controllers[tabIndex];
      if (controller) {
        void closeWorkspace(controller.instanceId);
      }
    },
    [closeWorkspace, controllers],
  );
  const handleAddTab = useCallback(() => {
    const titles = new Set(controllers.map(({ name }) => name));
    let suffix = 1;
    let title = "Untitled";
    while (titles.has(title)) {
      suffix += 1;
      title = `Untitled ${suffix}`;
    }
    void createWorkspaceFromSnapshot(emptyWorkspaceSnapshot, title).catch(
      () => undefined,
    );
  }, [controllers, createWorkspaceFromSnapshot]);
  const handleExitEditMode = useCallback<ExitTabEditModeHandler>(
    (originalTitle, title, _allowDeactivation, tabIndex) => {
      const controller = controllers[tabIndex];
      if (controller && title !== originalTitle) {
        void renameWorkspace(controller.instanceId, title).catch(() => {
          setTabRevision((revision) => revision + 1);
        });
      }
    },
    [controllers, renameWorkspace],
  );

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
  return (
    <div className="vuuWorkspaceHost vuu-workspace-tabs">
      <Tabstrip
        activeTabIndex={activeWorkspaceIndex}
        allowAddTab
        allowCloseTab
        allowRenameTab
        animateSelectionThumb={false}
        aria-label="Workspace Tabs"
        className="vuuTabHeader"
        onActiveChange={handleActiveChange}
        onAddTab={handleAddTab}
        onCloseTab={handleCloseTab}
        onExitEditMode={handleExitEditMode}
        variant="primary"
      >
        {controllers.map((controller) => (
          <Tab
            ariaControls={controller.instanceId}
            id={`${controller.instanceId}-tab`}
            key={`${controller.instanceId}-${tabRevision}`}
            label={controller.name}
            onClose={() => void closeWorkspace(controller.instanceId)}
          />
        ))}
      </Tabstrip>
      <div className="vuuWorkspaceHost-content">
        {status === "empty" ? (
          <EmptyWorkspaceDropTarget />
        ) : (
          controllers.map((controller) => (
            <WorkspaceGrid
              active={controller.instanceId === activeWorkspaceInstanceId}
              controller={controller}
              key={controller.instanceId}
            />
          ))
        )}
      </div>
    </div>
  );
};
