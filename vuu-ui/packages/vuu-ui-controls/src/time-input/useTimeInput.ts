import {
  type CommitHandler,
  DateStringISO,
  isValidTimeString,
  isValidTimeStringMillis,
  type TimeString,
  type TimeStringMillis,
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
  useRef,
} from "react";
import { Digit, MaskedInput, TimeValue } from "./MaskedInput";

const isDigit = (char: string): char is Digit =>
  char.length === 1 && /[0-9]/.test(char);

interface TimeInputCommonProps {
  date?: Date | DateStringISO;
  onChange?: ChangeEventHandler<HTMLInputElement>;
}

export interface TimeInputSecondsProps extends TimeInputCommonProps {
  defaultValue?: TimeString;
  /**
   * When true, time is entered and displayed with millisecond
   * precision, hh:mm:ss.SSS
   */
  milliseconds?: false;
  onCommit: CommitHandler<HTMLInputElement, TimeString>;
  value?: TimeString;
}

export interface TimeInputMillisecondsProps extends TimeInputCommonProps {
  defaultValue?: TimeStringMillis;
  /**
   * When true, time is entered and displayed with millisecond
   * precision, hh:mm:ss.SSS
   */
  milliseconds: true;
  onCommit: CommitHandler<HTMLInputElement, TimeStringMillis>;
  value?: TimeStringMillis;
}

export type TimeInputHookProps =
  TimeInputSecondsProps | TimeInputMillisecondsProps;

export const useTimeInput = ({
  defaultValue,
  milliseconds = false,
  onChange,
  onCommit: onCommitProp,
  value,
}: TimeInputHookProps) => {
  const onCommit = onCommitProp as CommitHandler<HTMLInputElement, TimeValue>;
  const mousedDownRef = useRef(false);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const maskedInputRef = useRef<MaskedInput | undefined>(undefined);
  if (
    maskedInputRef.current === undefined ||
    maskedInputRef.current.milliseconds !== milliseconds
  ) {
    // A change of precision requires a new MaskedInput, current value is retained
    maskedInputRef.current = new MaskedInput(
      value ?? maskedInputRef.current?.value ?? defaultValue,
      null,
      { milliseconds },
    );
    maskedInputRef.current.on("change", (e: ChangeEvent<HTMLInputElement>) => {
      onChangeRef.current?.(e);
    });
  }
  const maskedInput = maskedInputRef.current;

  if (value !== undefined) {
    maskedInput.value = value;
  }

  const setInputEl = useCallback<RefCallback<HTMLInputElement>>(
    (el) => {
      maskedInput.input = el;
    },
    [maskedInput],
  );

  const commitValue = useCallback(
    (evt: React.KeyboardEvent<HTMLInputElement>) => {
      // An empty input (placeholder showing) has no value to commit
      if (evt.currentTarget.value !== "") {
        const { value } = maskedInput;
        if (
          milliseconds
            ? isValidTimeStringMillis(value)
            : isValidTimeString(value)
        ) {
          onCommit(evt, value, "text-input");
        }
      }
    },
    [maskedInput, milliseconds, onCommit],
  );

  const handleKeyDown = useCallback<KeyboardEventHandler<HTMLInputElement>>(
    (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.key === "Tab") {
        // allow paste, copy, select all, browser shortcuts and focus navigation
        return;
      }
      if (e.key === "Backspace") {
        maskedInput.backspace();
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
      } else if (e.key === "Home") {
        maskedInput.selectFirst();
      } else if (e.key === "End") {
        maskedInput.selectLast();
      } else if (e.key === "Enter") {
        commitValue(e);
      } else if (e.key === "Escape") {
        return;
      }
      e.preventDefault();
    },
    [commitValue, maskedInput],
  );

  const handleDoubleClick = useCallback(() => {
    maskedInput.doubleClick();
  }, [maskedInput]);

  const handlePaste = useCallback<ClipboardEventHandler<HTMLInputElement>>(
    (e) => {
      e.preventDefault();
      maskedInput.pasteValue(e.clipboardData.getData("text"));
    },
    [maskedInput],
  );

  const handleFocus = useCallback<FocusEventHandler<HTMLInputElement>>(() => {
    if (mousedDownRef.current) {
      // selection will be handled by mouseUp
      mousedDownRef.current = false;
    } else {
      maskedInput.focus();
    }
  }, [maskedInput]);

  const handleMouseDown = useCallback<MouseEventHandler>(() => {
    mousedDownRef.current = true;
  }, []);

  const handleMouseUp = useCallback<MouseEventHandler<HTMLInputElement>>(
    (e) => {
      e.preventDefault();
      maskedInput.click();
    },
    [maskedInput],
  );

  return {
    inputRef: setInputEl,
    eventHandlers: {
      onBlur: maskedInput.blur,
      onDoubleClick: handleDoubleClick,
      onFocus: handleFocus,
      onKeyDown: handleKeyDown,
      onMouseDown: handleMouseDown,
      onMouseUp: handleMouseUp,
      onPaste: handlePaste,
    },
  };
};
