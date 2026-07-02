import { DataSource, DeleteRowMode, EditSessionMode } from "@vuu-ui/vuu-data-types";
import type { SelectRowRequest, VuuTable } from "@vuu-ui/vuu-protocol-types";
import { useCallback, useMemo, useRef, useState } from "react";
import type { SelectionChangeHandler } from "@vuu-ui/vuu-table-types";
import { useData } from "../context-definitions/DataProvider";
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
  deleteMode?: DeleteRowMode;
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
  deleteMode = "soft",
  editSessionMode = "inline-all-rows",
  isEditMode,
  onCancel,
  onSave,
  table,
}: EditableTableHookProps) => {
  const { VuuDataSource } = useData();
  const [sessionDataSource, setSessionDataSource] = useState<
    DataSource | undefined
  >(undefined);
  const selectedKeysRef = useRef<string[]>([]);
  useLayoutEffectSkipFirst(() => {
    console.warn(`[useEditableTable] columns and or table changed`);
  }, [columns, table]);

  const dataSource = useMemo(() => {
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

  // The editSession will be made available to all the edit controls in scope
  // by wrapping the edit component with a DataEditingProvider.
  const editSession = useMemo(
    () => new EditSession(dataSource, deleteMode),
    // deleteMode is intentionally excluded — changing it mid-session is not supported
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dataSource],
  );

  const handleCancel = useCallback(() => {
    try {
      editSession.end();
      onCancel();
    } catch (e) {
      //
    }
  }, [editSession, onCancel]);

  const handleSave = useCallback(
    async (force = false) => {
      dataSource.resume?.();
      try {
        await editSession.end(true, force);
        if (editSession.inEditMode === false) {
          onSave();
        }
      } catch (e) {
        console.log(`[useEditableTable] handleSave ${(e as Error).message}`);
      }
    },
    [dataSource, editSession, onSave],
  );

  const handleDelete = useCallback(() => {
    if (selectedKeysRef.current.length > 0) {
      editSession.deleteRows(selectedKeysRef.current);
      selectedKeysRef.current = [];
    }
  }, [editSession]);

  const handleSelectionChange = useCallback<SelectionChangeHandler>(
    (change) => {
      if (change.type === "SELECT_ROW") {
        const { rowKey, preserveExistingSelection } =
          change as Omit<SelectRowRequest, "vpId">;
        selectedKeysRef.current = preserveExistingSelection
          ? [...selectedKeysRef.current, rowKey]
          : [rowKey];
      } else if (change.type === "DESELECT_ROW") {
        const { rowKey, preserveExistingSelection } =
          change as Omit<SelectRowRequest, "vpId">;
        selectedKeysRef.current = preserveExistingSelection
          ? selectedKeysRef.current.filter((k) => k !== rowKey)
          : [];
      } else if (
        change.type === "DESELECT_ALL" ||
        change.type === "SELECT_ROW_RANGE"
      ) {
        selectedKeysRef.current = [];
      }
    },
    [],
  );

  useMemo(async () => {
    if (isEditMode) {
      try {
        const sessionDataSource = await editSession.begin(editSessionMode);
        if (sessionDataSource) {
          setSessionDataSource(sessionDataSource);
        }
      } catch (e) {
        console.error(`[useEditableTable] begin edit session failed`, e);
        onCancel();
      }
    } else if (editSession.inEditMode) {
      await editSession.end();
    }
  }, [editSession, editSessionMode, isEditMode, onCancel]);

  return {
    dataSource,
    editSession,
    onCancel: handleCancel,
    onDelete: handleDelete,
    onSelectionChange: handleSelectionChange,
    onSave: handleSave,
    sessionDataSource,
  };
};
