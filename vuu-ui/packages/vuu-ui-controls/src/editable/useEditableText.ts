import type { DataValueValidationChecker } from "@vuu-ui/vuu-data-types";
import { VuuRowDataItemType } from "@vuu-ui/vuu-protocol-types";
import type { TableCellEditHandler } from "@vuu-ui/vuu-table-types";
import {
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

export interface EditableTextHookProps<
  T extends VuuRowDataItemType = VuuRowDataItemType,
> {
  clientSideEditValidationCheck?: DataValueValidationChecker;
  value?: T;
  onEdit?: TableCellEditHandler;
  type?: "string" | "number" | "boolean";
}

type EditState = {
  message?: string;
  // Set once we commit an edit, cleared when edit session is ended.
  previousValue?: string;
  value: string;
};

const stringValueOf = (value?: VuuRowDataItemType) => value?.toString() ?? "";

export const useEditableText = <T extends string | number | boolean = string>({
  clientSideEditValidationCheck,
  value,
  onEdit,
  type = "string",
}: EditableTextHookProps<T>) => {
  const [editState, setEditState] = useState<EditState>({
    value: stringValueOf(value),
  });
  const initialValueRef = useRef<string>(value?.toString() ?? "");
  const isDirtyRef = useRef(false);
  const isEditingRef = useRef(false);

  useMemo(() => {
    if (initialValueRef.current !== value?.toString()) {
      initialValueRef.current = stringValueOf(value);
      setEditState({ message: "", value: stringValueOf(value) });
    }
  }, [value]);

  const commit = useCallback(async () => {
    const { value } = editState;
    const result = clientSideEditValidationCheck?.(value, "*");
    if (result?.ok === false) {
      setEditState((state) => ({
        ...state,
        message: result?.messages?.join(","),
      }));
      return false;
    } else {
      //save initial value,it could be reset by time async operation completes
      const { current: initialValue } = initialValueRef;
      const typedValue = getTypedValue(value, type, true);
      const previousValue = getTypedValue(initialValue, type);
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
          previousValue:
            previousValue === value
              ? undefined
              : previousValue === undefined
                ? initialValue
                : previousValue,
          value,
        }));
        initialValueRef.current = value;
        return true;
      } else if (isRpcError(response)) {
        if (response.errorMessage === "CHANGE_REVERTED") {
          setEditState(({ value }) => ({
            previousValue: undefined,
            value,
          }));
          initialValueRef.current = value;
          return true;
        } else {
          setEditState((state) => ({
            ...state,
            message: response.errorMessage,
          }));
        }
      }
    }
    return false;
  }, [clientSideEditValidationCheck, editState, onEdit, type]);

  const handleKeyDown = useCallback(
    async (evt: KeyboardEvent<HTMLElement>) => {
      const { key, target } = evt;
      const input = target as HTMLInputElement;
      if (key === "Enter") {
        if (isEditingRef.current) {
          if (isDirtyRef.current) {
            const commitSuccessful = await commit();
            if (commitSuccessful) {
              isEditingRef.current = false;
              dispatchCustomEvent(input, "vuu-exit-edit-mode");
              dispatchCustomEvent(input, "vuu-commit");
            }
          } else {
            isEditingRef.current = false;
            dispatchCustomEvent(input, "vuu-exit-edit-mode");
          }
        } else {
          isEditingRef.current = true;
          dispatchCustomEvent(input, "vuu-enter-edit-mode");
          input.select();
        }
      } else if (
        key === "ArrowRight" ||
        key === "ArrowLeft" ||
        key === "ArrowUp" ||
        key === "ArrowDown"
      ) {
        if (isEditingRef.current) {
          evt.stopPropagation();
        } else {
          // console.log(
          //   `[useEditableText] handleKeydown, arrowkey, not editing so let it bubble`,
          // );
          // evt.preventDefault();
        }
      } else if (evt.key === "Escape") {
        if (isEditingRef.current) {
          if (isDirtyRef.current) {
            const { value: previousValue } = editState;
            isDirtyRef.current = false;
            setEditState({
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
              "cancel",
            );
          }
          isEditingRef.current = false;
          dispatchCustomEvent(input, "vuu-exit-edit-mode");
        }
      }
    },
    [commit, editState, onEdit],
  );

  const beginEditHandler = useCallback((evt: Event) => {
    isEditingRef.current = true;
    dispatchCustomEvent(evt.target as HTMLElement, "vuu-enter-edit-mode");
  }, []);

  const handleFocus = useCallback<FocusEventHandler<HTMLElement>>(
    (e) => {
      e.target.addEventListener("vuu-begin-edit", beginEditHandler, true);
    },
    [beginEditHandler],
  );

  const handleBlur = useCallback<FocusEventHandler<HTMLElement>>(
    async (evt) => {
      evt.target.removeEventListener("vuu-begin-edit", beginEditHandler, true);
      if (isEditingRef.current) {
        if (isDirtyRef.current) {
          const commitSuccessful = await commit();
          console.log({ commitSuccessful });
        }
        isEditingRef.current = false;
        dispatchCustomEvent(evt.target, "vuu-exit-edit-mode");
      }
    },
    [beginEditHandler, commit],
  );

  const handleChange = useCallback<FormEventHandler>(
    (evt) => {
      const { value } = evt.target as HTMLInputElement;
      isDirtyRef.current = value !== initialValueRef.current;
      const result = clientSideEditValidationCheck?.(value, "change");
      setEditState({ value });

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
        setEditState({ value, message: result.messages?.join(",") });
      }

      if (!isEditingRef.current) {
        isEditingRef.current = true;
        dispatchCustomEvent(evt.target as HTMLElement, "vuu-enter-edit-mode");
      }
    },
    [clientSideEditValidationCheck, onEdit],
  );

  return {
    /**
     * has the value been edited during this edit session
     */
    edited:
      editState.previousValue !== undefined &&
      editState.previousValue !== editState.value,
    //TODO why are we detecting commit here, why not use VuuInput ?
    inputProps: {
      onBlur: handleBlur,
      onFocus: handleFocus,
      onKeyDown: handleKeyDown,
    },
    onChange: handleChange,
    value: editState.value,
    warningMessage: editState.message,
  };
};
