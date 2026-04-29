import { VuuTable } from "@vuu-ui/vuu-protocol-types";
import { useCallback, useMemo, useState } from "react";
import { EditTracker } from "./EditTracker";
import { useData } from "../context-definitions/DataProvider";
import { DataSource } from "@vuu-ui/vuu-data-types";
import { isRpcSuccess } from "../protocol-message-utils";

export type EditMode = "edit" | "view";

export interface EditableTableHookProps {
  /**
   * columns to be included in subscription. If not provided,
   * default will be '*'
   */
  columns?: string[];
  isEditMode: boolean;
  onCancel: () => void;
  onSave: () => void;
  table: VuuTable;
}

export const useEditableTable = ({
  columns,
  isEditMode,
  onCancel,
  onSave,
  table,
}: EditableTableHookProps) => {
  const { VuuDataSource } = useData();
  const [sessionDataSource, setSessionDataSource] = useState<
    DataSource | undefined
  >(undefined);

  const dataSource = useMemo(() => {
    return new VuuDataSource({ columns, table });
  }, [VuuDataSource, columns, table]);

  const editTracker = useMemo(() => new EditTracker(), []);

  useMemo(() => {
    if (dataSource) {
      editTracker.dataSource = dataSource;
    }
  }, [dataSource, editTracker]);

  const handleCancel = useCallback(() => {
    // editTracker.dataSource = dataSource;
    editTracker.cancelChanges();
    onCancel();
    setSessionDataSource(undefined);
    dataSource.resume?.();
  }, [dataSource, editTracker, onCancel]);

  const handleSave = useCallback(async () => {
    // editTracker.dataSource = dataSource;
    const response = await editTracker.saveChanges();
    if (isRpcSuccess(response)) {
      onSave();
      setSessionDataSource(undefined);
      dataSource.resume?.();
    }
  }, [dataSource, editTracker, onSave]);

  useMemo(async () => {
    if (isEditMode) {
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
  }, [VuuDataSource, dataSource, editTracker, isEditMode]);

  return {
    dataSource: sessionDataSource ?? dataSource,
    editTracker,
    onCancel: handleCancel,
    onSave: handleSave,
  };
};
