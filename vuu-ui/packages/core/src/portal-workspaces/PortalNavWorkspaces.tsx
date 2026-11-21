import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogHeader,
  Text,
  Tooltip,
} from "@salt-ds/core";
import {
  AddIcon,
  ChevronDownIcon,
  DashboardIcon,
  GridIcon,
  OverflowMenuIcon,
} from "@salt-ds/icons";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import {
  type ContextMenuItemDescriptor,
  type MenuBuilder,
  useContextMenu,
} from "@vuu-ui/vuu-context-menu";
import { useNotifications } from "@vuu-ui/vuu-notifications";
import cx from "clsx";
import {
  type KeyboardEvent,
  type MouseEvent,
  useCallback,
  useId,
  useRef,
  useState,
} from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import type {
  PortalNavDisplayMode,
  PortalNavSectionStyle,
} from "../portal-nav/portal-nav-types";
import type {
  WorkspaceContextValue,
  WorkspaceSummary,
} from "../workspace/WorkspaceProvider";
import { WorkspaceNameInput } from "./WorkspaceNameInput";
import {
  getWorkspaceIdFromPath,
  getWorkspacePath,
  nextWorkspaceName,
  type WorkspaceRouteState,
} from "./workspace-routing";

import portalWorkspacesCss from "./PortalWorkspaces.css";

const classBase = "vuuPortalNav";

/** Id of the Workspaces section, e.g. in the collapsed sections saved state. */
export const WORKSPACES_SECTION_ID = "workspaces";

export const RENAME_WORKSPACE = "rename-workspace";
export const DELETE_WORKSPACE = "delete-workspace";

/** Marks popups (menus, dialogs) that belong to the nav, e.g. in its overlay. */
export const PORTAL_NAV_POPUP = "data-portal-nav-popup";

const workspaceMenuBuilder: MenuBuilder<string, WorkspaceSummary> = (
  location,
  workspace,
): ContextMenuItemDescriptor[] =>
  location === "portal-workspace" && workspace?.kind === "named"
    ? [
        { id: RENAME_WORKSPACE, label: "Rename" },
        { id: DELETE_WORKSPACE, label: "Delete…" },
      ]
    : [];

type NavDisplayMode = Exclude<PortalNavDisplayMode, "minimized">;

const describeWorkspace = ({ isPersonalCopy, kind, name }: WorkspaceSummary) =>
  kind === "system"
    ? isPersonalCopy
      ? `${name} · your copy, edited`
      : `${name} · default`
    : name;

const WorkspaceMeta = ({ workspace }: { workspace: WorkspaceSummary }) =>
  workspace.kind === "system" ? (
    <span className={`${classBase}-meta`}>
      {workspace.isPersonalCopy ? (
        <span
          className={`${classBase}-tag`}
          data-workspace-tag="personal-copy"
          title="Your copy · edited"
        >
          Your copy
        </span>
      ) : (
        <span className={`${classBase}-chip`} data-workspace-tag="default">
          default
        </span>
      )}
    </span>
  ) : null;

interface WorkspaceNavRowProps {
  active: boolean;
  displayMode: NavDisplayMode;
  editing: boolean;
  onCancelRename: () => void;
  onDelete: (workspace: WorkspaceSummary) => void;
  onRename: (workspace: WorkspaceSummary, name: string) => void;
  onStartRename: (workspace: WorkspaceSummary) => void;
  workspace: WorkspaceSummary;
}

