import type { NavigateFunction } from "react-router-dom";
import { docTabHref } from "../doc-tabs/doc-tabs-model";
import { docTabsStore } from "../doc-tabs/doc-tabs-store";
import { openInNewTab } from "../doc-tabs/doc-tabs-actions";
import { toastStore } from "../toast";
import {
  createPanel,
  exampleCountLabel,
  layoutForDrop,
  workspaceRoute,
} from "./workspace-model";
import type { GridLayoutDropPosition } from "@vuu-ui/vuu-utils";
import { workspaceStore } from "./workspace-store";

/** Absolute url of a workspace. Workspaces are saved locally, in this browser */
export const workspaceUrl = (id: string) =>
  `${location.origin}${workspaceRoute(id)}`;

export const copyWorkspaceLink = (id: string) =>
  navigator.clipboard
    ?.writeText(workspaceUrl(id))
    .then(() => toastStore.show({ duration: 2500, message: "Link copied" }));

/**
 * Deletes a workspace immediately, a toast offers to undo. If the workspace
 * is open, `navigate` moves away from it, to the tab that replaces its tab
 * if there is one, undo re-opens it in a tab.
 */
export const deleteWorkspace = (
  id: string,
  navigate?: NavigateFunction,
  navigateTo = "/",
) => {
  const workspace = workspaceStore.get(id);
  if (workspace) {
    const route = workspaceRoute(id);
    const undo = workspaceStore.delete(id);
    const nextTab = docTabsStore.closePath(route);
    navigate?.(nextTab ? docTabHref(nextTab) : navigateTo);
    toastStore.show({
      action: {
        label: "Undo",
        onClick: () => {
          undo();
          if (navigate) {
            openInNewTab(route, navigate);
          }
        },
      },
      message: (
        <>
          Deleted workspace <b>{workspace.name}</b>
          <span className="ShowcaseToast-muted">
            {" · "}
            {exampleCountLabel(workspace.panels.length)}
          </span>
        </>
      ),
    });
  }
};

export const duplicateWorkspace = (id: string, navigate: NavigateFunction) => {
  const copy = workspaceStore.duplicate(id);
  if (copy) {
    openInNewTab(workspaceRoute(copy.id), navigate);
  }
};

export const createEmptyWorkspace = (navigate: NavigateFunction) => {
  const workspace = workspaceStore.create();
  openInNewTab(workspaceRoute(workspace.id), navigate);
  return workspace;
};

export interface ExampleRef {
  path: string;
  title: string;
}

/**
 * Creates a workspace from the current example, with a second example
 * dropped onto it, then opens it.
 */
export const createWorkspaceFromDrop = (
  target: ExampleRef,
  dropped: ExampleRef,
  position: GridLayoutDropPosition,
  navigate: NavigateFunction,
) => {
  const targetPanel = createPanel(target.path, target.title);
  const droppedPanel = createPanel(dropped.path, dropped.title);
  const workspace = workspaceStore.create({
    layout: layoutForDrop(targetPanel, droppedPanel, position),
    panels: [targetPanel, droppedPanel],
  });
  navigate(workspaceRoute(workspace.id));
  toastStore.show({
    action: {
      label: "Undo",
      onClick: () => {
        workspaceStore.delete(workspace.id);
        navigate(target.path);
      },
    },
    message: (
      <>
        Workspace created from <b>{target.title}</b> + <b>{dropped.title}</b>
      </>
    ),
  });
  return workspace;
};

/** Adds an example to a workspace, the toast offers to open the workspace */
export const addExampleToWorkspace = (
  id: string,
  example: ExampleRef,
  navigate: NavigateFunction,
) => {
  const workspace = workspaceStore.get(id);
  if (workspace) {
    workspaceStore.addExample(id, example.path, example.title);
    toastStore.show({
      action: {
        label: "Open",
        onClick: () => openInNewTab(workspaceRoute(id), navigate),
      },
      message: (
        <>
          Added <b>{example.title}</b> to <b>{workspace.name}</b>
        </>
      ),
    });
  }
};

/** Creates a workspace containing a single example, opened in a new tab */
export const createWorkspaceFromExample = (
  example: ExampleRef,
  navigate: NavigateFunction,
) => {
  const workspace = workspaceStore.create({
    panels: [createPanel(example.path, example.title)],
  });
  openInNewTab(workspaceRoute(workspace.id), navigate);
  return workspace;
};
