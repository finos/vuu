import { useCallback } from "react";

const persistentState = new Map<string, any>();
const sessionState = new Map<string, any>();

// These is not exported by package, only available within
// layout. Used by LayoutProvider for layout serialization.
export const getPersistentState = (id: string) => persistentState.get(id);
export const hasPersistentState = (id: string) => persistentState.has(id);
export const setPersistentState = (id: string, value: any) =>
  persistentState.set(id, value);

export const usePersistentState = () => {
  //TODO create single set of methods that operate on either session or state

  const loadSessionState = useCallback((id, key) => {
    const state = sessionState.get(id);
    if (state) {
      if (key !== undefined && state[key] !== undefined) {
        return state[key];
      } else if (key !== undefined) {
        return undefined;
      } else {
        return state;
      }
    }
  }, []);

  const saveSessionState = useCallback((id, key, data) => {
    if (key === undefined) {
      sessionState.set(id, data);
    } else if (sessionState.has(id)) {
      const state = sessionState.get(id);
      sessionState.set(id, {
        ...state,
        [key]: data,
      });
    } else {
      sessionState.set(id, { [key]: data });
    }
  }, []);

  const purgeSessionState = useCallback((id, key) => {
    if (sessionState.has(id)) {
      if (key === undefined) {
        sessionState.delete(id);
      } else {
        const state = sessionState.get(id);
        if (state[key]) {
          const { [key]: _doomedState, ...rest } = sessionState.get(id);
          if (Object.keys(rest).length > 0) {
            sessionState.set(id, rest);
          } else {
            sessionState.delete(id);
          }
        }
      }
    }
  }, []);

  const loadState = useCallback((id: string, key?: string) => {
    const state = persistentState.get(id);
    if (state) {
      if (key !== undefined) {
        return state[key];
      } else {
        return state;
      }
    }
  }, []);

  const saveState = useCallback(
    (id: string, key: string | undefined, data: any) => {
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
    []
  );

  const purgeState = useCallback((id, key) => {
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
    loadSessionState,
    loadState,
    saveSessionState,
    saveState,
    purgeState,
    purgeSessionState,
  };
};
