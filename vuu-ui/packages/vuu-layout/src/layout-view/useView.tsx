import { RefObject, useCallback, useMemo } from "react";
import { useLayoutProviderDispatch } from "../layout-provider/LayoutProvider";
import { usePersistentState } from "../use-persistent-state";
import { useViewActionDispatcher } from "../layout-view-actions/useViewActionDispatcher";
import { ConfigChangeHandler } from "../layout-view-actions";

export interface ViewHookProps {
  id: string;
  rootRef: RefObject<HTMLDivElement | null>;
  path?: string;
  dropTargets?: string[];
  title?: string;
}

export const useView = ({
  id,
  rootRef,
  path,
  dropTargets,
  title: titleProp,
}: ViewHookProps) => {
  const layoutDispatch = useLayoutProviderDispatch();

  const { loadState, purgeState, saveState } = usePersistentState();

  const [dispatchViewAction, contributions] = useViewActionDispatcher(
    id,
    rootRef,
    path,
    dropTargets,
  );

  const title = useMemo(
    () => loadState("view-title") ?? titleProp,
    [loadState, titleProp],
  );

  const onEditTitle = useCallback(
    (title: string) => {
      if (path) {
        layoutDispatch({ type: "set-title", path, title });
      }
    },
    [layoutDispatch, path],
  );

  const restoredState = useMemo(() => loadState(id), [id, loadState]);

  const load = useCallback(
    (key?: string) => loadState(id, key),
    [id, loadState],
  );

  const purge = useCallback(
    (key: string) => {
      purgeState(id, key);
      layoutDispatch({ type: "save" });
    },
    [id, layoutDispatch, purgeState],
  );

  const save = useCallback(
    (state: unknown, key: string) => {
      saveState(id, key, state);
      layoutDispatch({ type: "save" });
    },
    [id, layoutDispatch, saveState],
  );

  const onConfigChange = useCallback<ConfigChangeHandler>(
    ({ type: key, ...config }) => {
      const { [key]: data } = config;
      save(data, key);
    },
    [save],
  );

  return {
    contributions,
    dispatchViewAction,
    load,
    onConfigChange,
    onEditTitle,
    purge,
    restoredState,
    save,
    title,
  };
};
