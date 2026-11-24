import {
  ColumnModel,
  type ColumnsChangeHandler,
  type EditableTableMode,
} from "@vuu-ui/vuu-table-extras";
import { useCallback, useMemo, useSyncExternalStore } from "react";
import {
  getLimitsTableConfig,
  initiallySelected,
  limitColumnsByMode,
  withFixedValues,
} from "./trader-limits-config";

const createColumnModel = (
  mode: EditableTableMode,
  fixedValues?: Record<string, string>,
) => {
  const columns = withFixedValues(limitColumnsByMode[mode], fixedValues);
  return new ColumnModel(columns, initiallySelected(columns));
};

/**
 * A column model for each mode, so the column picker offers only the columns
 * of the table shown, and the table config of the current mode. With a
 * `fixedValues`, the columns they name cannot be entered.
 */
export const useLimitsColumns = (
  mode: EditableTableMode,
  fixedValues?: Record<string, string>,
) => {
  const columnModels = useMemo((): Record<EditableTableMode, ColumnModel> => {
    // Create and Edit mode show the same edit session
    const edit = createColumnModel("edit", fixedValues);
    return { create: edit, edit, view: createColumnModel("view", fixedValues) };
  }, [fixedValues]);
  const columnModel = columnModels[mode];

  const subscribe = useCallback(
    (onChange: () => void) => {
      const handleChange: ColumnsChangeHandler = () => onChange();
      columnModel.on("change", handleChange);
      return () => {
        columnModel.removeListener("change", handleChange);
      };
    },
    [columnModel],
  );
  const selectedColumns = useSyncExternalStore(
    subscribe,
    () => columnModel.selectedColumns,
  );

  const tableConfig = useMemo(
    () => getLimitsTableConfig(columnModel.allColumns, selectedColumns),
    [columnModel, selectedColumns],
  );

  return { columnModel, tableConfig };
};
