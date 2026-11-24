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
  withFixedMetric,
} from "./trader-limits-config";

const createColumnModel = (mode: EditableTableMode, fixedMetric?: string) => {
  const columns = withFixedMetric(limitColumnsByMode[mode], fixedMetric);
  return new ColumnModel(columns, initiallySelected(columns));
};

/**
 * A column model for each mode, so the column picker offers only the columns
 * of the table shown, and the table config of the current mode. With a
 * `fixedMetric`, the Metric column cannot be entered.
 */
export const useLimitsColumns = (
  mode: EditableTableMode,
  fixedMetric?: string,
) => {
  const columnModels = useMemo((): Record<EditableTableMode, ColumnModel> => {
    // Create and Edit mode show the same edit session
    const edit = createColumnModel("edit", fixedMetric);
    return { create: edit, edit, view: createColumnModel("view", fixedMetric) };
  }, [fixedMetric]);
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
