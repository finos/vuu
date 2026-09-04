import { useCallback, useSyncExternalStore } from "react";
import type { GridController } from "./GridController";
import type { GridSnapshot } from "./GridSnapshot";

const visibleSnapshots = new WeakMap<
  GridController,
  { signature: string; snapshot: GridSnapshot }
>();

const getVisibleSnapshot = (controller: GridController) => {
  const snapshot = controller.getSnapshot();
  const { revision: _revision, ...visibleState } = snapshot;
  const signature = JSON.stringify(visibleState);
  const cached = visibleSnapshots.get(controller);
  if (cached?.signature === signature) {
    return cached.snapshot;
  }
  visibleSnapshots.set(controller, { signature, snapshot });
  return snapshot;
};

/**
 * Subscribe React to the canonical snapshot owned by a GridController.
 * Revision-only transaction commits preserve the visible snapshot identity.
 */
export const useGridControllerSnapshot = (
  controller: GridController,
): GridSnapshot => {
  const getSnapshot = useCallback(
    () => getVisibleSnapshot(controller),
    [controller],
  );
  return useSyncExternalStore(controller.subscribe, getSnapshot, getSnapshot);
};
