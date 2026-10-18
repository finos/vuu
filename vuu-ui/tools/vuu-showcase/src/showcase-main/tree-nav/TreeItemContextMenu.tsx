import { Menu, MenuItem, MenuTrigger } from "@salt-ds/core";
import type { TreeSourceNode } from "@vuu-ui/vuu-utils";
import { useNavigate } from "react-router-dom";
import { findTreeNode } from "../../shared-utils";
import { ChromeIcon } from "../chrome/ChromeIcon";
import { ChromeMenuPanel } from "../chrome/ChromeMenu";
import {
  ContextMenu,
  type ContextMenuPosition,
  MenuSeparator,
  MenuShortcut,
} from "../chrome/ContextMenu";
import { openInNewTab } from "../doc-tabs/doc-tabs-actions";
import { getSourceLinks } from "../example/example-model";
import { SHOWCASE_SOURCE_ROOT } from "../example/source-root";
import { toastStore } from "../toast";
import {
  addExampleToWorkspace,
  createWorkspaceFromExample,
} from "../workspace/workspace-actions";
import { useWorkspaces } from "../workspace/workspace-store";
import type { NavNodeData } from "./nav-tree";

export interface TreeItemMenuState {
  label: string;
  path: string;
  position: ContextMenuPosition;
}

export interface TreeItemContextMenuProps {
  menu?: TreeItemMenuState;
  onClose: () => void;
  onOpen: (path: string) => void;
  treeSource: TreeSourceNode<NavNodeData>[];
}

/** The context menu of an example in the nav tree */
export const TreeItemContextMenu = ({
  menu,
  onClose,
  onOpen,
  treeSource,
}: TreeItemContextMenuProps) => {
  const navigate = useNavigate();
  const workspaces = useWorkspaces();
  const nodeData = menu
    ? findTreeNode(menu.path, treeSource)?.nodeData
    : undefined;
  const sourceLinks = getSourceLinks(nodeData ?? {}, SHOWCASE_SOURCE_ROOT);
  const example = menu ? { path: menu.path, title: menu.label } : undefined;

  return (
    <ContextMenu
      heading={menu?.label}
      onClose={onClose}
      position={menu?.position}
    >
      {menu && example ? (
        <>
          <MenuItem onClick={() => onOpen(menu.path)}>
            <ChromeIcon name="arrow-right" size={14} />
            Open
            <MenuShortcut>↵</MenuShortcut>
          </MenuItem>
          <MenuItem onClick={() => openInNewTab(menu.path, navigate)}>
            <ChromeIcon name="tabs" size={14} />
            Open in new tab
            <MenuShortcut>⌘↵</MenuShortcut>
          </MenuItem>
          <Menu placement="right-start">
            <MenuTrigger>
              <MenuItem>
                <ChromeIcon name="layout" size={14} />
                Add to workspace
              </MenuItem>
            </MenuTrigger>
            <ChromeMenuPanel>
              {workspaces.map((workspace) => (
                <MenuItem
                  key={workspace.id}
                  onClick={() => {
                    addExampleToWorkspace(workspace.id, example, navigate);
                    onClose();
                  }}
                >
                  <ChromeIcon name="layout" size={14} />
                  {workspace.name}
                </MenuItem>
              ))}
              {workspaces.length > 0 ? <MenuSeparator /> : null}
              <MenuItem
                onClick={() => {
                  createWorkspaceFromExample(example, navigate);
                  onClose();
                }}
              >
                <ChromeIcon name="plus" size={14} />
                New workspace
              </MenuItem>
            </ChromeMenuPanel>
          </Menu>
          <MenuSeparator />
          <MenuItem
            onClick={() =>
              navigator.clipboard
                ?.writeText(`${location.origin}${menu.path}`)
                .then(() =>
                  toastStore.show({ duration: 2500, message: "Link copied" }),
                )
            }
          >
            <ChromeIcon name="link" size={14} />
            Copy link
          </MenuItem>
          {sourceLinks.vscode ? (
            <MenuItem
              onClick={() => {
                if (sourceLinks.vscode) location.href = sourceLinks.vscode;
              }}
            >
              <ChromeIcon name="code" size={14} />
              Open in VS Code
            </MenuItem>
          ) : sourceLinks.github ? (
            <MenuItem
              onClick={() =>
                window.open(sourceLinks.github, "_blank", "noopener,noreferrer")
              }
            >
              <ChromeIcon name="github" size={14} />
              View on GitHub
            </MenuItem>
          ) : null}
          <div className="ShowcaseMenu-footer">
            Tip: ⌘-click or middle-click a tree item to open it in a new tab
          </div>
        </>
      ) : null}
    </ContextMenu>
  );
};
