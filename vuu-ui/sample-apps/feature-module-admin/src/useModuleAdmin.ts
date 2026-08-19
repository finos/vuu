import type { TableConfig } from "@vuu-ui/vuu-table-types";
import { useEditableTable, type EditMode } from "@vuu-ui/vuu-data-editing";
import { type SyntheticEvent, useCallback, useMemo, useState } from "react";
import { editableColumns, moduleColumnDescriptors } from "./columnDescriptors";
import { toColumnName } from "@vuu-ui/vuu-utils";
import { useData } from "@vuu-ui/vuu-utils2";

export const useModuleAdmin = () => {
  const { VuuDataSource } = useData();

  const [editMode, setEditMode] = useState<EditMode>("view");

  const onToggleEditMode = useCallback(
    async (e: SyntheticEvent<HTMLButtonElement>) => {
      const toggleButton = e.target as HTMLButtonElement;
      const editMode = toggleButton.value as EditMode;
      setEditMode(editMode);
    },
    [],
  );

  const dataSource = useMemo(() => {
    return new VuuDataSource({
      bufferSize: 200,
      columns: moduleColumnDescriptors.map(toColumnName),
      table: { module: "MODULE_DISCOVERY", table: "modules" },
    });
  }, [VuuDataSource]);

  const exitEditMode = useCallback(() => {
    setEditMode("view");
  }, []);

  const {
    canCancel,
    canSave,
    dataSource: ds,
    editSession,
    lifecycle,
    onCancel,
    onSave,
    rowClassNameGenerators,
  } = useEditableTable({
    dataSource,
    isEditMode: editMode === "edit",
    onCancel: exitEditMode,
    onSave: exitEditMode,
  });

  const config = useMemo<TableConfig>(
    () => ({
      columnLayout: "static",
      columns:
        editMode === "edit"
          ? moduleColumnDescriptors.map((col) =>
              editableColumns.includes(col.name)
                ? { ...col, editable: true }
                : col,
            )
          : moduleColumnDescriptors,
      rowClassNameGenerators,
      rowSeparators: true,
      zebraStripes: true,
    }),
    [editMode, rowClassNameGenerators],
  );

  return {
    canCancel,
    canSave,
    config,
    dataSource: ds,
    editMode,
    editSession,
    lifecycle,
    onCancel,
    onSave,
    onToggleEditMode,
    status: "ready",
  };
};
