import type { NavigateFunction } from "react-router-dom";
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
 * is open, `navigate` moves away from it, undo returns to it.
 */
export const deleteWorkspace = (
  id: string,
  navigate?: NavigateFunction,
  navigateTo = "/",
) => {
  const workspace = workspaceStore.get(id);
  if (workspace) {
    const undo = workspaceStore.delete(id);
    navigate?.(navigateTo);
    toastStore.show({
      action: {
        label: "Undo",
        onClick: () => {
          undo();
          navigate?.(workspaceRoute(id));
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
    navigate(workspaceRoute(copy.id));
  }
};

export const createEmptyWorkspace = (navigate: NavigateFunction) => {
  const workspace = workspaceStore.create();
  navigate(workspaceRoute(workspace.id));
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
