import {
  Button,
  Checkbox,
  FormField,
  FormFieldLabel,
  Input,
  Overlay,
  OverlayPanel,
  OverlayPanelContent,
  OverlayTrigger,
} from "@salt-ds/core";
import { RefreshIcon, SaveIcon } from "@salt-ds/icons";
import {
  type WorkspaceSnapshotV1,
  useOptionalWorkspace,
  useWorkspace,
} from "@vuu-ui/core";
import {
  AddPanelButton,
  createPortalComponentRegistries,
  getVuuServerBrowsePath,
  getWorkspacePath,
  type PanelsPaletteProps,
  PanelsPaletteStateProvider,
  PortalStateScope,
  PortalWorkspaceGrid,
  useRetryConnection,
  usePortalVuuServers,
  useTransientWorkspace,
  useVuuServerUnreachable,
  WorkspaceDropZone,
} from "@vuu-ui/core/portal";
import { useNotifications } from "@vuu-ui/vuu-notifications";
import { type FormEvent, type ReactNode, useMemo, useState } from "react";
import {
  Link,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

import "./VuuTableBrowser.css";

const classBase = "vuuTableBrowser";

/**
 * The browser's own path, without the route below it. Relative paths such as
 * "." resolve against the full splat, so strip its segments instead.
 */
export const browserBasePath = (pathname: string, routePath = "") => {
  const segments = pathname.replace(/\/$/, "").split("/");
  const route = routePath.replace(/\/$/, "");
  const routeSegments = route ? route.split("/").length : 0;
  return segments.slice(0, segments.length - routeSegments).join("/");
};

const useBrowserBasePath = () => {
  const { pathname } = useLocation();
  const routePath = useParams()["*"];
  return browserBasePath(pathname, routePath);
};

interface OpenTable {
  module: string;
  table: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

/** The tables open in a workspace snapshot, in layout order. */
export const getOpenTables = (snapshot: WorkspaceSnapshotV1): OpenTable[] =>
  snapshot.layout.components.flatMap(({ settings, type }) =>
    type === "vuu-table" &&
    isRecord(settings) &&
    typeof settings.module === "string" &&
    typeof settings.table === "string"
      ? [{ module: settings.module, table: settings.table }]
      : [],
  );

/**
 * The default name of a saved Browse layout, built from its open tables,
 * e.g. "SIMUL instruments + prices".
 */
export const getDefaultWorkspaceName = (
  serverId: string,
  tables: readonly OpenTable[],
) => {
  if (tables.length === 0) {
    return `${serverId} tables`;
  }
  const modules = new Set(tables.map(({ module }) => module));
  if (modules.size === 1) {
    return `${tables[0].module} ${tables.map(({ table }) => table).join(" + ")}`;
  }
  return tables.map(({ module, table }) => `${module} ${table}`).join(" + ");
};

interface SaveAsWorkspaceProps {
  defaultName: string;
  disabled?: boolean;
  onSaved: () => void;
  snapshot: WorkspaceSnapshotV1;
}

const SaveAsWorkspace = ({
  defaultName,
  disabled,
  onSaved,
  snapshot,
}: SaveAsWorkspaceProps) => {
  const { createWorkspace } = useWorkspace();
  const { showNotification } = useNotifications();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(defaultName);
  const [openAfterSave, setOpenAfterSave] = useState(true);
  const [busy, setBusy] = useState(false);

  const onOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      setName(defaultName);
      setOpenAfterSave(true);
    }
  };

  const save = async (event?: FormEvent) => {
    event?.preventDefault();
    const trimmedName = name.trim();
    if (trimmedName === "" || busy) {
      return;
    }
    setBusy(true);
    try {
      const workspaceId = await createWorkspace(trimmedName, snapshot);
      setOpen(false);
      onSaved();
      if (openAfterSave) {
        navigate(getWorkspacePath(workspaceId));
      }
    } catch (cause: unknown) {
      showNotification({
        content: cause instanceof Error ? cause.message : String(cause),
        header: "Failed to Save Workspace",
        status: "error",
        type: "toast",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Overlay onOpenChange={onOpenChange} open={open} placement="bottom-end">
      <OverlayTrigger>
        <Button
          appearance="bordered"
          aria-pressed={open}
          disabled={disabled}
          sentiment="neutral"
        >
          <SaveIcon aria-hidden />
          Save as workspace
        </Button>
      </OverlayTrigger>
      <OverlayPanel aria-label="Save as workspace">
        <OverlayPanelContent>
          <form className={`${classBase}-save`} onSubmit={save}>
            <h3>Save as workspace</h3>
            <FormField>
              <FormFieldLabel>Name</FormFieldLabel>
              <Input
                inputProps={{
                  autoFocus: true,
                  name: "workspaceName",
                  onChange: (event) => setName(event.target.value),
                }}
                value={name}
              />
            </FormField>
            <Checkbox
              checked={openAfterSave}
              label="Open the workspace after saving"
              onChange={(event) => setOpenAfterSave(event.target.checked)}
            />
            <div className={`${classBase}-saveActions`}>
              <Button
                appearance="transparent"
                disabled={busy}
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                disabled={busy || name.trim() === ""}
                sentiment="accented"
                type="submit"
              >
                Save
              </Button>
            </div>
          </form>
        </OverlayPanelContent>
      </OverlayPanel>
    </Overlay>
  );
};

interface ServerUnavailableProps {
  basePath: string;
  serverId: string;
}

const ServerUnavailable = ({ basePath, serverId }: ServerUnavailableProps) => {
  const navigate = useNavigate();
  const retryConnection = useRetryConnection();
  return (
    <div className={`${classBase}-error`} role="alert">
      <strong>{serverId} is unreachable</strong>
      <span>The Vuu server {serverId} is not available.</span>
      <div className={`${classBase}-errorActions`}>
        <Button onClick={() => retryConnection(serverId)}>
          <RefreshIcon aria-hidden />
          Retry
        </Button>
        <Button onClick={() => navigate(basePath)}>Change server</Button>
      </div>
    </div>
  );
};

/** Component registries for a Browse page outside a `WorkspaceProvider`. */
const useBrowseRegistries = () => {
  const workspace = useOptionalWorkspace();
  const fallback = useMemo(
    () =>
      workspace?.componentRenderers && workspace.settingsCodecs
        ? undefined
        : createPortalComponentRegistries(),
    [workspace?.componentRenderers, workspace?.settingsCodecs],
  );
  return {
    componentRenderers: workspace?.componentRenderers ?? fallback?.renderers,
    settingsCodecs: workspace?.settingsCodecs ?? fallback?.settingsCodecs,
  };
};

const browsePaletteProps = (serverId: string): PanelsPaletteProps => ({
  defaultServerId: serverId,
  tabs: ["tables"],
});

interface BrowsePageProps {
  basePath: string;
  serverId: string;
}

/**
 * The Browse page of a server: an unsaved workspace with the Panels palette
 * pinned, offering only its Tables tab, showing that server's tables. "Save as
 * workspace" keeps the layout as a named workspace.
 */
const BrowsePage = ({ basePath, serverId }: BrowsePageProps) => {
  const canSave = useOptionalWorkspace() !== undefined;
  const { componentRenderers, settingsCodecs } = useBrowseRegistries();
  const { controller, edited, reset, snapshot } = useTransientWorkspace({
    componentRenderers,
    name: serverId,
    settingsCodecs,
  });
  // Unknown servers, and known servers that are down or refuse the user,
  // offer Retry and Change server. When a server comes back, this updates
  // and the page recovers.
  const unavailable = useVuuServerUnreachable(serverId);
  const openTables = useMemo(() => getOpenTables(snapshot), [snapshot]);

  const emptyContent: ReactNode = unavailable ? (
    <ServerUnavailable basePath={basePath} serverId={serverId} />
  ) : (
    <WorkspaceDropZone title="Pick a table">
      Click a table on the right to open it here, or drag tables in to view
      several side by side.
      {canSave ? (
        <>
          {" "}
          Use <b>Save as workspace</b> to keep the layout.
        </>
      ) : null}
    </WorkspaceDropZone>
  );

  return (
    <PanelsPaletteStateProvider defaultOpen defaultPinned>
      <div
        className={`vuuPortalWorkspace ${classBase}`}
        data-server-id={serverId}
      >
        <header className="vuuPortalWorkspaceHeader">
          <span className="vuuPortalWorkspaceHeader-crumb">
            Tables / Browse /
          </span>
          <h1 className="vuuPortalWorkspaceHeader-title">{serverId}</h1>
          <span className="vuuPortalWorkspaceHeader-status">
            {edited ? "Unsaved layout" : null}
          </span>
          <span className="vuuPortalWorkspaceHeader-spacer" />
          <div className="vuuPortalWorkspaceHeader-actions">
            {canSave ? (
              <SaveAsWorkspace
                defaultName={getDefaultWorkspaceName(serverId, openTables)}
                disabled={openTables.length === 0 && !edited}
                onSaved={reset}
                snapshot={snapshot}
              />
            ) : null}
            <Button
              appearance="transparent"
              aria-label="Clear layout"
              disabled={!edited}
              onClick={reset}
              sentiment="neutral"
              title="Clear layout"
            >
              <RefreshIcon aria-hidden />
            </Button>
            <AddPanelButton appearance="bordered" sentiment="neutral">
              Tables
            </AddPanelButton>
          </div>
        </header>
        <div className="vuuPortalWorkspace-body">
          <PortalWorkspaceGrid
            controller={controller}
            emptyContent={emptyContent}
            key={controller.instanceId}
            paletteProps={browsePaletteProps(serverId)}
          />
        </div>
      </div>
    </PanelsPaletteStateProvider>
  );
};

const ServerList = ({ basePath }: { basePath: string }) => {
  const servers = usePortalVuuServers();
  return (
    <div className={`${classBase}-landing`}>
      <h1>Browse tables</h1>
      <p>Choose a Vuu server to browse its tables.</p>
      {servers.length === 0 ? (
        <p>No Vuu servers are configured.</p>
      ) : (
        <ul aria-label="Vuu servers" className={`${classBase}-serverList`}>
          {servers.map(({ connectionId }) => (
            <li key={connectionId}>
              <Link to={getVuuServerBrowsePath(basePath, connectionId)}>
                {connectionId}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const BrowseRoute = ({ basePath }: { basePath: string }) => {
  const { serverId = "" } = useParams();
  return <BrowsePage basePath={basePath} key={serverId} serverId={serverId} />;
};

/**
 * Browses the tables of the portal's Vuu servers. The index route lists the
 * servers; `<serverId>` is that server's Browse page.
 */
const VuuTableBrowser = () => {
  const basePath = useBrowserBasePath();
  return (
    <PortalStateScope>
      <Routes>
        <Route element={<ServerList basePath={basePath} />} index />
        <Route
          element={<BrowseRoute basePath={basePath} />}
          path=":serverId/*"
        />
      </Routes>
    </PortalStateScope>
  );
};

export default VuuTableBrowser;
