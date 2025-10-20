/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback } from "react";

/**
 * Persistent state is stored at module level (i.e singleton-style)
 * It is kept at this level, rather than passed to the target component(s)
 * so that it endures across the unmount/mount lifecycle journey of any
 * individual component. e.g when switching between tabs, components are
 * unmounted and mounted. They re-request their persistent state on re-mount.
 * Persistent state is populated as the serialized layout schema is processed
 * (see layoutFromJSON).
 */
const persistentState = new Map<string, any>();

export const getPersistentState = (id: string) => persistentState.get(id);
export const hasPersistentState = (id: string) => persistentState.has(id);
export const setPersistentState = (id: string, value: any) =>
  persistentState.set(id, value);

export const usePersistentState = () => {
  const loadState = useCallback((id: string, key?: string) => {
    const state = persistentState.get(id);
    if (state) {
      if (key !== undefined) {
        return state[key];
      }
      return state;
    }
  }, []);

  const saveState = useCallback(
    (id: string, key: string | undefined, data: unknown) => {
      if (key === undefined) {
        persistentState.set(id, data);
      } else if (persistentState.has(id)) {
        const state = persistentState.get(id);
        persistentState.set(id, {
          ...state,
          [key]: data,
        });
      } else {
        persistentState.set(id, { [key]: data });
      }
    },
    [],
  );

  const purgeState = useCallback((id: string, key?: string) => {
    if (persistentState.has(id)) {
      if (key === undefined) {
        persistentState.delete(id);
      } else {
        const state = persistentState.get(id);
        if (state[key]) {
          const { [key]: _doomedState, ...rest } = persistentState.get(id);
          if (Object.keys(rest).length > 0) {
            persistentState.set(id, rest);
          } else {
            persistentState.delete(id);
          }
        }
      }
    }
  }, []);

  return {
    loadState,
    saveState,
    purgeState,
  };
};
