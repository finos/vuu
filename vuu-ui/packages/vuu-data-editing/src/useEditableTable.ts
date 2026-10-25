import type {
  CopyOption,
  DataSource,
  DeleteRowMode,
} from "@vuu-ui/vuu-data-types";
import type { VuuTable } from "@vuu-ui/vuu-protocol-types";
import type { DataRow } from "@vuu-ui/vuu-table-types";
import { useData, useLayoutEffectSkipFirst } from "@vuu-ui/vuu-utils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  EditSession,
  type EditActionType,
  type EditLifecycle,
  type EditSessionApi,
  type EditState,
  type RowDefaultDataItemValues,
} from "./EditSession";
import { EDIT_ACTION_ROW_CLASS_NAME_GENERATOR } from "./editActionRowClassNameGenerator";
import { isEditRowReadOnly } from "./edit-utils";
import { useEditMode } from "./EditModeProvider";
import { type EditErrorHandler, reportEditError } from "./edit-errors";

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
  /** @default "soft" */
  deleteMode?: DeleteRowMode;
  /** @default "createSessionDataSource" */
  editSessionApi?: EditSessionApi;
  /** Rows copied into the session table when editing begins. @default "All" */
  copyOption?: CopyOption;
  /**
   * Begins (true) or ends (false) the edit session. When omitted, edit mode
   * is read from the nearest EditModeProvider.
   */
  isEditMode?: boolean;
  onCancel: () => void;
  /**
   * Called when begin, save, cancel or delete fails. Defaults to
   * console.error. Use this to surface errors, e.g. as a notification.
   */
  onError?: EditErrorHandler;
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
  isEditMode: isEditModeProp,
  onCancel,
  onError,
  onSave,
  rowDefaults,
  table,
}: EditableTableHookProps) => {
  const { VuuDataSource } = useData();
  const { isEditMode: isEditModeContext } = useEditMode();
  const isEditMode = isEditModeProp ?? isEditModeContext;
  const [selectionCount, setSelectionCount] = useState(0);
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;
  useLayoutEffectSkipFirst(() => {
    if (process.env.NODE_ENV !== "production" && !dataSourceProp) {
      console.warn(
        "[useEditableTable] columns or table changed, a new DataSource and EditSession will be created. Pass stable (memoized) values.",
      );
    }
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
        dataSource: sourceDataSource,
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
      reportEditError("useEditableTable", onErrorRef.current, error, "cancel");
    }
  }, [editSession, onCancel]);

  const handleSave = useCallback(
    async (force = false) => {
      try {
        await editSession.end(true, force);
        setSelectionCount(0);
        onSave();
      } catch (error) {
        reportEditError("useEditableTable", onErrorRef.current, error, "save");
      }
    },
    [editSession, onSave],
  );

  const handleDelete = useCallback(async () => {
    try {
      const response = await editSession.deleteSelectedRows();
      if (response.type === "ERROR_RESULT") {
        reportEditError(
          "useEditableTable",
          onErrorRef.current,
          new Error(response.errorMessage),
          "delete",
        );
      }
    } catch (error) {
      reportEditError("useEditableTable", onErrorRef.current, error, "delete");
    }
  }, [editSession]);

  const handleUndoRowChange = useCallback(
    (key: string, action: EditActionType) =>
      void editSession.undoRowChange(key, action),
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
        reportEditError("useEditableTable", onErrorRef.current, error, "begin");
        onCancelRef.current();
      } else {
        reportEditError(
          "useEditableTable",
          onErrorRef.current,
          error,
          "cancel",
        );
      }
    });
  }, [copyOption, editSession, isEditMode]);

  const canCancel =
    lifecycle.status === "active" ||
    (lifecycle.status === "error" && lifecycle.operation === "end");

  // editState is "invalid" whenever invalidCount > 0, so this matches editSession.canSave
  const canSave = canCancel && (editState === "dirty" || editState === "stale");
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
    editState,
    isEditMode,
    lifecycle,
    hasSelection: selectionCount > 0,
    isEditSessionReady,
    onCancel: handleCancel,
    onDelete: handleDelete,
    onSave: handleSave,
    onUndoRowChange: handleUndoRowChange,
    isRowSelectable: isEditMode
      ? (dataRow: DataRow) => !isEditRowReadOnly(dataRow)
      : undefined,
    rowClassNameGenerators: isEditMode
      ? EDIT_ACTION_ROW_CLASS_NAME_GENERATORS
      : undefined,
    sessionDataSource,
    sourceDataSource,
  };
};
