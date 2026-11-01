import type { DataSource, DeleteRowMode } from "@vuu-ui/vuu-data-types";
import type { VuuRowDataItemType } from "@vuu-ui/vuu-protocol-types";
import type { DataRow } from "@vuu-ui/vuu-table-types";
import { isRpcError, isRpcSuccess } from "@vuu-ui/vuu-utils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  EditSession,
  type EditSessionApi,
  type EditSessionValue,
  type RowDefaultDataItemValues,
} from "./EditSession";
import { DirectEditSession } from "./DirectEditSession";
import { useEditMode } from "./EditModeProvider";
import { type EditErrorHandler, reportEditError, toError } from "./edit-errors";
import { useEditSessionState } from "./useEditSessionState";

export type EditFormMode = "edit" | "create";

/**
 * Edit mode only.
 * - `session`: edits are staged in a session table and applied on Save.
 * - `direct`: each field is validated and sent to `dataSource` as it is
 *   committed. There is nothing to save; `submit` just ends editing.
 */
export type EditFormEditModel = "session" | "direct";

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
  /**
   * Fields that must have a value. In create mode, defaults to `columns`. In
   * direct edit mode, an empty value for one of these is not sent.
   */
  requiredColumns?: readonly string[];
  /** @default "session" */
  editModel?: EditFormEditModel;
  /**
   * Create mode only: add the new row to this session, owned by someone else
   * (e.g. a table's edit session), rather than to a session of the form's
   * own. Create then adds the row to the session without saving it; the
   * owner saves or cancels the session.
   */
  editSession?: EditSession;
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

const isEmptyValue = (value: unknown) =>
  value === undefined ||
  value === null ||
  (typeof value === "string" && value.trim() === "");

const toRowSnapshot = (
  key: string,
  values: Record<string, EditSessionValue | undefined>,
) => ({ ...values, key }) as unknown as DataRow;

/**
 * A DirectEditSession that reports each value accepted by the server, so
 * the form can show it once editing ends.
 */
class FormDirectEditSession extends DirectEditSession {
  #onCommitted: (columnName: string, value: VuuRowDataItemType) => void;
  constructor(
    props: ConstructorParameters<typeof DirectEditSession>[0],
    onCommitted: (columnName: string, value: VuuRowDataItemType) => void,
  ) {
    super(props);
    this.#onCommitted = onCommitted;
  }
  async commit(
    key: string,
    columnName: string,
    originalValue: VuuRowDataItemType,
    typedValue: string | number | boolean,
    isValid: boolean,
  ) {
    const response = await super.commit(
      key,
      columnName,
      originalValue,
      typedValue,
      isValid,
    );
    if (isRpcSuccess(response)) {
      this.#onCommitted(columnName, typedValue);
    }
    return response;
  }
}

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
 * in a `DataEditingProvider` with the returned `fieldEditSession`.
 *
 * With `editModel: "direct"` each field is validated and sent as it is
 * committed. With a shared `editSession` (create mode), Create adds the row
 * to that session, which its owner saves.
 */
