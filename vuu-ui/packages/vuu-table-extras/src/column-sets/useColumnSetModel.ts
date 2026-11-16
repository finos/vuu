import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import type { ColumnModel } from "../column-picker/ColumnModel";
import {
  ColumnSetModel,
  type ColumnSetsChangeHandler,
  type ColumnSetsState,
} from "./ColumnSetModel";

export interface ColumnSetModelHookProps {
  columnModel: ColumnModel;
  /**
   * The column sets when the model is created, e.g. as persisted by the host.
   * Changes after creation are ignored, the model owns the state from then on.
   */
  defaultColumnSets?: ColumnSetsState;
  /**
   * Called with the new state whenever column sets change, including when
   * columns are added, removed or reordered in the active set. The host
   * persists this state.
   */
  onChange?: ColumnSetsChangeHandler;
}

/**
 * Creates a ColumnSetModel for the ColumnModel of a grid.
 */
export const useColumnSetModel = ({
  columnModel,
  defaultColumnSets,
  onChange,
}: ColumnSetModelHookProps) => {
  const defaultColumnSetsRef = useRef(defaultColumnSets);
  const model = useMemo(
    () => new ColumnSetModel(columnModel, defaultColumnSetsRef.current),
    [columnModel],
  );

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    model.connect();
    const handleChange: ColumnSetsChangeHandler = (state, reason) =>
      onChangeRef.current?.(state, reason);
    model.on("change", handleChange);
    return () => {
      model.removeListener("change", handleChange);
      model.dispose();
    };
  }, [model]);

  return model;
};

/**
 * The state of a ColumnSetModel, re-rendering when it changes.
 */
export const useColumnSetsState = (model: ColumnSetModel) =>
  useSyncExternalStore(
    (onStoreChange) => {
      model.on("change", onStoreChange);
      return () => model.removeListener("change", onStoreChange);
    },
    () => model.state,
  );
