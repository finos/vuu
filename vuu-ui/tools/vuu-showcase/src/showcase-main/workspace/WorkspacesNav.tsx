import { Button, Menu, MenuItem, MenuTrigger } from "@salt-ds/core";
import cx from "clsx";
import { type KeyboardEvent, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChromeIcon } from "../chrome/ChromeIcon";
import { ChromeMenuPanel } from "../chrome/ChromeMenu";
import {
  copyWorkspaceLink,
  createEmptyWorkspace,
  deleteWorkspace,
  duplicateWorkspace,
} from "./workspace-actions";
import {
  type Workspace,
  workspaceIdFromPath,
  workspaceRoute,
} from "./workspace-model";
import { useWorkspaces, workspaceStore } from "./workspace-store";

import "./WorkspacesNav.css";

const classBase = "ShowcaseWorkspacesNav";

const RenameInput = ({
  onDone,
  workspace,
}: {
  onDone: () => void;
  workspace: Workspace;
}) => {
  const [value, setValue] = useState(workspace.name);
  const commit = () => {
    workspaceStore.rename(workspace.id, value);
    onDone();
  };
  return (
    <input
      aria-label="Workspace name"
      autoFocus
      className={`${classBase}-renameInput`}
      onBlur={commit}
      onChange={(evt) => setValue(evt.target.value)}
      onFocus={(evt) => evt.target.select()}
      onKeyDown={(evt: KeyboardEvent) => {
        if (evt.key === "Enter") commit();
        else if (evt.key === "Escape") onDone();
      }}
      value={value}
    />
  );
};

const WorkspaceRow = ({
  expanded,
  onToggle,
  selected,
  workspace,
}: {
  expanded: boolean;
  onToggle: () => void;
  selected: boolean;
  workspace: Workspace;
}) => {
  const navigate = useNavigate();
  const [renaming, setRenaming] = useState(false);
  const { id, name, panels } = workspace;
  const open = () => navigate(workspaceRoute(id));
  return (
    <li className={`${classBase}-item`}>
      <div
        aria-current={selected ? "page" : undefined}
        className={cx(`${classBase}-row`, {
          [`${classBase}-row-selected`]: selected,
        })}
        onClick={open}
        onKeyDown={(evt) => {
          if (evt.target !== evt.currentTarget) return;
          if (evt.key === "Enter") open();
          else if (evt.key === "F2") setRenaming(true);
          else if (evt.key === "Delete" || evt.key === "Backspace")
            deleteWorkspace(id, selected ? navigate : undefined);
        }}
        role="link"
        tabIndex={0}
      >
        <button
          aria-expanded={panels.length > 0 ? expanded : undefined}
          aria-label={expanded ? `Collapse ${name}` : `Expand ${name}`}
          className={`${classBase}-toggle`}
          disabled={panels.length === 0}
          onClick={(evt) => {
            evt.stopPropagation();
            onToggle();
          }}
          tabIndex={-1}
          type="button"
        >
          <ChromeIcon
            name={expanded ? "chevron-down" : "chevron-right"}
            size={12}
          />
        </button>
        <ChromeIcon className={`${classBase}-icon`} name="layout" size={14} />
        {renaming ? (
          <RenameInput
            onDone={() => setRenaming(false)}
            workspace={workspace}
          />
        ) : (
          <span className={`${classBase}-name`} title={name}>
            {name}
          </span>
        )}
        <span className={`${classBase}-count`}>
          {panels.length === 0 ? "empty" : panels.length}
        </span>
        <span
          className={`${classBase}-menu`}
          onClick={(evt) => evt.stopPropagation()}
        >
          <Menu placement="bottom-start">
            <MenuTrigger>
              <Button
                appearance="transparent"
                aria-label={`${name} actions`}
                className={`${classBase}-menuButton`}
                tabIndex={-1}
              >
                <ChromeIcon name="more" size={14} />
              </Button>
            </MenuTrigger>
            <ChromeMenuPanel>
              <MenuItem onClick={open}>
                <ChromeIcon name="layout" size={14} />
                Open
              </MenuItem>
              <MenuItem onClick={() => setRenaming(true)}>
                <ChromeIcon name="pencil" size={14} />
                Rename
              </MenuItem>
              <MenuItem onClick={() => duplicateWorkspace(id, navigate)}>
                <ChromeIcon name="copy" size={14} />
                Duplicate
              </MenuItem>
              <MenuItem onClick={() => copyWorkspaceLink(id)}>
                <ChromeIcon name="link" size={14} />
                Copy link
              </MenuItem>
              <MenuItem
                className="ShowcaseMenu-danger"
                onClick={() =>
                  deleteWorkspace(id, selected ? navigate : undefined)
                }
              >
                <ChromeIcon name="trash" size={14} />
                Delete workspace
              </MenuItem>
            </ChromeMenuPanel>
          </Menu>
        </span>
      </div>
      {expanded && panels.length > 0 ? (
        <ul className={`${classBase}-panels`}>
          {panels.map((panel) => (
            <li
              className={`${classBase}-panel`}
              key={panel.id}
              onClick={open}
              title={panel.path.slice(1)}
            >
              <span className={`${classBase}-panelDot`} />
              {panel.title}
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  );
};

/**
 * The user's workspaces, below the Components tree. Workspaces are saved
 * locally, in this browser.
 */
export const WorkspacesNav = () => {
  const workspaces = useWorkspaces();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const selectedId = workspaceIdFromPath(pathname);
  const [expanded, setExpanded] = useState<Set<string>>(() =>
    selectedId ? new Set([selectedId]) : new Set(),
  );
  const [lastSelectedId, setLastSelectedId] = useState(selectedId);
  if (selectedId !== lastSelectedId) {
    // the open workspace is expanded
    setLastSelectedId(selectedId);
    if (selectedId && !expanded.has(selectedId)) {
      setExpanded(new Set(expanded).add(selectedId));
    }
  }
  const toggle = (id: string) => {
    const next = new Set(expanded);
    if (!next.delete(id)) next.add(id);
    setExpanded(next);
  };

  return (
    <section aria-label="Workspaces" className={classBase}>
      <header className={`${classBase}-header`}>
        <h2 className={`${classBase}-heading`}>Workspaces</h2>
        <span className={`${classBase}-total`}>{workspaces.length}</span>
        <Button
          appearance="bordered"
          aria-label="New empty workspace"
          className={`${classBase}-add`}
          onClick={() => createEmptyWorkspace(navigate)}
          title="New empty workspace"
        >
          <ChromeIcon name="plus" size={14} />
        </Button>
      </header>
      {workspaces.length === 0 ? (
        <div className={`${classBase}-empty`}>
          <b>No workspaces yet.</b> Drag examples onto the exhibit to combine
          them.
          <button
            className={`${classBase}-emptyAction`}
            onClick={() => createEmptyWorkspace(navigate)}
            type="button"
          >
            <ChromeIcon name="plus" size={13} />
            New empty workspace
          </button>
        </div>
      ) : (
        <ul className={`${classBase}-list`}>
          {workspaces.map((workspace) => (
            <WorkspaceRow
              expanded={expanded.has(workspace.id)}
              key={workspace.id}
              onToggle={() => toggle(workspace.id)}
              selected={workspace.id === selectedId}
              workspace={workspace}
            />
          ))}
        </ul>
      )}
    </section>
  );
};
