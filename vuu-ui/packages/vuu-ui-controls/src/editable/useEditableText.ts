import { VuuColumnDataType } from "packages/vuu-protocol-types";
import {
  FormEventHandler,
  KeyboardEvent,
  useCallback,
  useRef,
  useState,
} from "react";

export interface EditableTextHookProps<
  T extends VuuColumnDataType = VuuColumnDataType
> {
  initialValue: T;
  onCommit: (value: T) => boolean;
}

const dispatchCommitEvent = (el: HTMLInputElement) => {
  const commitEvent = new Event("vuu-commit");
  el.dispatchEvent(commitEvent);
};

export const useEditableText = <
  T extends VuuColumnDataType = VuuColumnDataType
>({
  initialValue,
  onCommit,
}: EditableTextHookProps<T>) => {
  const [value, setValue] = useState(initialValue);
  const initialValueRef = useRef<T>(initialValue);
  const isDirtyRef = useRef(false);

  const handleKeyDown = useCallback(
    (evt: KeyboardEvent<HTMLElement>) => {
      if (evt.key === "Enter") {
        evt.stopPropagation();
        if (isDirtyRef.current) {
          // if we want to potentially await server ACK here, need async
          if (onCommit(value)) {
            isDirtyRef.current = false;
            dispatchCommitEvent(evt.target as HTMLInputElement);
          }
        } else {
          dispatchCommitEvent(evt.target as HTMLInputElement);
        }
      } else if (evt.key === "ArrowRight" || evt.key === "ArrowLeft") {
        evt.stopPropagation();
      } else if (evt.key === "Escape") {
        if (isDirtyRef.current) {
          isDirtyRef.current = false;
          setValue(initialValueRef.current);
        }
      }
    },
    [onCommit, value]
  );

  const handleChange = useCallback<FormEventHandler>((evt) => {
    const { value } = evt.target as HTMLInputElement;
    isDirtyRef.current = value !== initialValueRef.current;
    setValue(value as T);
  }, []);

  return {
    onChange: handleChange,
    onKeyDown: handleKeyDown,
    value,
  };
};
