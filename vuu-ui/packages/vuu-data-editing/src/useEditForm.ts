import type { DataSource, DeleteRowMode } from "@vuu-ui/vuu-data-types";
import type { VuuRowDataItemType } from "@vuu-ui/vuu-protocol-types";
import type { DataRow } from "@vuu-ui/vuu-table-types";
import { isRpcError } from "@vuu-ui/vuu-utils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  EditSession,
  type EditSessionApi,
  type EditSessionValue,
  type RowDefaultDataItemValues,
} from "./EditSession";
import { useEditMode } from "./EditModeProvider";
import { type EditErrorHandler, reportEditError, toError } from "./edit-errors";
import { useEditSessionState } from "./useEditSessionState";

export type EditFormMode = "edit" | "create";

export type EditFormValues = Readonly<
  Record<string, EditSessionValue | undefined>
>;

/** Field name to error message. Return an empty object (or nothing) when valid. */
export type EditFormFieldErrors = Readonly<Record<string, string>>;

/**
 * Cross-field validation run before the form is saved. Return error messages
 * keyed by field name.
 */
export type EditFormValidator = (
  values: EditFormValues,
) => EditFormFieldErrors | undefined;

export interface EditFormHookProps {
  /** Source table data source. */
  dataSource: DataSource;
  /**
   * The row being edited (edit mode). Its values, merged with any edits, are
   * passed to `validate`.
   */
  dataRow?: DataRow;
  /**
   * `"edit"` edits the selected row(s) of `dataSource`. `"create"` adds a
   * new row via an empty session table.
   * @default "edit"
   */
  mode?: EditFormMode;
  /** Create mode: the form's fields, in tab order. */
  columns?: readonly string[];
  /** Create mode: fields that must have a value. Defaults to `columns`. */
  requiredColumns?: readonly string[];
  /**
   * Edit mode only: whether the edit session is active. When omitted, edit
   * mode is read from the nearest EditModeProvider. Create mode is always
   * active while the form is mounted.
   */
  isEditMode?: boolean;
  /** @default "soft" */
  deleteMode?: DeleteRowMode;
  /** @default "createSessionDataSource" */
  editSessionApi?: EditSessionApi;
  /** Default column values merged into the new row. Pass a stable reference. */
  rowDefaults?: RowDefaultDataItemValues;
  validate?: EditFormValidator;
  /** Called once changes have been saved. */
  onSaved?: () => void;
  /** Called once the form has been cancelled. */
  onCancelled?: () => void;
  /** Called when begin, save or cancel fails. Defaults to console.error. */
  onError?: EditErrorHandler;
}

const EMPTY_ERRORS: EditFormFieldErrors = {};

const NEW_ROW = { key: EditSession.newRowKey } as DataRow;

/**
 * Plain column values of a row. Table DataRows are Proxies with no own
 * keys, so they cannot be spread; they serialize via `toJSON`.
 */
export const getDataRowValues = (
  dataRow: DataRow,
): Record<string, VuuRowDataItemType> => {
  const { toJSON } = dataRow as { toJSON?: unknown };
  const values =
    typeof toJSON === "function"
      ? (toJSON.call(dataRow) as Record<string, VuuRowDataItemType>)
      : { ...dataRow };
  return { ...values, key: dataRow.key };
};

const hasErrors = (errors: EditFormFieldErrors | undefined) =>
  errors !== undefined && errors !== null && Object.keys(errors).length > 0;

/**
 * Owns an EditSession for a form that edits one entity, or creates one.
 *
 * - edit mode copies the selected row into a session table (`"Selected"`).
 * - create mode begins an empty session table (`"Empty"`) and stages field
 *   values as a new-row draft. Render fields with
 *   `dataRow={{ key: EditSession.newRowKey }}` and `deferNewRow`.
 *
 * Call `submit()` to validate and save, `cancel()` to discard. Wrap the form
 * in a `DataEditingProvider` with the returned `editSession`.
 */
