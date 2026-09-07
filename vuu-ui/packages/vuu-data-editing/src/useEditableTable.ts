import type {
  CopyOption,
  DataSource,
  DeleteRowMode,
  EditApi,
} from "@vuu-ui/vuu-data-types";
import type { VuuTable } from "@vuu-ui/vuu-protocol-types";
import { useData, useLayoutEffectSkipFirst } from "@vuu-ui/vuu-utils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  EditSession,
  type EditLifecycle,
  type EditSessionApi,
  type EditState,
  type RowDefaultDataItemValues,
} from "./EditSession";
import { EDIT_ACTION_ROW_CLASS_NAME_GENERATOR } from "./editActionRowClassNameGenerator";

const EDIT_ACTION_ROW_CLASS_NAME_GENERATORS = [
  EDIT_ACTION_ROW_CLASS_NAME_GENERATOR,
];

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
  editSessionApi?: EditSessionApi;
  copyOption?: CopyOption;
  isEditMode: boolean;
  onCancel: () => void;
  onSave: () => void;
  /** Default column values applied to every addRow call. Pass a stable reference — a new object triggers EditSession recreation. */
  rowDefaults?: RowDefaultDataItemValues;
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
  editSessionApi = "createSessionDataSource",
  copyOption = "All",
  isEditMode,
  onCancel,
  onSave,
  rowDefaults,
  table,
}: EditableTableHookProps) => {
  const { VuuDataSource } = useData();
  const [selectionCount, setSelectionCount] = useState(0);
  useLayoutEffectSkipFirst(() => {
    console.warn("[useEditableTable] columns and or table changed");
  }, [columns, table]);

  const sourceDataSource = useMemo(() => {
    if (dataSourceProp) {
      return dataSourceProp;
    } else if (table) {
      return new VuuDataSource({ columns, table });
    } else {
      throw Error(
        "useEditableTable unable to provide DataSource, neither dataSource nor table available as props",
      );
    }
  }, [VuuDataSource, columns, dataSourceProp, table]);

  // The editSession will be made available to all the edit controls in scope
  // by wrapping the edit component with a DataEditingProvider.
  const editSession = useMemo(
    () =>
      new EditSession({
        dataSource: sourceDataSource as EditApi,
        deleteMode,
        editSessionApi,
        rowDefaults,
      }),
    [deleteMode, editSessionApi, rowDefaults, sourceDataSource],
  );
  const [lifecycle, setLifecycle] = useState<EditLifecycle>(
    editSession.lifecycle,
  );
  const [editState, setEditState] = useState<EditState>(editSession.editState);
  const [subscribedSessionDataSource, setSubscribedSessionDataSource] =
    useState<DataSource>();
  const onCancelRef = useRef(onCancel);
  onCancelRef.current = onCancel;

  const sessionDataSource =
    "sessionDataSource" in lifecycle ? lifecycle.sessionDataSource : undefined;
  const dataSource = sessionDataSource ?? sourceDataSource;

  const handleCancel = useCallback(async () => {
    try {
      await editSession.end();
      setSelectionCount(0);
      onCancel();
    } catch (error) {
      console.error("[useEditableTable] cancel edit session failed", error);
    }
  }, [editSession, onCancel]);

  const handleSave = useCallback(
    async (force = false) => {
      try {
        await editSession.end(true, force);
        setSelectionCount(0);
        onSave();
      } catch (error) {
        console.error("[useEditableTable] save edit session failed", error);
      }
    },
    [editSession, onSave],
  );

  const handleDelete = useCallback(async () => {
    await editSession.deleteSelectedRows();
  }, [editSession]);

  const handleUndoRowChange = useCallback(
    (key: string) => void editSession.undoRowChange(key),
    [editSession],
  );

  useEffect(() => {
    dataSource.on("row-selection", setSelectionCount);
    return () => dataSource.removeListener("row-selection", setSelectionCount);
  }, [dataSource]);

  useEffect(() => {
    if (!sessionDataSource) {
      setSubscribedSessionDataSource(undefined);
      return;
    }

    const handleSubscribed = () => {
      // Session table schema is only available once subscribed.
      editSession.reconcileWithSessionSchema();
      setSubscribedSessionDataSource(sessionDataSource);
    };

    setSubscribedSessionDataSource(undefined);
    sessionDataSource.on("subscribed", handleSubscribed);
    if (
      sessionDataSource.status === "subscribed" &&
      sessionDataSource.tableSchema
    ) {
      handleSubscribed();
    }

    return () =>
      sessionDataSource.removeListener("subscribed", handleSubscribed);
  }, [editSession, sessionDataSource]);

  useEffect(() => {
    const handleEditState = (nextEditState: EditState) => {
      setEditState(nextEditState);
    };
    const handleLifecycle = (nextLifecycle: EditLifecycle) => {
      setLifecycle(nextLifecycle);
    };

    setEditState(editSession.editState);
    setLifecycle(editSession.lifecycle);
    editSession.on("editState", handleEditState);
    editSession.on("lifecycle", handleLifecycle);
    return () => {
      editSession.removeListener("editState", handleEditState);
      editSession.removeListener("lifecycle", handleLifecycle);
    };
  }, [editSession]);

  useEffect(() => {
    const transition = isEditMode
      ? editSession.begin(copyOption)
      : editSession.end();

    void transition.catch((error) => {
      if (isEditMode) {
        console.error("[useEditableTable] begin edit session failed", error);
        onCancelRef.current();
      } else {
        console.error("[useEditableTable] end edit session failed", error);
      }
    });
  }, [copyOption, editSession, isEditMode]);

  const canCancel =
    lifecycle.status === "active" ||
    (lifecycle.status === "error" && lifecycle.operation === "end");

  const canSave =
    canCancel &&
    (editState === "dirty" || editState === "stale") &&
    editSession.invalidCount === 0;
  const isEditSessionReady =
    isEditMode &&
    sessionDataSource !== undefined &&
    sessionDataSource === editSession.sessionDataSource &&
    subscribedSessionDataSource === sessionDataSource &&
    sessionDataSource.status === "subscribed" &&
    sessionDataSource.tableSchema !== undefined;

  const editSchema = subscribedSessionDataSource?.tableSchema;
  const viewSchema = sourceDataSource.tableSchema;
  // Consumers rendering a single Table must rebuild column descriptors when this is true.
  const columnsDiverge =
    editSchema !== undefined &&
    viewSchema !== undefined &&
    (editSchema.columns.length !== viewSchema.columns.length ||
      editSchema.columns.some(
        (column, index) => column.name !== viewSchema.columns[index]?.name,
      ));

  return {
    canCancel,
    canSave,
    columnsDiverge,
    dataSource,
    editSchema,
    editSession,
    lifecycle,
    hasSelection: selectionCount > 0,
    isEditSessionReady,
    onCancel: handleCancel,
    onDelete: handleDelete,
    onSave: handleSave,
    onUndoRowChange: handleUndoRowChange,
    rowClassNameGenerators: isEditMode
      ? EDIT_ACTION_ROW_CLASS_NAME_GENERATORS
      : undefined,
    sessionDataSource,
    sourceDataSource,
  };
};
