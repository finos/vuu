import { matchPath } from "react-router-dom";

/** The portal route of a workspace. */
export const WORKSPACE_ROUTE = "/workspaces/:workspaceId";

/** The portal path of the workspace with this id. */
export const getWorkspacePath = (workspaceId: string) =>
  `/workspaces/${encodeURIComponent(workspaceId)}`;

/** The id of the workspace at this path, if it is a workspace route. */
export const getWorkspaceIdFromPath = (pathname: string) => {
  const workspaceId = matchPath(WORKSPACE_ROUTE, pathname)?.params.workspaceId;
  if (workspaceId === undefined) {
    return undefined;
  }
  try {
    return decodeURIComponent(workspaceId);
  } catch {
    return workspaceId;
  }
};

/**
 * State passed with navigation to a workspace route. `editName` puts the
 * workspace name into edit mode, e.g. after "+ New workspace".
 */
export interface WorkspaceRouteState {
  editName?: boolean;
}

export const DEFAULT_WORKSPACE_NAME = "Untitled workspace";

/** "Untitled workspace", or "Untitled workspace 2" etc. if that is taken. */
export const nextWorkspaceName = (
  existingNames: Iterable<string>,
  baseName = DEFAULT_WORKSPACE_NAME,
) => {
  const names = new Set(existingNames);
  if (!names.has(baseName)) {
    return baseName;
  }
  let suffix = 2;
  while (names.has(`${baseName} ${suffix}`)) {
    suffix += 1;
  }
  return `${baseName} ${suffix}`;
};