const WorkspaceNavRow = ({
  active,
  displayMode,
  editing,
  onCancelRename,
  onDelete,
  onRename,
  onStartRename,
  workspace,
}: WorkspaceNavRowProps) => {
  const rail = displayMode === "icons";
  const named = workspace.kind === "named";
  const showContextMenu = useContextMenu(
    workspaceMenuBuilder as MenuBuilder,
    (action) => {
      if (action === RENAME_WORKSPACE) {
        onStartRename(workspace);
        return true;
      }
      if (action === DELETE_WORKSPACE) {
        onDelete(workspace);
        return true;
      }
      return undefined;
    },
  );

  const onContextMenu = (event: MouseEvent<HTMLElement>) => {
    if (named) {
      showContextMenu(event, "portal-workspace", workspace);
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (
      named &&
      (event.key === "ContextMenu" || (event.shiftKey && event.key === "F10"))
    ) {
      const { bottom, left } = event.currentTarget.getBoundingClientRect();
      event.preventDefault();
      showContextMenu(
        { clientX: left, clientY: bottom },
        "portal-workspace",
        workspace,
      );
    }
  };

  const onMenuButtonClick = (event: MouseEvent<HTMLButtonElement>) => {
    const { bottom, right } = event.currentTarget.getBoundingClientRect();
    showContextMenu(
      { clientX: right, clientY: bottom },
      "portal-workspace",
      workspace,
    );
  };

  const Icon = workspace.kind === "system" ? DashboardIcon : GridIcon;
  const icon =
    displayMode === "text" ? null : (
      <span className={`${classBase}-icon`}>
        <Icon aria-hidden className={`${classBase}-workspaceIcon`} />
      </span>
    );

  return (
    <li
      className={cx(`${classBase}-item`, `${classBase}-workspace`, {
        [`${classBase}-workspace-named`]: named,
      })}
      data-workspace-id={workspace.id}
      data-workspace-kind={workspace.kind}
    >
      {editing && !rail ? (
        <div className={cx(`${classBase}-link`, `${classBase}-link-editing`)}>
          {icon}
          <WorkspaceNameInput
            aria-label="Workspace name"
            className={`${classBase}-nameInput`}
            name={workspace.name}
            onCancel={onCancelRename}
            onCommit={(name) => onRename(workspace, name)}
          />
        </div>
      ) : (
        <>
          <Tooltip
            content={describeWorkspace(workspace)}
            disabled={!rail}
            enterDelay={300}
            placement="right"
          >
            <Link
              aria-current={active ? "page" : undefined}
              className={cx(`${classBase}-link`, {
                [`${classBase}-link-active`]: active,
              })}
              data-portal-nav-focusable=""
              onContextMenu={onContextMenu}
              onKeyDown={onKeyDown}
              to={getWorkspacePath(workspace.id)}
            >
              {icon}
              <span className={`${classBase}-label`}>{workspace.name}</span>
              {rail ? null : <WorkspaceMeta workspace={workspace} />}
            </Link>
          </Tooltip>
          {named && !rail ? (
            <button
              aria-haspopup="menu"
              aria-label={`${workspace.name} options`}
              className={`${classBase}-rowMenu`}
              onClick={onMenuButtonClick}
              type="button"
            >
              <OverflowMenuIcon aria-hidden />
            </button>
          ) : null}
        </>
      )}
    </li>
  );
};

export interface PortalNavWorkspacesProps {
  collapsed: boolean;
  displayMode: NavDisplayMode;
  onCollapsedChange: (sectionId: string, collapsed: boolean) => void;
  sectionStyle: PortalNavSectionStyle;
  workspace: WorkspaceContextValue;
}

/**
 * The Workspaces section of `PortalNav`: system and named workspaces from the
 * workspace context, and "+ New workspace". Rows are links to the workspace
 * route. They are not drop targets.
 */
export const PortalNavWorkspaces = ({
  collapsed: collapsedProp,
  displayMode,
  onCollapsedChange,
  sectionStyle,
  workspace: {
    createWorkspace,
    deleteNamedWorkspace,
    renameNamedWorkspace,
    workspaces,
  },
}: PortalNavWorkspacesProps) => {
  useComponentCssInjection({
    testId: "vuu-portal-workspaces",
    css: portalWorkspacesCss,
    window: useWindow(),
  });
  const headingId = useId();
  const listId = useId();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { showNotification } = useNotifications();
  const rail = displayMode === "icons";
  const showHeading = !rail && sectionStyle !== "none";
  const collapsible = showHeading && sectionStyle === "collapsible";
  const collapsed = collapsible && collapsedProp;
  const activeId = getWorkspaceIdFromPath(pathname);

  const [editingId, setEditingId] = useState<string>();
  const [deleting, setDeleting] = useState<WorkspaceSummary>();
  const creating = useRef(false);
  const cancelDeleteRef = useRef<HTMLButtonElement>(null);

  const reportError = useCallback(
    (header: string, cause: unknown) =>
      showNotification({
        content: cause instanceof Error ? cause.message : String(cause),
        header,
        status: "error",
        type: "toast",
      }),
    [showNotification],
  );

  const onNewWorkspace = async () => {
    if (creating.current) {
      return;
    }
    creating.current = true;
    try {
      const id = await createWorkspace(
        nextWorkspaceName(workspaces.map(({ name }) => name)),
      );
      navigate(getWorkspacePath(id), {
        state: { editName: true } satisfies WorkspaceRouteState,
      });
    } catch (cause) {
      reportError("Failed to Create Workspace", cause);
    } finally {
      creating.current = false;
    }
  };

  const onStartRename = (workspace: WorkspaceSummary) => {
    if (rail) {
      // No room to edit in the rail: edit the name in the workspace header.
      navigate(getWorkspacePath(workspace.id), {
        state: { editName: true } satisfies WorkspaceRouteState,
      });
    } else {
      setEditingId(workspace.id);
    }
  };

  const onRename = (workspace: WorkspaceSummary, name: string) => {
    setEditingId(undefined);
    renameNamedWorkspace(workspace.id, name).catch((cause: unknown) =>
      reportError("Failed to Rename Workspace", cause),
    );
  };

  const onConfirmDelete = async () => {
    const workspace = deleting;
    setDeleting(undefined);
    if (!workspace) {
      return;
    }
    if (activeId === workspace.id) {
      const next = workspaces.find(({ id }) => id !== workspace.id);
      navigate(next ? getWorkspacePath(next.id) : "/", { replace: true });
    }
    try {
      await deleteNamedWorkspace(workspace.id);
    } catch (cause) {
      reportError("Failed to Delete Workspace", cause);
    }
  };

  const title = "Workspaces";
  const count = (
    <span aria-hidden className={`${classBase}-sectionCount`}>
      {workspaces.length}
    </span>
  );
  const addButton = (
    <button
      aria-label="New workspace"
      className={`${classBase}-sectionAction`}
      onClick={onNewWorkspace}
      title="New workspace"
      type="button"
    >
      <AddIcon aria-hidden />
    </button>
  );

  return (
    <div
      className={cx(`${classBase}-section`, `${classBase}-workspaces`, {
        [`${classBase}-section-collapsed`]: collapsed,
      })}
      data-section-id={WORKSPACES_SECTION_ID}
    >
      {showHeading ? (
        <div className={`${classBase}-sectionHeading`} id={headingId}>
          {collapsible ? (
            <button
              aria-controls={listId}
              aria-expanded={!collapsed}
              className={`${classBase}-sectionToggle`}
              data-portal-nav-focusable=""
              onClick={() =>
                onCollapsedChange(WORKSPACES_SECTION_ID, !collapsed)
              }
              type="button"
            >
              <span className={`${classBase}-sectionTitle`}>{title}</span>
              <ChevronDownIcon
                aria-hidden
                className={`${classBase}-sectionChevron`}
              />
            </button>
          ) : (
            <span className={`${classBase}-sectionTitle`}>{title}</span>
          )}
          {count}
          {addButton}
        </div>
      ) : null}
      <ul
        aria-label={showHeading ? undefined : title}
        aria-labelledby={showHeading ? headingId : undefined}
        className={`${classBase}-items`}
        hidden={collapsed}
        id={listId}
      >
        {workspaces.map((workspace) => (
          <WorkspaceNavRow
            active={workspace.id === activeId}
            displayMode={displayMode}
            editing={workspace.id === editingId}
            key={workspace.id}
            onCancelRename={() => setEditingId(undefined)}
            onDelete={setDeleting}
            onRename={onRename}
            onStartRename={onStartRename}
            workspace={workspace}
          />
        ))}
        <li className={cx(`${classBase}-item`, `${classBase}-newWorkspace`)}>
          <Tooltip
            content="New workspace"
            disabled={!rail}
            enterDelay={300}
            placement="right"
          >
            <button
              className={`${classBase}-link`}
              data-portal-nav-focusable=""
              onClick={onNewWorkspace}
              type="button"
            >
              {displayMode === "text" ? null : (
                <span className={`${classBase}-icon`}>
                  <AddIcon aria-hidden />
                </span>
              )}
              <span className={`${classBase}-label`}>New workspace</span>
            </button>
          </Tooltip>
        </li>
      </ul>
      <Dialog
        {...{ [PORTAL_NAV_POPUP]: "" }}
        initialFocus={cancelDeleteRef}
        onOpenChange={(open) => {
          if (!open) setDeleting(undefined);
        }}
        open={deleting !== undefined}
        size="small"
        status="warning"
      >
        <DialogHeader header={`Delete “${deleting?.name ?? ""}”?`} />
        <DialogContent>
          <Text>
            The workspace and its layout are permanently removed. This can't be
            undone.
          </Text>
        </DialogContent>
        <DialogActions>
          <Button
            appearance="transparent"
            onClick={() => setDeleting(undefined)}
            ref={cancelDeleteRef}
          >
            Cancel
          </Button>
          <Button onClick={onConfirmDelete} sentiment="negative">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};
