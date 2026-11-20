import { useCallback, useEffect, useMemo } from "react";
import type {
  SavedStateWorkspaceInfo,
  SavedStateWorkspaceRef,
} from "../saved-state/saved-state-model";
import {
  type SavedStateWorkspacesClearResult,
  useOptionalSavedState,
} from "../saved-state/SavedStateContext";
import { useWorkspace } from "../workspace/WorkspaceProvider";

/**
 * Lists the user's saved workspaces in the Saved state dialog, so they can
 * be cleared with the rest of the portal's saved state (§9.16): personal
 * copies of system workspaces, which clearing resets to their default, and
 * named workspaces, which clearing deletes. Renders nothing.
 */
export const SavedStateWorkspaces = () => {
  const registerWorkspaces = useOptionalSavedState()?.registerWorkspaces;
  const { controllers, deleteNamedWorkspace, resetToDefault, workspaces } =
    useWorkspace();

  const items = useMemo<SavedStateWorkspaceInfo[]>(() => {
    const open = new Set(controllers.map(({ definitionId }) => definitionId));
    return workspaces
      .filter(({ isPersonalCopy, kind }) => kind === "named" || isPersonalCopy)
      .map(({ id, kind, name, updatedAt }) => ({
        id,
        kind,
        name,
        open: open.has(id),
        ...(updatedAt === undefined ? {} : { updatedAt }),
      }));
  }, [controllers, workspaces]);

  const clear = useCallback(
    async (refs: readonly SavedStateWorkspaceRef[]) => {
      const result: {
        cleared: string[];
        failed: SavedStateWorkspacesClearResult["failed"][number][];
      } = { cleared: [], failed: [] };
      // One at a time: the workspace provider queues its operations anyway.
      for (const { id, kind } of refs) {
        try {
          if (kind === "system") {
            await resetToDefault(id);
          } else {
            await deleteNamedWorkspace(id);
          }
          result.cleared.push(id);
        } catch (error) {
          result.failed.push({
            id,
            error: error instanceof Error ? error : Error(String(error)),
          });
        }
      }
      return result;
    },
    [deleteNamedWorkspace, resetToDefault],
  );

  useEffect(() => {
    if (!registerWorkspaces) return;
    registerWorkspaces({ clear, items });
    return () => registerWorkspaces(undefined);
  }, [clear, items, registerWorkspaces]);

  return null;
};
