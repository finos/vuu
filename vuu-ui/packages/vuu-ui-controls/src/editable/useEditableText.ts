import { VuuRowDataItemType } from "@finos/vuu-protocol-types";
import { DataItemCommitHandler } from "packages/vuu-datagrid-types";
import {
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
  initialValue: T;
  onCommit: DataItemCommitHandler;
}

export const dispatchCommitEvent = (el: HTMLElement) => {
  const commitEvent = new Event("vuu-commit");
  el.dispatchEvent(commitEvent);
};

export const useEditableText = <
  T extends VuuRowDataItemType = VuuRowDataItemType
>({
  clientSideEditValidationCheck,
  initialValue,
  onCommit,
}: EditableTextHookProps<T>) => {
  const [message, setMessage] = useState<string | undefined>();
  const [value, setValue] = useState(initialValue);
  const initialValueRef = useRef<T>(initialValue);
  const isDirtyRef = useRef(false);
  const hasCommittedRef = useRef(false);

  const handleKeyDown = useCallback(
    (evt: KeyboardEvent<HTMLElement>) => {
      if (evt.key === "Enter") {
        evt.stopPropagation();
        if (isDirtyRef.current) {
          hasCommittedRef.current = true;
          const warningMessage = clientSideEditValidationCheck?.(value);
          if (warningMessage) {
            setMessage(warningMessage);
          } else {
            setMessage(undefined);
            onCommit(value).then((response) => {
              if (response === true) {
                isDirtyRef.current = false;
                dispatchCommitEvent(evt.target as HTMLInputElement);
              } else {
                setMessage(response);
              }
            });
          }
        } else {
          dispatchCommitEvent(evt.target as HTMLInputElement);
          hasCommittedRef.current = false;
        }
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
    [clientSideEditValidationCheck, onCommit, value]
  );

  const handleChange = useCallback<FormEventHandler>(
    (evt) => {
      const { value } = evt.target as HTMLInputElement;
      isDirtyRef.current = value !== initialValueRef.current;
      setValue(value as T);
      if (hasCommittedRef.current) {
        const warningMessage = clientSideEditValidationCheck?.(value);
        if (warningMessage !== message && warningMessage !== false) {
          setMessage(warningMessage);
        }
      }
    },
    [clientSideEditValidationCheck, message]
  );

  return {
    onChange: handleChange,
    onKeyDown: handleKeyDown,
    value,
    warningMessage: message,
  };
};
