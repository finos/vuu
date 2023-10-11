import { VuuColumnDataType } from "@finos/vuu-protocol-types";
import {
  FormEventHandler,
  KeyboardEvent,
  useCallback,
  useRef,
  useState,
} from "react";
import { ClientSideValidationChecker } from "./editable-utils";

export interface EditableTextHookProps<
  T extends VuuColumnDataType = VuuColumnDataType
> {
  clientSideEditValidationCheck?: ClientSideValidationChecker;
  initialValue: T;
  onCommit: (value: T) => boolean;
}

export const dispatchCommitEvent = (el: HTMLElement) => {
  const commitEvent = new Event("vuu-commit");
  el.dispatchEvent(commitEvent);
};

export const useEditableText = <
  T extends VuuColumnDataType = VuuColumnDataType
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

  const handleBlur = useCallback(() => {
    console.log("blur");
  }, []);

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
            // if we want to potentially await server ACK here, need async
            if (onCommit(value)) {
              isDirtyRef.current = false;
              dispatchCommitEvent(evt.target as HTMLInputElement);
            }
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
      console.log(`value changes to ${value} message ${message}`);
      if (hasCommittedRef.current) {
        const warningMessage = clientSideEditValidationCheck?.(value);
        console.log({ warningMessage });
        if (warningMessage !== message && warningMessage !== false) {
          setMessage(warningMessage);
        }
      }
    },
    [clientSideEditValidationCheck, message]
  );

  return {
    onBlur: handleBlur,
    onChange: handleChange,
    onKeyDown: handleKeyDown,
    value,
    warningMessage: message,
  };
};
