import { VuuRowDataItemType } from "@vuu-ui/vuu-protocol-types";
import type {
  RuntimeColumnDescriptor,
  TableCellEditHandler,
} from "@vuu-ui/vuu-table-types";
import {
  DataValidationError,
  dispatchCustomEvent,
  getTypedValue,
  isRpcError,
  isRpcSuccess,
} from "@vuu-ui/vuu-utils";
import {
  FocusEventHandler,
  FormEventHandler,
  KeyboardEvent,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";

export interface InputCellHookProps<
  T extends VuuRowDataItemType = VuuRowDataItemType,
> {
  column: Pick<
    RuntimeColumnDescriptor,
    "clientSideEditValidationCheck" | "label" | "name"
  >;
  value?: T;
  onEdit?: TableCellEditHandler;
  type?: "string" | "number" | "boolean";
}

type EditState = {
  editing: boolean;
  message?: string;
  // Set once we commit an edit, cleared when edit session is ended.
  previousValue?: string;
  value: string;
};

const stringValueOf = (value?: VuuRowDataItemType) => value?.toString() ?? "";

export const useInputCell = <T extends string | number | boolean = string>({
  column,
  value,
  onEdit,
  type = "string",
}: InputCellHookProps<T>) => {
  const [editState, setEditState] = useState<EditState>({
    editing: false,
    value: stringValueOf(value),
  });
  const initialValueRef = useRef<string>(value?.toString() ?? "");
  const isDirtyRef = useRef(false);

  useMemo(() => {
    if (initialValueRef.current !== value?.toString()) {
      initialValueRef.current = stringValueOf(value);
      setEditState((editState) => ({
        ...editState,
        message: undefined,
        value: stringValueOf(value),
      }));
    }
  }, [value]);

  const commit = useCallback(async () => {
    const { value } = editState;
    const result = column.clientSideEditValidationCheck?.(value, "*");
    if (result?.ok === false) {
      setEditState((state) => ({
        ...state,
        message: result?.messages?.join(","),
      }));
      return false;
    } else {
      //save initial value,it could be reset by time async operation completes
      const { current: initialValue } = initialValueRef;
      const previousValue = getTypedValue(initialValue, type);
      try {
        const typedValue = getTypedValue(value, type, true);
        const response = await onEdit?.(
          {
            editType: "commit",
            isValid: true,
            previousValue,
            value: typedValue,
          },
          "commit",
        );
        if (isRpcSuccess(response)) {
          isDirtyRef.current = false;
          setEditState(({ previousValue, value }) => ({
            editing: false,
            previousValue:
              previousValue === value
                ? undefined
                : previousValue === undefined
                  ? initialValue
                  : previousValue,
            value,
          }));
        } else if (isRpcError(response)) {
          setEditState((state) => ({
            ...state,
            message: response.errorMessage,
          }));
          return false;
        }
        initialValueRef.current = value;
        return true;
      } catch (e) {
        if (e instanceof DataValidationError) {
          const { actualType, expectedType, message } = e;
          if (column) {
            const { name, label = name } = column;
            const message = `${label} is a ${expectedType} value, data entered is ${actualType} `;
            setEditState((state) => ({
              ...state,
              message,
            }));
            onEdit?.(
              {
                editType: "commit",
                isValid: false,
                previousValue,
                value,
              },
              "commit",
            );
          } else {
            setEditState((state) => ({
              ...state,
              message,
            }));
          }
        }
      }
    }
    return false;
  }, [column, editState, onEdit, type]);

  /**
   * Depending on the current state (editing or not, dirty or not) activation will either be
   * entering into edit state, leaving edit state or commiting edited value.
   */
  const toggleActivation = useCallback(
    async (input: HTMLInputElement, cancel = false) => {
      if (editState.editing) {
        if (isDirtyRef.current) {
          if (cancel) {
            const { value: previousValue } = editState;
            isDirtyRef.current = false;
            setEditState({
              editing: false,
              value: initialValueRef.current,
              message: undefined,
            });
            // this assumes the original value was valid, is that safe ?
            onEdit?.(
              {
                editType: "cancel",
                isValid: true,
                previousValue,
                value: initialValueRef.current,
              },
              "commit",
            );
          } else {
            const commitSuccessful = await commit();
            if (commitSuccessful) {
              setEditState((editState) => ({ ...editState, editing: false }));
              dispatchCustomEvent(input, "vuu-commit");
            }
          }
        } else {
          setEditState((editState) => ({ ...editState, editing: false }));
        }
      } else if (!cancel) {
        setEditState((editState) => ({ ...editState, editing: true }));
        input.select();
      }
    },
    [commit, editState, onEdit],
  );

  const handleKeyDown = useCallback(
    async (evt: KeyboardEvent<HTMLElement>) => {
      const { key, target } = evt;
      const input = target as HTMLInputElement;
      if (key === "Enter") {
        toggleActivation(input);
      } else if (
        key === "ArrowRight" ||
        key === "ArrowLeft" ||
        key === "ArrowUp" ||
        key === "ArrowDown"
      ) {
        if (editState.editing) {
          evt.stopPropagation();
        } else {
          // console.log(
          //   `[useEditableText] handleKeydown, arrowkey, not editing so let it bubble`,
          // );
          // evt.preventDefault();
        }
      } else if (evt.key === "Escape") {
        toggleActivation(input, true);
      }
    },
    [editState, toggleActivation],
  );

  const handleFocus = useCallback<FocusEventHandler<HTMLElement>>(
    (e) => {
      // If focus is transferred from enclosing cell element, we are explicitl entering edit mode
      const input = e.target as HTMLInputElement;
      const source = e.relatedTarget as HTMLElement;
      if (
        source?.classList.contains("vuuTableCell") &&
        source.contains(input)
      ) {
        toggleActivation(input);
      }
    },
    [toggleActivation],
  );

  const handleBlur = useCallback<FocusEventHandler<HTMLElement>>(async () => {
    if (editState.editing) {
      if (isDirtyRef.current) {
        const commitSuccessful = await commit();
        console.log({ commitSuccessful });
      }
      setEditState((editState) => ({ ...editState, editing: false }));
    }
  }, [commit, editState]);

  const handleChange = useCallback<FormEventHandler>(
    (evt) => {
      const { value } = evt.target as HTMLInputElement;
      isDirtyRef.current = value !== initialValueRef.current;
      const result = column.clientSideEditValidationCheck?.(value, "change");
      setEditState({ editing: true, value });

      onEdit?.(
        {
          editType: "change",
          isValid: result?.ok !== false,
          previousValue: initialValueRef.current,
          value,
        },
        "change",
      );
      if (result?.ok === false) {
        setEditState({
          editing: true,
          value,
          message: result.messages?.join(","),
        });
      }
    },
    [column, onEdit],
  );

  // console.log(
  //   `[useEditableText] edited = ${
  //     editState.previousValue !== undefined &&
  //     editState.previousValue !== editState.value
  //   }
  //   editState.previousValue ${editState.previousValue}
  //   editState.value ${editState.value}
  //   `,
  // );

  return {
    editing: editState.editing,
    inputProps: {
      onBlur: handleBlur,
      onFocus: handleFocus,
      onKeyDown: handleKeyDown,
    },
    onChange: handleChange,
    previousValue: editState.previousValue,
    value: editState.value,
    warningMessage: editState.message,
  };
};
