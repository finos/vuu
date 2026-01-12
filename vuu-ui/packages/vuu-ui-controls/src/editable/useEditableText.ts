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
      setEditState((state) => ({ ...state, message: undefined }));
      const typedValue = getTypedValue(value, type, true);
      const response = await onEdit?.(
        { editType: "commit", value: typedValue, isValid: true },
        "commit",
      );
      if (isRpcSuccess(response)) {
        isDirtyRef.current = false;
        initialValueRef.current = value;
        return true;
      } else if (isRpcError(response)) {
        setEditState((state) => ({
          ...state,
          message: response.errorMessage,
        }));
      }
    }
    return false;
  }, [clientSideEditValidationCheck, editState, onEdit, type]);

  const handleKeyDown = useCallback(
    async (evt: KeyboardEvent<HTMLElement>) => {
      const { key, target } = evt;
      // console.log(`[useEditableText] handleKeyDown`);
      const input = target as HTMLInputElement;
      if (key === "Enter") {
        // console.log(
        //   `[useEditableText] ENTER isEditing ? ${isEditingRef.current}, isDirty ${isDirtyRef.current}`,
        // );
        if (isEditingRef.current) {
          if (isDirtyRef.current) {
            // console.log("    ...await commit");
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
          // console.log(
          //   `[useEditableText] handleKeydown, arrowkey whilst editing, stop propagation`,
          // );
          evt.stopPropagation();
        } else {
          // console.log(
          //   `[useEditableText] handleKeydown, arrowkey, not editing so let it bubble`,
          // );
          // evt.preventDefault();
        }
      } else if (evt.key === "Escape") {
        if (isEditingRef.current) {
          // console.log(
          //   `[useEditableText] ESC whilst editing, dirty ? ${isDirtyRef.current}`,
          // );
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
      } /* else if (isEditingRef.current === false && isCharacterKey(key)) {
        isEditingRef.current = true;
        dispatchCustomEvent(evt.target as HTMLElement, "vuu-enter-edit-mode");
      }*/
    },
    [commit, editState, onEdit],
  );

  const beginEditHandler = useCallback((evt: Event) => {
    // console.log("begin edit handler");
    isEditingRef.current = true;
    dispatchCustomEvent(evt.target as HTMLElement, "vuu-enter-edit-mode");
  }, []);

  const handleFocus = useCallback<FocusEventHandler<HTMLElement>>(
    (e) => {
      console.log(`[useEditableText] handleFocus`);
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
      const typedValue = getTypedValue(value, type, true);
      // console.log(
      //   `[useEditableText] handleChange '${value}' typedValue ${typedValue}
      //     initial value ${initialValueRef.current}
      //   `,
      // );
      isDirtyRef.current = value !== initialValueRef.current;
      const result = clientSideEditValidationCheck?.(value, "change");
      setEditState({ value });

      onEdit?.(
        {
          editType: "change",
          isValid: result?.ok !== false,
          value: typedValue,
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
    [clientSideEditValidationCheck, onEdit, type],
  );

  return {
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
