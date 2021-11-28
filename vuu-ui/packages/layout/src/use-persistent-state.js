import { useCallback } from 'react';

const persistentState = new Map();
const sessionState = new Map();

console.log(`initialise mpersistent state`);
// These is not exported by package, only available within
// layout
export const getPersistentState = (id) => persistentState.get(id);
export const hasPersistentState = (id) => persistentState.has(id);
export const setPersistentState = (id, value) => persistentState.set(id, value);

const usePersistentState = () => {
  const loadSessionState = useCallback((id, key) => {
    const state = sessionState.get(id);
    if (state) {
      if (key !== undefined && state[key] !== undefined) {
        return state[key];
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
        [key]: data
      });
    } else {
      sessionState.set(id, { [key]: data });
    }
  }, []);

  const loadState = useCallback((id, key) => {
    // console.log(`loadState #${id} @${key}`)
    const state = persistentState.get(id);
    if (state) {
      if (key !== undefined) {
        return state[key];
      } else {
        return state;
      }
    }
  }, []);

  const saveState = useCallback((id, key, data) => {
    if (key === undefined) {
      persistentState.set(id, data);
    } else if (persistentState.has(id)) {
      const state = persistentState.get(id);
      persistentState.set(id, {
        ...state,
        [key]: data
      });
    } else {
      persistentState.set(id, { [key]: data });
    }
  }, []);

  const purgeState = useCallback((id, key) => {
    if (persistentState.has(id)) {
      if (key === undefined) {
        persistentState.delete(id);
      } else {
        const state = persistentState.get(id);
        if (state[key]) {
          const { [key]: _doomedState, ...rest } = persistentState.get(id);
          if (Object.keys(rest).lenth > 0) {
            persistentState.set(id, rest);
          }
        }
      }
    }
  }, []);

  return { loadSessionState, loadState, saveSessionState, saveState, purgeState };
};

export default usePersistentState;
