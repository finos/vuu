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
} from "./trader-limits-config";

const createColumnModel = (mode: EditableTableMode) => {
  const columns = limitColumnsByMode[mode];
  return new ColumnModel(columns, initiallySelected(columns));
};

/**
 * A column model for each mode, so the column picker offers only the columns
 * of the table shown, and the table config of the current mode.
 */
export const useLimitsColumns = (mode: EditableTableMode) => {
  const columnModels = useMemo((): Record<EditableTableMode, ColumnModel> => {
    // Create and Edit mode show the same edit session
    const edit = createColumnModel("edit");
    return { create: edit, edit, view: createColumnModel("view") };
  }, []);
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
