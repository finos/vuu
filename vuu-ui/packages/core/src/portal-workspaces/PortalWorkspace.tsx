import { Button } from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import {
  GridLayout,
  GridLayoutProvider,
  type GridLayoutDocument,
  type GridLayoutDocumentError,
} from "@vuu-ui/grid-layout";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { PanelsPalette } from "../panels-palette/PanelsPalette";
import {
  PanelsPaletteStateProvider,
  usePanelsPaletteState,
} from "../panels-palette/PanelsPaletteState";
import { TemplateDragHint } from "../panels-palette/TemplateDragHint";
import { OpenPanelProvider } from "../panels-palette/useOpenPanel";
import { WorkspaceDropZone } from "../panels-palette/WorkspaceDropZone";
import type { WorkspaceController } from "../workspace/WorkspaceController";
import { WorkspacePersistentStateProvider } from "../workspace/WorkspacePersistentState";
import { useWorkspace } from "../workspace/WorkspaceProvider";
import { WorkspaceStartPanel } from "../workspace/WorkspaceStartPanel";
import { PortalWorkspaceHeader } from "./PortalWorkspaceHeader";
import {
  getWorkspaceIdFromPath,
  getWorkspacePath,
  type WorkspaceRouteState,
} from "./workspace-routing";

import portalWorkspacesCss from "./PortalWorkspaces.css";

const classBase = "vuuPortalWorkspace";

/** Panels added to a workspace get a header, with their title and close. */
const layoutOptions = { newChildItem: { header: true } };

export interface PortalWorkspaceGridProps {
  controller: WorkspaceController;
}

/**
 * The GridLayout of an open workspace. With an `AddPanelButton`, it renders
 * the Panels palette, within its GridLayoutProvider and OpenPanelProvider,
 * and an empty workspace shows a drop zone.
 */
export const PortalWorkspaceGrid = ({
  controller,
}: PortalWorkspaceGridProps) => {
  const paletteAvailable = usePanelsPaletteState()?.available === true;
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
      change: Parameters<WorkspaceController["handleDocumentChange"]>[1],
    ) => {
      setIsEmpty(document.components.length === 0);
      controller.handleDocumentChange(document, change);
    },
    [controller],
  );
  return (
    <WorkspacePersistentStateProvider store={controller.persistentState}>
      <GridLayoutProvider
        componentRenderers={controller.renderers}
        document={controller.snapshot.layout}
        documentController={controller.documentController}
        onDocumentChange={handleDocumentChange}
        onDocumentError={handleDocumentError}
        options={layoutOptions}
        settingsCodecs={controller.settingsCodecs}
      >
        <OpenPanelProvider gridId={controller.snapshot.layout.layout.id}>
          <div className={`${classBase}-grid`}>
            <GridLayout
              id={controller.snapshot.layout.layout.id}
              placeholderContent={
                isEmpty ? (
                  paletteAvailable ? (
                    <WorkspaceDropZone />
                  ) : (
                    <WorkspaceStartPanel />
                  )
                ) : undefined
              }
            />
            <TemplateDragHint />
          </div>
          {paletteAvailable ? <PanelsPalette /> : null}
        </OpenPanelProvider>
      </GridLayoutProvider>
    </WorkspacePersistentStateProvider>
  );
};

const WorkspaceState = ({
  children,
  state,
  title,
}: {
  children?: ReactNode;
  state: "error" | "loading" | "not-found" | "opening";
  title: string;
}) => (
  <div
    className={`${classBase}-state`}
    data-workspace-state={state}
    role={state === "loading" || state === "opening" ? "status" : undefined}
  >
    <h2>{title}</h2>
    {children}
  </div>
);

export interface PortalWorkspaceProps {
  /**
   * Actions in the workspace header, before "Reset to default". A slot for
   * e.g. "Add panel".
   */
  headerActions?: ReactNode;
}

/** Opens the Panels palette, if available, when a new workspace arrives. */
const OpenPaletteForNewWorkspace = ({ open }: { open: boolean }) => {
  const paletteState = usePanelsPaletteState();
  const available = paletteState?.available === true;
  const setOpen = paletteState?.setOpen;
  useEffect(() => {
    if (open && available) {
      setOpen?.(true);
    }
  }, [available, open, setOpen]);
  return null;
};

