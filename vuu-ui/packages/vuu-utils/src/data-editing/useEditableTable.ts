import { VuuTable } from "@vuu-ui/vuu-protocol-types";
import { SyntheticEvent, useCallback, useMemo, useState } from "react";
import { EditTracker } from "./EditTracker";
import { useData } from "../context-definitions/DataProvider";
import { DataSource } from "@vuu-ui/vuu-data-types";
import { isRpcSuccess } from "../protocol-message-utils";

export type EditMode = "edit" | "view";

export const useEditableTable = ({ table }: { table: VuuTable }) => {
  const { VuuDataSource } = useData();
  const [editMode, setEditMode] = useState<EditMode>("view");
  const [sessionDataSource, setSessionDataSource] = useState<
    DataSource | undefined
  >(undefined);

  const dataSource = useMemo(() => {
    return new VuuDataSource({ table });
  }, [table, VuuDataSource]);

  const editTracker = useMemo(() => new EditTracker(), []);

  useMemo(() => {
    if (dataSource) {
      editTracker.dataSource = dataSource;
    }
  }, [dataSource, editTracker]);

  const onCancel = useCallback(() => {
    editTracker.dataSource = dataSource;
    editTracker.cancelChanges();
    setEditMode("view");
    setSessionDataSource(undefined);
    dataSource.resume?.();
  }, [dataSource, editTracker]);

  const onSave = useCallback(async () => {
    editTracker.dataSource = dataSource;
    const response = await editTracker.saveChanges();
    if (isRpcSuccess(response)) {
      setEditMode("view");
      setSessionDataSource(undefined);
      dataSource.resume?.();
    }
  }, [dataSource, editTracker]);

  const onToggleEditMode = useCallback(
    async (e: SyntheticEvent<HTMLButtonElement>) => {
      const toggleButton = e.target as HTMLButtonElement;
      const editMode = toggleButton.value as EditMode;
      setEditMode(editMode);
      if (editMode === "edit") {
        const sessionTable = await editTracker.enterEditMode();
        if (sessionTable && dataSource.tableSchema) {
          dataSource.suspend?.(false);
          const sessionDataSource = new VuuDataSource({
            columns: dataSource.columns,
            table: sessionTable,
            viewport: sessionTable.table,
          });
          setSessionDataSource(sessionDataSource);
          editTracker.dataSource = sessionDataSource;
        }
      }
    },
    [VuuDataSource, dataSource, editTracker],
  );

  return {
    dataSource: sessionDataSource ?? dataSource,
    editMode,
    editTracker,
    onCancel,
    onSave,
    onToggleEditMode,
  };
};
