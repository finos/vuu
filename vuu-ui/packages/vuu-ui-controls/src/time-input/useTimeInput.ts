import {
  type CommitHandler,
  DateStringISO,
  isValidTimeString,
  Time,
  type TimeString,
} from "@vuu-ui/vuu-utils";
import {
  ChangeEventHandler,
  ClipboardEventHandler,
  KeyboardEventHandler,
  MouseEventHandler,
  RefCallback,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { Digit, MaskedInput } from "./MaskedInput";

const isDigit = (char: string): char is Digit =>
  char.length === 1 && /[0-9]/.test(char);

export interface TimeInputHookProps {
  date?: Date | DateStringISO;
  defaultValue?: TimeString;
  onChange?: (time: TimeString) => void;
  onCommit: CommitHandler<HTMLInputElement, Date>;
  value?: TimeString;
}

export const useTimeInput = ({
  defaultValue,
  onChange,
  onCommit,
  value,
}: TimeInputHookProps) => {
  console.log(`useTimeInput defaultValue = ${defaultValue} value=${value}`);
  const mousedDownRef = useRef(false);
  const maskedInputRef = useRef<MaskedInput | undefined>(undefined);
  useMemo(() => {
    if (maskedInputRef.current === undefined) {
      maskedInputRef.current = new MaskedInput(defaultValue, null);
      maskedInputRef.current.on("change", (value) => {
        onChange?.(value);
      });
    }

    if (isValidTimeString(value) && value !== maskedInputRef.current?.value) {
      maskedInputRef.current.value = value;
    }
  }, [defaultValue, onChange, value]);

  const setInputEl = useCallback<RefCallback<HTMLInputElement>>((el) => {
    if (el && maskedInputRef.current) {
      maskedInputRef.current.input = el;
    }
  }, []);
  const back = useRef(false);

  const commitValue = useCallback<CommitHandler<HTMLInputElement, string>>(
    (evt, value) => {
      if (isValidTimeString(value)) {
        onCommit(evt, Time(value).asDate(), "text-input");
      } else if (value === "hh:mm:ss") {
        console.log("no value set");
        // onCommit(evt, Boolean(value), "text-input");
      } else {
        console.log(`value is not valid`);
        // onCommit(evt, value, "text-input");
      }
    },
    [onCommit],
  );

  const handleKeyDown = useCallback<KeyboardEventHandler<HTMLInputElement>>(
    (e) => {
      const { current: maskedInput } = maskedInputRef;
      if (maskedInput) {
        if (e.key === "Backspace") {
          maskedInput.backspace();
          back.current = true;
        } else if (isDigit(e.key)) {
          maskedInput.update(e.key);
        } else if (e.key === "ArrowLeft") {
          maskedInput.moveFocus("left");
        } else if (e.key === "ArrowRight") {
          maskedInput.moveFocus("right");
        } else if (e.key === "ArrowUp") {
          maskedInput.incrementValue();
        } else if (e.key === "ArrowDown") {
          maskedInput.decrementValue();
        } else if (e.key === "v" && e.metaKey) {
          // keyboard paste, do not prevent default
          return;
        } else if (e.key === "Tab") {
          return;
        } else if (e.key === "Enter") {
          commitValue(e, maskedInput.value);
        }
      }
      e.preventDefault();
    },
    [commitValue],
  );

  const handleClick = useCallback(() => {
    // maskedInput.click();
  }, []);

  const handleDoubleClick = useCallback(() => {
    maskedInputRef.current?.doubleClick();
  }, []);

  const handlePaste = useCallback<ClipboardEventHandler<HTMLInputElement>>(
    (e) => {
      const value = e.clipboardData.getData("text");
      if (isValidTimeString(value)) {
        maskedInputRef.current?.pasteValue(value);
      }
    },
    [],
  );

  const handleChange = useCallback<ChangeEventHandler<HTMLInputElement>>(
    (e) => {
      console.log(`onchange ${e.target.value}`);
    },
    [],
  );

  const handleFocus = useCallback(() => {
    if (mousedDownRef.current) {
      mousedDownRef.current = false;
    } else {
      maskedInputRef.current?.focus();
    }
  }, []);

  const handleMouseDown = useCallback<MouseEventHandler>((e) => {
    mousedDownRef.current = true;
    const input = e.target as HTMLInputElement;
    console.log(
      `mousedown start ${input.selectionStart} end ${input.selectionEnd}`,
    );
  }, []);

  const handleMouseUp = useCallback<MouseEventHandler<HTMLInputElement>>(
    (e) => {
      console.log(`mouseup`);
      const input = e.target as HTMLInputElement;
      console.log(
        `mouseup start ${input.selectionStart} end ${input.selectionEnd}`,
      );
      if (input.selectionStart === 0 && input.selectionEnd === 8) {
        console.log("full select");
      }
      maskedInputRef.current?.click();
    },
    [],
  );

  return {
    inputRef: setInputEl,
    eventHandlers: {
      onBlur: maskedInputRef.current?.blur,
      onChange: handleChange,
      onClick: handleClick,
      onDoubleClick: handleDoubleClick,
      onFocus: handleFocus,
      onKeyDown: handleKeyDown,
      onMouseDown: handleMouseDown,
      onMouseUp: handleMouseUp,
      onPaste: handlePaste,
    },
  };
};
