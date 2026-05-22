import { DataSource, EditSessionMode } from "@vuu-ui/vuu-data-types";
// import { useNotifications } from "@vuu-ui/vuu-notifications";
import { VuuTable } from "@vuu-ui/vuu-protocol-types";
import { useCallback, useMemo, useState } from "react";
import { useData } from "../context-definitions/DataProvider";
import { isRpcSuccess } from "../protocol-message-utils";
import { useLayoutEffectSkipFirst } from "../useLayoutEffectSkipFirst";
import { EditSession } from "./EditSession";

export type EditMode = "edit" | "view";

export interface EditableTableHookProps {
  /**
   * columns to be included in subscription. If not provided,
   * default will be '*'. Ignored if dataSource prop present.
   */
  columns?: string[];
  dataSource?: DataSource;
  editSessionMode?: EditSessionMode;
  isEditMode: boolean;
  onCancel: () => void;
  onSave: () => void;
  /**
   * If dataSource not provided, new DataSource
   * will be created using table and columns
   */
  table?: VuuTable;
}

export const useEditableTable = ({
  columns,
  dataSource: dataSourceProp,
  editSessionMode = "all-rows",
  isEditMode,
  onCancel,
  onSave,
  table,
}: EditableTableHookProps) => {
  const { VuuDataSource } = useData();
  const [sessionDataSource, setSessionDataSource] = useState<
    DataSource | undefined
  >(undefined);
  // const { showNotification } = useNotifications();
  const clearSessionDataSource = useCallback(() => {
    setSessionDataSource((dataSource) => {
      dataSource?.unsubscribe();
      return undefined;
    });
  }, []);

  useLayoutEffectSkipFirst(() => {
    console.warn(`[useEditableTable] columns and or table changed`);
  }, [columns, table]);

  const dataSource = useMemo(() => {
    // The dataSource would normally be managed by client and passed in, but for
    // simple use cases we can create it here.
    if (dataSourceProp) {
      return dataSourceProp;
    } else if (table) {
      return new VuuDataSource({ columns, table });
    } else {
      throw Error(
        `useEditableTable unable to provide DataSource, neither dataSource nor table available as props`,
      );
    }
  }, [VuuDataSource, columns, dataSourceProp, table]);

  // The editSession will be made available to all the edit controls in scope by
  // wrapping the edit component with a DataEditingProvider.
  const editSession = useMemo(() => new EditSession(dataSource), [dataSource]);

  const handleCancel = useCallback(() => {
    // editTracker.dataSource = dataSource;
    editSession.cancelChanges();
    onCancel();
    clearSessionDataSource();
    dataSource.resume?.();
    editSession.dataSource = dataSource;
  }, [clearSessionDataSource, dataSource, editSession, onCancel]);

  const handleSave = useCallback(async () => {
    dataSource.resume?.();
    const response = await editSession.saveChanges();
    if (isRpcSuccess(response)) {
      onSave();
      clearSessionDataSource();
      editSession.dataSource = dataSource;
    }
  }, [clearSessionDataSource, dataSource, editSession, onSave]);

  useMemo(async () => {
    if (isEditMode) {
      const sessionTable = await editSession.enterEditMode(editSessionMode);
      if (sessionTable && dataSource.tableSchema) {
        // dataSource.suspend?.(false);
        const sessionDataSource = new VuuDataSource({
          columns: dataSource.columns,
          table: sessionTable,
          viewport: sessionTable.table,
        });
        setSessionDataSource(sessionDataSource);
        editSession.dataSource = sessionDataSource;
      } else {
        // deal with error
        // showNotification?.({
        //   header: "Error unable to edit",
        //   status: "error",
        //   type: "toast",
        // });
        onCancel();
      }
    }
  }, [
    VuuDataSource,
    dataSource.columns,
    dataSource.tableSchema,
    editSession,
    editSessionMode,
    isEditMode,
    onCancel,
    // showNotification,
  ]);

  return {
    dataSource,
    editSession,
    onCancel: handleCancel,
    onSave: handleSave,
    sessionDataSource,
  };
};
