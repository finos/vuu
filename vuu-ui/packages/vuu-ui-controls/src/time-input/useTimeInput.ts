import {
  type CommitHandler,
  DateStringISO,
  isValidTimeString,
  type TimeString,
} from "@vuu-ui/vuu-utils";
import {
  ChangeEvent,
  ChangeEventHandler,
  ClipboardEventHandler,
  FocusEventHandler,
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
  onChange?: ChangeEventHandler<HTMLInputElement>;
  onCommit: CommitHandler<HTMLInputElement, TimeString>;
  value?: TimeString;
}

export const useTimeInput = ({
  defaultValue,
  onChange,
  onCommit,
  value,
}: TimeInputHookProps) => {
  const mousedDownRef = useRef(false);
  const maskedInputRef = useRef<MaskedInput | undefined>(undefined);
  useMemo(() => {
    if (maskedInputRef.current === undefined) {
      maskedInputRef.current = new MaskedInput(defaultValue, null);
      maskedInputRef.current.on(
        "change",
        (e: ChangeEvent<HTMLInputElement>) => {
          onChange?.(e);
        },
      );
    }

    if (value && value !== maskedInputRef.current.value) {
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
        onCommit(evt, value, "text-input");
      } else if (value === "hh:mm:ss") {
        console.log("no value set");
      } else {
        console.log(`value is not valid`);
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

  const handleFocus = useCallback<FocusEventHandler<HTMLInputElement>>(() => {
    // If keboard has been used, how do we detect SHIFT + TAB
    if (mousedDownRef.current) {
      mousedDownRef.current = false;
    } else {
      maskedInputRef.current?.focus();
    }
  }, []);

  const handleMouseDown = useCallback<MouseEventHandler>(() => {
    mousedDownRef.current = true;
  }, []);

  const handleMouseUp = useCallback<MouseEventHandler<HTMLInputElement>>(
    (e) => {
      e.preventDefault();
      maskedInputRef.current?.click();
    },
    [],
  );

  return {
    inputRef: setInputEl,
    eventHandlers: {
      onBlur: maskedInputRef.current?.blur,
      onDoubleClick: handleDoubleClick,
      onFocus: handleFocus,
      onKeyDown: handleKeyDown,
      onMouseDown: handleMouseDown,
      onMouseUp: handleMouseUp,
      onPaste: handlePaste,
    },
  };
};
