import { CopyOption, DataSource, DeleteRowMode, EditApi, EditSessionMode } from "@vuu-ui/vuu-data-types";
import type { VuuTable } from "@vuu-ui/vuu-protocol-types";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useData } from "../context-definitions/DataProvider";
import { useLayoutEffectSkipFirst } from "../useLayoutEffectSkipFirst";
import { EditSession, isCopyOption } from "./EditSession";

export type EditMode = "edit" | "view";

export interface EditableTableHookProps {
  /**
   * columns to be included in subscription. If not provided,
   * default will be '*'. Ignored if dataSource prop present.
   */
  columns?: string[];
  dataSource?: DataSource;
  addRowsCount?: number;
  deleteMode?: DeleteRowMode;
  editSessionMode?: EditSessionMode | CopyOption;
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
  addRowsCount = 15,
  columns,
  dataSource: dataSourceProp,
  deleteMode = "soft",
  editSessionMode = "inline-all-rows" as EditSessionMode | CopyOption,
  isEditMode,
  onCancel,
  onSave,
  table,
}: EditableTableHookProps) => {
  const { VuuDataSource } = useData();
  const [sessionDataSource, setSessionDataSource] = useState<
    DataSource | undefined
  >(undefined);
  const [selectionCount, setSelectionCount] = useState(0);
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
    () => new EditSession(dataSource as EditApi, deleteMode),
    // deleteMode is intentionally excluded — changing it mid-session is not supported
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dataSource],
  );

  const handleCancel = useCallback(async () => {
    try {
      await editSession.end();
      setSessionDataSource(undefined);
      setSelectionCount(0);
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
          setSessionDataSource(undefined);
          setSelectionCount(0);
          onSave();
        }
      } catch (e) {
        console.log(`[useEditableTable] handleSave ${(e as Error).message}`);
      }
    },
    [dataSource, editSession, onSave],
  );

  const handleDelete = useCallback(async () => {
    await editSession.deleteSelectedRows();
    setSelectionCount(0);
  }, [editSession]);

  const handleAddRows = useCallback(() => {
    editSession.addRows(addRowsCount);
  }, [addRowsCount, editSession]);

  const handleUndoRowChange = useCallback(
    (key: string) => void editSession.undoRowChange(key),
    [editSession],
  );

  useEffect(() => {
    const activeDataSource = sessionDataSource ?? dataSource;
    activeDataSource.on("row-selection", setSelectionCount);
    return () => activeDataSource.removeListener("row-selection", setSelectionCount);
  }, [dataSource, sessionDataSource]);

  useMemo(async () => {
    if (isEditMode) {
      try {
        const sessionDs = isCopyOption(editSessionMode)
          ? await editSession.begin(editSessionMode)
          : await editSession.begin(editSessionMode);
        if (sessionDs) {
          setSessionDataSource(sessionDs);
        }
      } catch (e) {
        console.error(`[useEditableTable] begin edit session failed`, e);
        onCancel();
      }
    } else if (editSession.inEditMode) {
      await editSession.end();
      setSessionDataSource(undefined);
      setSelectionCount(0);
    }
  }, [editSession, editSessionMode, isEditMode, onCancel]);

  return {
    dataSource,
    editSession,
    hasSelection: selectionCount > 0,
    onAddRows: handleAddRows,
    onCancel: handleCancel,
    onDelete: handleDelete,
    onSave: handleSave,
    onUndoRowChange: handleUndoRowChange,
    sessionDataSource,
  };
};
