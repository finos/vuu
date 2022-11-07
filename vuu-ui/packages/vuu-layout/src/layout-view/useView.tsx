import { RefObject, useCallback, useMemo } from "react";
import { useLayoutProviderDispatch } from "../layout-provider";
import { usePersistentState } from "../use-persistent-state";
import { useViewActionDispatcher } from "./useViewActionDispatcher";

export interface ViewHookProps {
  id: string;
  rootRef: RefObject<HTMLDivElement>;
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

  const {
    loadState,
    loadSessionState,
    purgeState,
    saveState,
    saveSessionState,
  } = usePersistentState();

  const [dispatchViewAction, contributions] = useViewActionDispatcher(
    id,
    rootRef,
    path,
    dropTargets
  );

  const title = useMemo(
    () => loadState("view-title") ?? titleProp,
    [loadState, titleProp]
  );

  const restoredState = useMemo(() => loadState(id), [id, loadState]);

  const load = useCallback(
    (key?: string) => loadState(id, key),
    [id, loadState]
  );

  const purge = useCallback(
    (key) => {
      purgeState(id, key);
      layoutDispatch({ type: "save" });
    },
    [id, purgeState]
  );

  const save = useCallback(
    (state, key) => {
      saveState(id, key, state);
      layoutDispatch({ type: "save" });
    },
    [id, layoutDispatch, saveState]
  );
  const loadSession = useCallback(
    (key?: string) => loadSessionState(id, key),
    [id, loadSessionState]
  );
  const saveSession = useCallback(
    (state, key) => saveSessionState(id, key, state),
    [id, saveSessionState]
  );

  const onConfigChange = useCallback(
    ({ type: key, ...config }) => {
      const { [key]: data } = config;
      save(data, key);
    },
    [save]
  );

  return {
    contributions,
    dispatchViewAction,
    load,
    loadSession,
    onConfigChange,
    purge,
    restoredState,
    save,
    saveSession,
    title,
  };
};
