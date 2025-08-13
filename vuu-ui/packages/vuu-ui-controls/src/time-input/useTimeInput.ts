import { CommitHandler, DateStringISO, TimeString } from "@vuu-ui/vuu-utils";
import {
  ClipboardEventHandler,
  KeyboardEventHandler,
  RefCallback,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { Digit, MaskedInput } from "./MaskedInput";
import { stringIsValidTime, Time } from "@vuu-ui/vuu-utils";

const isDigit = (char: string): char is Digit =>
  char.length === 1 && /[0-9]/.test(char);

export interface TimeInputHookProps {
  date?: Date | DateStringISO;
  defaultValue?: TimeString;
  onCommit: CommitHandler<HTMLInputElement, Date>;
  showTemplateWhileEditing?: boolean;
}

export const useTimeInput = ({
  defaultValue,
  onCommit,
  showTemplateWhileEditing = true,
}: TimeInputHookProps) => {
  const maskedInput = useMemo<MaskedInput>(
    () => new MaskedInput(defaultValue, null, showTemplateWhileEditing),
    [defaultValue, showTemplateWhileEditing],
  );

  const setInputEl = useCallback<RefCallback<HTMLInputElement>>(
    (el) => {
      if (el) {
        maskedInput.input = el;
      }
    },
    [maskedInput],
  );
  const back = useRef(false);

  const commitValue = useCallback<CommitHandler<HTMLInputElement, string>>(
    (evt, value) => {
      if (stringIsValidTime(value)) {
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
      console.log(`handleKeyDown ${e.key} cursorPos ${maskedInput.cursorPos}`);
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
      e.preventDefault();
    },
    [commitValue, maskedInput],
  );

  const handleClick = useCallback(() => {
    maskedInput.click();
  }, [maskedInput]);

  const handleDoubleClick = useCallback(() => {
    maskedInput.doubleClick();
  }, [maskedInput]);

  const handlePaste = useCallback<ClipboardEventHandler<HTMLInputElement>>(
    (e) => {
      console.log(`paste ${e.clipboardData.getData("text")}`);
    },
    [],
  );

  // const handleMouseUp = useCallback<MouseEventHandler<HTMLInputElement>>(
  //   (e) => {
  //     const input = e.target as HTMLInputElement;
  //     console.log(
  //       `mouseup sytart ${input.selectionStart} end ${input.selectionEnd}`,
  //     );
  //     if (input.selectionStart === 0 && input.selectionEnd === 8) {
  //       console.log("full select");
  //     }
  //   },
  //   [],
  // );

  return {
    inputRef: setInputEl,
    eventHandlers: {
      onBlur: maskedInput.blur,
      onClick: handleClick,
      onDoubleClick: handleDoubleClick,
      onFocus: maskedInput.focus,
      onKeyDown: handleKeyDown,
      // onMouseUp: handleMouseUp,
      onPaste: handlePaste,
    },
  };
};
