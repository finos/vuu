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
   * default will be '*'. Ignored if dataSource prop present.
   */
  columns?: string[];
  dataSource?: DataSource;
  isEditMode: boolean;
  onCancel: () => void;
  onSave: () => void;
  /**
   * If dataSource not provided, new DataSource
   * will be created using table and columns
   */
  table: VuuTable;
}

export const useEditableTable = ({
  columns,
  dataSource: dataSourceProp,
  isEditMode,
  onCancel,
  onSave,
  table,
}: EditableTableHookProps) => {
  const { VuuDataSource } = useData();
  const [sessionDataSource, setSessionDataSource] = useState<
    DataSource | undefined
  >(undefined);

  const clearSessionDataSource = useCallback(() => {
    setSessionDataSource((dataSource) => {
      dataSource?.unsubscribe();
      return undefined;
    });
  }, []);

  const dataSource = useMemo(() => {
    return dataSourceProp ?? new VuuDataSource({ columns, table });
  }, [VuuDataSource, columns, dataSourceProp, table]);

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
    clearSessionDataSource();
    dataSource.resume?.();
  }, [clearSessionDataSource, dataSource, editTracker, onCancel]);

  const handleSave = useCallback(async () => {
    // editTracker.dataSource = dataSource;
    dataSource.resume?.();
    const response = await editTracker.saveChanges();
    if (isRpcSuccess(response)) {
      onSave();
      clearSessionDataSource();
    }
  }, [clearSessionDataSource, dataSource, editTracker, onSave]);

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