/**
 * Route element for `/workspaces/:workspaceId`. Makes the workspace in the
 * URL the active workspace and renders it, with a header. An unknown id
 * shows a not-found state.
 */
export const PortalWorkspace = ({ headerActions }: PortalWorkspaceProps) => {
  useComponentCssInjection({
    testId: "vuu-portal-workspaces",
    css: portalWorkspacesCss,
    window: useWindow(),
  });
  const location = useLocation();
  // Decoded the same way as the nav's active row.
  const workspaceId = getWorkspaceIdFromPath(location.pathname);
  const navigate = useNavigate();
  const {
    activeWorkspaceId,
    controllers,
    error,
    setActiveWorkspace,
    status,
    workspaces,
  } = useWorkspace();

  const summary = workspaces.find(({ id }) => id === workspaceId);
  const controller = controllers.find(
    ({ definitionId }) => definitionId === workspaceId,
  );
  const settled = status !== "loading";
  const known = summary !== undefined;
  const open = controller !== undefined;
  const [failedId, setFailedId] = useState<string>();
  const pending = useRef<string>(undefined);
  const activeIdRef = useRef(activeWorkspaceId);
  activeIdRef.current = activeWorkspaceId;

  // URL -> active workspace. Runs when the URL changes, not when something
  // else (e.g. createWorkspace) changes the active workspace, so the two
  // don't fight while a navigation is in flight.
  useEffect(() => {
    if (!settled || !known || workspaceId === undefined) {
      return;
    }
    if (
      pending.current === workspaceId ||
      (open && activeIdRef.current === workspaceId)
    ) {
      return;
    }
    pending.current = workspaceId;
    setActiveWorkspace(workspaceId)
      .then(
        () => setFailedId((id) => (id === workspaceId ? undefined : id)),
        () => setFailedId(workspaceId),
      )
      .finally(() => {
        if (pending.current === workspaceId) {
          pending.current = undefined;
        }
      });
  }, [known, open, setActiveWorkspace, settled, workspaceId]);

  // A new workspace arrives with its name in edit mode, once.
  const routeState = location.state as WorkspaceRouteState | null;
  const [editNameId, setEditNameId] = useState<string>();
  useEffect(() => {
    if (routeState?.editName) {
      setEditNameId(workspaceId);
      navigate(
        {
          hash: location.hash,
          pathname: location.pathname,
          search: location.search,
        },
        { replace: true, state: null },
      );
    }
  }, [location, navigate, routeState?.editName, workspaceId]);

  let content: ReactNode;
  if (!settled) {
    content = <WorkspaceState state="loading" title="Loading workspaces…" />;
  } else if (status === "error" && !known) {
    content = (
      <WorkspaceState state="error" title="Workspaces could not be loaded">
        {error ? <p>{error.message}</p> : null}
      </WorkspaceState>
    );
  } else if (!known || failedId === workspaceId) {
    const fallback = workspaces[0];
    content = (
      <WorkspaceState state="not-found" title="Workspace not found">
        <p>
          There is no workspace with the id “{workspaceId}”. It may have been
          deleted.
        </p>
        {fallback ? (
          <Button
            appearance="bordered"
            onClick={() => navigate(getWorkspacePath(fallback.id))}
            sentiment="neutral"
          >
            Open {fallback.name}
          </Button>
        ) : null}
      </WorkspaceState>
    );
  } else {
    content = (
      <PanelsPaletteStateProvider>
        <OpenPaletteForNewWorkspace open={editNameId === summary.id} />
        <PortalWorkspaceHeader
          actions={headerActions}
          editName={editNameId === summary.id}
          key={summary.id}
          onEditNameEnd={() => setEditNameId(undefined)}
          workspace={summary}
        />
        <div className={`${classBase}-body`}>
          {controller ? (
            <PortalWorkspaceGrid
              controller={controller}
              key={controller.instanceId}
            />
          ) : (
            <WorkspaceState state="opening" title="Opening workspace…" />
          )}
        </div>
      </PanelsPaletteStateProvider>
    );
  }

  return (
    <div className={classBase} data-workspace-id={workspaceId}>
      {content}
    </div>
  );
};
