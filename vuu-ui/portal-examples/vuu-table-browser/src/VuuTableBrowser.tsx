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
  getWorkspacePath,
  type PanelsPaletteProps,
  PanelsPaletteStateProvider,
  PortalStateScope,
  PortalWorkspaceGrid,
  useTransientWorkspace,
  WorkspaceDropZone,
} from "@vuu-ui/core/portal";
import { useNotifications } from "@vuu-ui/vuu-notifications";
import { type FormEvent, type ReactNode, useMemo, useState } from "react";
import { Route, Routes, useNavigate, useParams } from "react-router-dom";

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

interface BrowsePageProps {
  /** Selected in the Tables panel when the page opens, e.g. from a link. */
  defaultServerId?: string;
}

/**
 * The Browse page: an unsaved workspace with the Tables panel pinned. The
 * panel lists the servers and the selected server's tables; open tables
 * keep their own server, so tables from several servers can be combined.
 * "Save as workspace" keeps the layout as a named workspace.
 */
const BrowsePage = ({ defaultServerId }: BrowsePageProps) => {
  const canSave = useOptionalWorkspace() !== undefined;
  const { componentRenderers, settingsCodecs } = useBrowseRegistries();
  const { controller, edited, reset, snapshot } = useTransientWorkspace({
    componentRenderers,
    name: "Tables",
    settingsCodecs,
  });
  const [serverId, setServerId] = useState(defaultServerId);
  const openTables = useMemo(() => getOpenTables(snapshot), [snapshot]);
  const paletteProps = useMemo<PanelsPaletteProps>(
    () => ({
      defaultServerId,
      onServerChange: setServerId,
      tabs: ["tables"],
    }),
    [defaultServerId],
  );

  const emptyContent: ReactNode = (
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
          <h1 className="vuuPortalWorkspaceHeader-title">Tables</h1>
          <span className="vuuPortalWorkspaceHeader-status">
            {edited ? "Unsaved layout" : null}
          </span>
          <span className="vuuPortalWorkspaceHeader-spacer" />
          <div className="vuuPortalWorkspaceHeader-actions">
            {canSave ? (
              <SaveAsWorkspace
                defaultName={getDefaultWorkspaceName(
                  serverId ?? "Vuu",
                  openTables,
                )}
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
            paletteProps={paletteProps}
          />
        </div>
      </div>
    </PanelsPaletteStateProvider>
  );
};

/** An older link to a server's Browse page selects that server. */
const ServerLinkRoute = () => {
  const { serverId } = useParams();
  return <BrowsePage defaultServerId={serverId} />;
};

/**
 * Browses the tables of the portal's Vuu servers, chosen in the Tables
 * panel. `<serverId>` (an older link) opens the page with that server.
 */
const VuuTableBrowser = () => (
  <PortalStateScope>
    <Routes>
      <Route element={<BrowsePage />} index />
      <Route element={<ServerLinkRoute />} path=":serverId/*" />
    </Routes>
  </PortalStateScope>
);

export default VuuTableBrowser;
