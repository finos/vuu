import { createContext, useContext } from "react";
import type { WorkspacePreview } from "./workspace-model";

export interface WorkspacePageContextProps {
  /** id of the GridLayoutItem currently maximised, if any */
  maximisedItemId?: string;
  preview: WorkspacePreview;
  /** incremented to reload every panel */
  reloadCount: number;
  setMaximisedItemId: (itemId?: string) => void;
  showSource: (examplePath: string) => void;
  workspaceId: string;
}

/**
 * Workspace panels are rendered by GridLayout, which does not re-render them
 * when props change, so state they need is passed via context.
 */
export const WorkspacePageContext = createContext<
  WorkspacePageContextProps | undefined
>(undefined);

export const useWorkspacePageContext = () => {
  const context = useContext(WorkspacePageContext);
  if (context === undefined) {
    throw Error("WorkspacePanel must be rendered within a WorkspacePage");
  }
  return context;
};
