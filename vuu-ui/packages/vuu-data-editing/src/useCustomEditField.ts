import type { VuuRowDataItemType } from "@vuu-ui/vuu-protocol-types";
import { isRpcError } from "@vuu-ui/vuu-utils";
import { useCallback, useEffect, useRef, useState } from "react";
import { useEditSession } from "./DataEditingProvider";
import type { EditSession, EditSessionValue } from "./EditSession";
import { toError } from "./edit-errors";
import { useEditSessionState } from "./useEditSessionState";

export interface CustomEditFieldHookProps<T extends EditSessionValue> {
  /** Key of the row being edited. */
  rowKey: string;
  /** The column the value is saved to. */
  name: string;
  /**
   * The saved value. The field resets to this value when it changes, and
   * when the edit session ends.
   */
  originalValue: T | undefined;
  /**
   * Compares an edited value with `originalValue`. When equal, the edit is
   * reverted rather than committed, so the session is no longer dirty.
   * @default Object.is
   */
  equals?: (a: T, b: T) => boolean;
  /**
   * Converts the value to the scalar sent to the server. Required when `T`
   * is an object.
   */
  serialize?: (value: T) => VuuRowDataItemType;
  /** Defaults to the session from the enclosing DataEditingProvider. */
  editSession?: EditSession;
  /** Called when a commit fails. */
  onError?: (error: Error) => void;
}

/**
 * Adapts a non-standard editor (a picker, a list editor, any custom control)
 * to an EditSession. Tracks the current and original values, reverts the
 * edit when the user restores the original value, and commits to the session
 * table with `serialize(value)`.
 *
 * @example
 * const { value, setValue, isDirty } = useCustomEditField({
 *   rowKey: dataRow.key,
 *   name: "permissions",
 *   originalValue: permissions,
 *   equals: (a, b) => a.equals(b),
 *   serialize: (p) => JSON.stringify(p.toJSON()),
 * });
 */
export const useCustomEditField = <T extends EditSessionValue>({
  editSession: editSessionProp,
  equals = Object.is,
  name,
  onError,
  originalValue,
  rowKey,
  serialize,
}: CustomEditFieldHookProps<T>) => {
  const contextEditSession = useEditSession();
  const editSession = editSessionProp ?? contextEditSession;
  const { inEditMode } = useEditSessionState(editSession);
  const [value, setValueState] = useState<T | undefined>(originalValue);
  const [error, setError] = useState<Error | undefined>();
  const [committing, setCommitting] = useState(false);
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;
  const latestCommitRef = useRef(0);

  useEffect(() => {
    if (!inEditMode) {
      setValueState(originalValue);
      setError(undefined);
    }
  }, [inEditMode, originalValue]);

  /** Updates the value and commits it to the edit session. */
  const setValue = useCallback(
    async (nextValue: T) => {
      if (!editSession) {
        throw Error(
          "[useCustomEditField] no EditSession, pass editSession or use a DataEditingProvider",
        );
      }
      const original = originalValue ?? nextValue;
      const committedValue =
        originalValue !== undefined && equals(nextValue, originalValue)
          ? originalValue
          : nextValue;
      const commitId = ++latestCommitRef.current;
      setValueState(committedValue);
      setCommitting(true);
      setError(undefined);
      try {
        const response = await editSession.commit(
          rowKey,
          name,
          original,
          committedValue,
          true,
          serialize ? { dataSourceValue: serialize(committedValue) } : {},
        );
        if (isRpcError(response) && commitId === latestCommitRef.current) {
          const err = new Error(response.errorMessage);
          setError(err);
          onErrorRef.current?.(err);
        }
      } catch (cause) {
        if (commitId === latestCommitRef.current) {
          const err = toError(cause);
          setError(err);
          if (onErrorRef.current) {
            onErrorRef.current(err);
          } else {
            console.error(`[useCustomEditField] commit ${name} failed`, err);
          }
        }
      } finally {
        if (commitId === latestCommitRef.current) {
          setCommitting(false);
        }
      }
    },
    [editSession, equals, name, originalValue, rowKey, serialize],
  );

  /** Restores the original value locally, without committing. */
  const reset = useCallback(() => {
    setValueState(originalValue);
    setError(undefined);
  }, [originalValue]);

  const isDirty =
    value !== undefined &&
    originalValue !== undefined &&
    !equals(value, originalValue);

  return { committing, error, isDirty, reset, setValue, value };
};
