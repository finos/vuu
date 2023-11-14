import { VuuRowDataItemType } from "@finos/vuu-protocol-types";
import { DataItemCommitHandler } from "@finos/vuu-datagrid-types";
import { useLayoutEffectSkipFirst } from "@finos/vuu-layout";
import {
  FocusEventHandler,
  FormEventHandler,
  KeyboardEvent,
  useCallback,
  useRef,
  useState,
} from "react";
import { ClientSideValidationChecker } from "./editable-utils";

export const WarnCommit = (): Promise<true> => {
  console.warn(
    "onCommit handler has not been provided to InputCell cell renderer"
  );
  return Promise.resolve(true);
};

export interface EditableTextHookProps<
  T extends VuuRowDataItemType = VuuRowDataItemType
> {
  clientSideEditValidationCheck?: ClientSideValidationChecker;
  initialValue?: T;
  onCommit: DataItemCommitHandler<T>;
  type?: "string" | "number" | "boolean";
}

export const dispatchCommitEvent = (el: HTMLElement) => {
  const commitEvent = new Event("vuu-commit");
  el.dispatchEvent(commitEvent);
};

export const useEditableText = <T extends string | number = string>({
  clientSideEditValidationCheck,
  initialValue,
  onCommit,
  type,
}: EditableTextHookProps<T>) => {
  const [message, setMessage] = useState<string | undefined>();
  const [value, setValue] = useState<T | undefined>(initialValue);
  const initialValueRef = useRef<T | undefined>(initialValue);
  const isDirtyRef = useRef(false);
  const hasCommittedRef = useRef(false);

  useLayoutEffectSkipFirst(() => {
    //TODO this isn't right, review the state we're using
    setValue(initialValue);
  }, [initialValue]);

  const commit = useCallback(
    (target: HTMLElement) => {
      if (isDirtyRef.current) {
        hasCommittedRef.current = true;
        const warningMessage = clientSideEditValidationCheck?.(value);
        if (warningMessage) {
          setMessage(warningMessage);
        } else {
          setMessage(undefined);
          onCommit(value as T).then((response) => {
            if (response === true) {
              isDirtyRef.current = false;
              dispatchCommitEvent(target);
            } else {
              setMessage(response);
            }
          });
        }
      } else {
        // why, if not dirty ?
        dispatchCommitEvent(target);
        hasCommittedRef.current = false;
      }
    },
    [clientSideEditValidationCheck, onCommit, value]
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
          isDirtyRef.current = false;
          setMessage(undefined);
          setValue(initialValueRef.current);
        }
      }
    },
    [commit]
  );

  const handleBlur = useCallback<FocusEventHandler<HTMLElement>>(
    (evt) => {
      commit(evt.target as HTMLElement);
    },
    [commit]
  );

  const handleChange = useCallback<FormEventHandler>(
    (evt) => {
      let typedValue: VuuRowDataItemType = (evt.target as HTMLInputElement)
        .value;
      if (type === "number" && !isNaN(parseFloat(typedValue))) {
        typedValue = parseFloat(typedValue);
      }
      isDirtyRef.current = value !== initialValueRef.current;
      setValue(typedValue as T);
      if (hasCommittedRef.current && value !== undefined) {
        const warningMessage = clientSideEditValidationCheck?.(value);
        if (warningMessage !== message && warningMessage !== false) {
          setMessage(warningMessage);
        }
      }
    },
    [clientSideEditValidationCheck, message, type, value]
  );

  return {
    inputProps: {
      onBlur: handleBlur,
      onKeyDown: handleKeyDown,
    },
    onChange: handleChange,
    value: value ?? "",
    warningMessage: message,
  };
};