export const useEditForm = ({
  columns,
  dataRow,
  dataSource,
  deleteMode,
  editSessionApi,
  isEditMode: isEditModeProp,
  mode = "edit",
  onCancelled,
  onError,
  onSaved,
  requiredColumns,
  rowDefaults,
  validate,
}: EditFormHookProps) => {
  const { isEditMode: isEditModeContext } = useEditMode();
  const isCreate = mode === "create";
  const isEditMode = isCreate || (isEditModeProp ?? isEditModeContext);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<Error | undefined>();
  const [validationErrors, setValidationErrors] =
    useState<EditFormFieldErrors>(EMPTY_ERRORS);
  const savingRef = useRef(false);
  // Create mode: the row has been added but the session has not yet been
  // saved. A retry after a failed save must not add the row again.
  const rowAddedRef = useRef(false);
  const [rowAdded, setRowAdded] = useState(false);
  const markRowAdded = useCallback((added: boolean) => {
    rowAddedRef.current = added;
    setRowAdded(added);
  }, []);

  const callbacksRef = useRef({ onCancelled, onError, onSaved, validate });
  callbacksRef.current = { onCancelled, onError, onSaved, validate };

  const editSession = useMemo(
    () =>
      new EditSession({ dataSource, deleteMode, editSessionApi, rowDefaults }),
    [dataSource, deleteMode, editSessionApi, rowDefaults],
  );

  const sessionState = useEditSessionState(editSession);

  // editState stays "dirty" across further edits, so re-render on each change
  // to this row's values, for consumers that read getValues().
  const [, setValuesRevision] = useState(0);
  const rowKey = dataRow?.key;
  useEffect(() => {
    if (isCreate || rowKey === undefined) return;
    const onCellEditChanged = (key: string) => {
      if (key === rowKey) setValuesRevision((n) => n + 1);
    };
    editSession.on("cellEditChanged", onCellEditChanged);
    return () => {
      editSession.removeListener("cellEditChanged", onCellEditChanged);
    };
  }, [editSession, isCreate, rowKey]);

  const fail = useCallback(
    (cause: unknown, operation: "begin" | "cancel" | "save") => {
      const err = toError(cause);
      setError(err);
      reportEditError(
        "useEditForm",
        callbacksRef.current.onError,
        err,
        operation,
      );
    },
    [],
  );

  useEffect(() => {
    if (isCreate && columns) {
      editSession.configureNewRow(columns, requiredColumns);
    }
  }, [columns, editSession, isCreate, requiredColumns]);

  useEffect(() => {
    setError(undefined);
    setValidationErrors(EMPTY_ERRORS);
    markRowAdded(false);
    const transition = isEditMode
      ? editSession.begin(isCreate ? "Empty" : "Selected")
      : editSession.end();
    transition.catch((cause) => fail(cause, isEditMode ? "begin" : "cancel"));
  }, [editSession, fail, isCreate, isEditMode, markRowAdded]);

  useEffect(
    () => () => {
      editSession.end().catch(() => undefined);
    },
    [editSession],
  );

  const getValues = useCallback((): EditFormValues => {
    if (isCreate) {
      return editSession.newRowState.values;
    } else if (dataRow) {
      return {
        ...getDataRowValues(dataRow),
        ...editSession.getEditedValues(dataRow.key),
      };
    }
    return {};
  }, [dataRow, editSession, isCreate]);

  /**
   * Validates and saves. Resolves true when saved. Concurrent calls are
   * ignored while a save is in progress.
   */
  const submit = useCallback(
    async (force = false): Promise<boolean> => {
      if (savingRef.current) {
        return false;
      }
      setError(undefined);
      if (!rowAddedRef.current) {
        const errors = callbacksRef.current.validate?.(getValues());
        if (hasErrors(errors)) {
          setValidationErrors(errors as EditFormFieldErrors);
          return false;
        }
        setValidationErrors(EMPTY_ERRORS);
      }

      savingRef.current = true;
      setSaving(true);
      try {
        if (isCreate && !rowAddedRef.current) {
          const response = await editSession.addNewRow();
          if (isRpcError(response)) {
            setError(new Error(response.errorMessage));
            return false;
          } else if (hasErrors(editSession.newRowState.errors)) {
            // missing required values, errors are shown against the fields
            return false;
          }
          markRowAdded(true);
        }
        await editSession.end(true, force);
        markRowAdded(false);
        callbacksRef.current.onSaved?.();
        return true;
      } catch (cause) {
        fail(cause, "save");
        return false;
      } finally {
        savingRef.current = false;
        setSaving(false);
      }
    },
    [editSession, fail, getValues, isCreate, markRowAdded],
  );

  /** Discards all changes and ends the edit session. */
  const cancel = useCallback(async () => {
    try {
      await editSession.end();
      markRowAdded(false);
      setValidationErrors(EMPTY_ERRORS);
      setError(undefined);
      callbacksRef.current.onCancelled?.();
    } catch (cause) {
      fail(cause, "cancel");
    }
  }, [editSession, fail, markRowAdded]);

  /** Create mode: stage a value without rendering an EditField. */
  const setValue = useCallback(
    (name: string, value: VuuRowDataItemType) => {
      editSession.setNewRowValue(name, value);
      setValidationErrors((errors) => {
        if (errors[name] === undefined) {
          return errors;
        }
        const { [name]: _removed, ...rest } = errors;
        return rest;
      });
    },
    [editSession],
  );

  const { errors: newRowErrors, rowErrorColumn } = sessionState.newRowState;
  const fieldErrors = useMemo<EditFormFieldErrors>(() => {
    if (!isCreate) {
      return validationErrors;
    }
    // a server rejection of the row is shown in the form error banner
    const { [rowErrorColumn ?? ""]: _rowError, ...errors } = newRowErrors;
    return { ...errors, ...validationErrors };
  }, [isCreate, newRowErrors, rowErrorColumn, validationErrors]);

  const isDirty = isCreate
    ? Object.keys(sessionState.newRowState.values).length > 0
    : sessionState.isDirty;

  return {
    ...sessionState,
    canSave:
      !saving &&
      (isCreate
        ? rowAdded
          ? sessionState.inEditMode
          : sessionState.isActive && editSession.isNewRowComplete()
        : sessionState.canSave),
    cancel,
    /** The row being edited, a new-row placeholder in create mode. */
    dataRow: isCreate ? NEW_ROW : dataRow,
    editSession,
    error: error ?? sessionState.error,
    fieldErrors,
    getValues,
    isDirty,
    isEditMode,
    mode,
    /** Create mode: the row was added, saving the session failed. */
    rowAdded,
    saving,
    setValue,
    submit,
  };
};

export type EditFormHookResult = ReturnType<typeof useEditForm>;