export const useEditForm = ({
  columns,
  dataRow,
  dataSource,
  deleteMode,
  editModel = "session",
  editSession: sharedEditSession,
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
  const isDirect = !isCreate && editModel === "direct";
  const isShared = isCreate && sharedEditSession !== undefined;
  // the session's lifecycle is managed by the form
  const ownsSession = !isDirect && !isShared;
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
      sharedEditSession ??
      new EditSession({ dataSource, deleteMode, editSessionApi, rowDefaults }),
    [dataSource, deleteMode, editSessionApi, rowDefaults, sharedEditSession],
  );

  // direct editing: values accepted by the server since the row was selected
  const [directValues, setDirectValues] = useState<
    Record<string, VuuRowDataItemType>
  >({});
  const directRowKey = isDirect ? dataRow?.key : undefined;
  // biome-ignore lint/correctness/useExhaustiveDependencies: reset when the row changes
  useEffect(() => {
    setDirectValues({});
  }, [directRowKey]);
  const directValuesRef = useRef(directValues);
  directValuesRef.current = directValues;
  const dataRowRef = useRef(dataRow);
  dataRowRef.current = dataRow;
  const requiredRef = useRef(requiredColumns);
  requiredRef.current = requiredColumns;

  const directEditSession = useMemo(
    () =>
      isDirect
        ? new FormDirectEditSession(
            {
              dataSource,
              validate: (_key, columnName, value) => {
                if (
                  requiredRef.current?.includes(columnName) &&
                  isEmptyValue(value)
                ) {
                  return "A value is required";
                }
                const { current: row } = dataRowRef;
                const values = {
                  ...(row ? getDataRowValues(row) : undefined),
                  ...directValuesRef.current,
                  [columnName]: value,
                };
                return callbacksRef.current.validate?.(values)?.[columnName];
              },
            },
            (columnName, value) =>
              setDirectValues((values) => ({ ...values, [columnName]: value })),
          )
        : undefined,
    [dataSource, isDirect],
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
    if (!ownsSession) {
      return;
    }
    const transition = isEditMode
      ? editSession.begin(isCreate ? "Empty" : "Selected")
      : editSession.end();
    transition.catch((cause) => fail(cause, isEditMode ? "begin" : "cancel"));
  }, [editSession, fail, isCreate, isEditMode, markRowAdded, ownsSession]);

  useEffect(
    () => () => {
      if (isShared) {
        editSession.clearNewRow();
      } else if (ownsSession) {
        editSession.end().catch(() => undefined);
      }
    },
    [editSession, isShared, ownsSession],
  );

  const getValues = useCallback((): EditFormValues => {
    if (isCreate) {
      return editSession.newRowState.values;
    } else if (isDirect && dataRow) {
      return { ...getDataRowValues(dataRow), ...directValuesRef.current };
    } else if (dataRow) {
      return {
        ...getDataRowValues(dataRow),
        ...editSession.getEditedValues(dataRow.key),
      };
    }
    return {};
  }, [dataRow, editSession, isCreate, isDirect]);

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
      if (isDirect) {
        // every field was sent as it was committed, nothing left to save
        callbacksRef.current.onSaved?.();
        return true;
      }
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
          if (isShared) {
            // the session's owner saves the row along with its other changes
            callbacksRef.current.onSaved?.();
            return true;
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
    [editSession, fail, getValues, isCreate, isDirect, isShared, markRowAdded],
  );

  /** Discards all changes and ends the edit session. */
  const cancel = useCallback(async () => {
    try {
      if (isShared) {
        editSession.clearNewRow();
      } else if (ownsSession) {
        await editSession.end();
      }
      markRowAdded(false);
      setValidationErrors(EMPTY_ERRORS);
      setError(undefined);
      callbacksRef.current.onCancelled?.();
    } catch (cause) {
      fail(cause, "cancel");
    }
  }, [editSession, fail, isShared, markRowAdded, ownsSession]);

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
    : isDirect
      ? false
      : sessionState.isDirty;

  const formDataRow = useMemo(
    () =>
      isCreate
        ? NEW_ROW
        : dataRow && Object.keys(directValues).length > 0
          ? toRowSnapshot(dataRow.key, {
              ...getDataRowValues(dataRow),
              ...directValues,
            })
          : dataRow,
    [dataRow, directValues, isCreate],
  );

  return {
    ...sessionState,
    canSave:
      !saving &&
      (isDirect
        ? isEditMode
        : isCreate
          ? rowAdded
            ? sessionState.inEditMode
            : sessionState.isActive && editSession.isNewRowComplete()
          : sessionState.canSave),
    cancel,
    /**
     * The row being edited, a new-row placeholder in create mode. With
     * direct editing, includes the values sent so far.
     */
    dataRow: formDataRow,
    editModel: isDirect ? ("direct" as const) : ("session" as const),
    editSession,
    /** Create mode: rows are added to a session owned by someone else. */
    isSharedSession: isShared,
    /** The session fields commit their edits to. */
    fieldEditSession: directEditSession ?? editSession,
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
