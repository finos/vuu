import { DataValueValidationChecker } from "@finos/vuu-data-types";
import { VuuRowDataItemType } from "@finos/vuu-protocol-types";
import { DataItemEditHandler } from "@finos/vuu-table-types";
import { dispatchCustomEvent, getTypedValue } from "@finos/vuu-utils";
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
  onEdit?: DataItemEditHandler;
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
  // console.log("initial value: ", initialValue);
  const [editState, setEditState] = useState<EditState>({
    value: stringValueOf(value),
  });
  // console.log("edit state: ", editState);
  const initialValueRef = useRef<string>(value?.toString() ?? "");
  const isDirtyRef = useRef(false);

  useMemo(() => {
    if (initialValueRef.current !== value?.toString()) {
      initialValueRef.current = stringValueOf(value);
      setEditState({ message: "", value: stringValueOf(value) });
      console.log("initial value changed to: ", value);
    }
  }, [value]);

  const commit = useCallback(
    async (target: HTMLElement) => {
      const { value } = editState;
      if (isDirtyRef.current) {
        const result = clientSideEditValidationCheck?.(value, "*");
        if (result?.ok === false) {
          setEditState((state) => ({
            ...state,
            message: result?.messages?.join(","),
          }));
        } else {
          setEditState((state) => ({ ...state, message: undefined }));
          const response = await onEdit?.(
            { editType: "commit", value, isValid: true },
            "commit",
          );
          if (response === true) {
            isDirtyRef.current = false;
            initialValueRef.current = value;
            dispatchCustomEvent(target, "vuu-commit");
          } else if (typeof response === "string") {
            setEditState((state) => ({ ...state, message: response }));
          }
        }
      } else {
        // why, if not dirty ?
        dispatchCustomEvent(target, "vuu-commit");
      }
    },
    [clientSideEditValidationCheck, editState, onEdit],
  );

  const handleKeyDown = useCallback(
    (evt: KeyboardEvent<HTMLElement>) => {
      if (evt.key === "Enter") {
        commit(evt.target as HTMLElement);
      } else if (
        evt.key === "ArrowRight" ||
        evt.key === "ArrowLeft" ||
        evt.key === "ArrowUp" ||
        evt.key === "ArrowDown"
      ) {
        evt.stopPropagation();
      } else if (evt.key === "Escape") {
        if (isDirtyRef.current) {
          const { value: previousValue } = editState;
          isDirtyRef.current = false;
          setEditState({ value: initialValueRef.current, message: undefined });
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
      }
    },
    [commit, editState, onEdit],
  );

  const handleBlur = useCallback<FocusEventHandler<HTMLElement>>(
    (evt) => {
      if (isDirtyRef.current) {
        commit(evt.target as HTMLElement);
      }
    },
    [commit],
  );

  const handleChange = useCallback<FormEventHandler>(
    (evt) => {
      const { value } = evt.target as HTMLInputElement;
      const typedValue = getTypedValue(value, type);
      console.log(
        `[useEditableText] handleChange '${value}' typedValue ${typedValue}
          initial value ${initialValueRef.current}
        `,
      );
      isDirtyRef.current = value !== initialValueRef.current;
      const result = clientSideEditValidationCheck?.(value, "change");
      console.log({ result, value });
      setEditState({ value });

      onEdit?.(
        { editType: "change", isValid: result?.ok !== false, value },
        "change",
      );
      if (result?.ok === false) {
        console.log("cell fails validation");
        setEditState({ value, message: result.messages?.join(",") });
      }
    },
    [clientSideEditValidationCheck, onEdit, type],
  );

  return {
    //TODO why are we detecting commit here, why not use VuuInput ?
    inputProps: {
      onBlur: handleBlur,
      onKeyDown: handleKeyDown,
    },
    onChange: handleChange,
    value: editState.value,
    warningMessage: editState.message,
  };
};
