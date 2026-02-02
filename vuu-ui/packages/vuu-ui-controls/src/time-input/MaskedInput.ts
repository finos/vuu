import {
  createSyntheticEvent,
  decrementTimeUnitValue,
  EventEmitter,
  Hours,
  incrementTimeUnitValue,
  isValidTimeString,
  Minutes,
  Seconds,
  TimeString,
  TimeUnit,
  TimeUnitValue,
  updateTimeString,
  zeroTime,
  zeroTimeUnit,
} from "@vuu-ui/vuu-utils";
import { ChangeEventHandler } from "react";

export type Digit = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";

type NullSelection = {
  end: null;
  start: null;
};
type Selection =
  | {
      end: number;
      start: number;
    }
  | NullSelection;

const NullSelection: NullSelection = { end: null, start: null };
const FullSelection: Selection = { end: 0, start: 8 };
const CursorAtEnd: Selection = { end: 8, start: 8 };

export type MaskedInputEvents = {
  change: ChangeEventHandler<HTMLInputElement>;
};

export class MaskedInput extends EventEmitter<MaskedInputEvents> {
  #controlled = false;
  #input: HTMLInputElement | null = null;
  #isFocused = false;
  #isIncrementalChange = false;
  #selectionStart = -1;
  #selectionEnd = -1;
  #value;
  #unitSelected?: TimeUnit;
  #halfUnitSelected?: TimeUnit;

  constructor(
    defaultValue: TimeString | undefined,
    inputEl: HTMLInputElement | null = null,
  ) {
    super();
    if (inputEl) {
      this.input = inputEl;
    }
    this.#value = defaultValue ?? zeroTime;
  }

  set input(el: HTMLInputElement) {
    if (this.#input) {
      throw Error(
        "MaskedInput cannot be reused, create a new instance for a new input",
      );
    }
    this.#input = el;
    el.addEventListener("change", this.emitSyntheticChangeEvent);
  }

  /**
   * The change event is fired programatically. This will only be handled
   * by a native event handler ( not a React handler). We handle this event
   * and convert to a React (Synthetic) event.
   */
  private emitSyntheticChangeEvent = (e: Event) => {
    const syntheticEvent = createSyntheticEvent(
      e,
    ) as React.ChangeEvent<HTMLInputElement>;

    this.emit("change", syntheticEvent);
  };

  get cursorPos() {
    return this.selectionStart;
  }
  set cursorPos(value: number) {
    this.selectionStart = value;
    this.selectionEnd = value;
    if (this.#input) {
      this.#input.setSelectionRange(value, value);
    }
  }

  get isFocused() {
    return this.#isFocused;
  }

  get selectionStart() {
    return this.#selectionStart;
  }
  set selectionStart(value: number) {
    this.#selectionStart = value;
  }

  get selectionEnd() {
    return this.#selectionEnd;
  }
  set selectionEnd(value: number) {
    this.#selectionEnd = value;
  }

  private setValue(value: TimeString) {
    if (!this.#controlled) {
      this.#isIncrementalChange = false;
      this.#value = value;
    }

    if (this.#input) {
      // HM this updateds the input value, even if we are controlled.
      // Thats not right, but if we don't update it, the event will
      // not carry thwe right value. I don;t thibnk we can simulate
      // the correct behaviour
      this.#input.value = value;
      // this triggers the native change event, which we convert
      // // to synthetic event and emit in input setter above
      this.#input.dispatchEvent(
        new Event("change", {
          bubbles: true,
          composed: true,
        }),
      );
    }
  }

  private setUnitValue(unit: TimeUnit, value: Hours | Minutes | Seconds) {
    const newTimeString = updateTimeString(this.#value, unit, value);
    this.setValue(newTimeString);
  }

  private getUnitValue<T extends TimeUnit>(unit: T): TimeUnitValue<T> {
    switch (unit) {
      case "hours":
        return this.#value.slice(0, 2) as TimeUnitValue<T>;
      case "minutes":
        return this.#value.slice(3, 5) as TimeUnitValue<T>;
      case "seconds":
        return this.#value.slice(6, 8) as TimeUnitValue<T>;
      default:
        throw Error(`[MaskedInout] invalue unit ${unit}`);
    }
  }

  get value() {
    return this.#value;
  }

  /**
   * Setting the value this way invokes 'controlled' mode
   */
  set value(value: TimeString) {
    this.#controlled = true;
    this.#value = value;
    if (this.isFocused) {
      const isIncremental = this.#isIncrementalChange;
      this.#isIncrementalChange = false;

      requestAnimationFrame(() => {
        if (isIncremental) {
          this.restoreSelection();
        } else {
          this.advanceSelection();
        }
      });
    }
  }

  clear(unit: TimeUnit) {
    if (this.#input) {
      let newValue = this.#value;
      if (unit === "hours") {
        newValue = zeroTimeUnit.concat(this.#value.slice(2)) as TimeString;
      } else if (unit === "minutes") {
        newValue = this.#value
          .slice(0, 3)
          .concat(zeroTimeUnit)
          .concat(this.#value.slice(5)) as TimeString;
      } else if (unit === "seconds") {
        newValue = this.#value.slice(0, 6).concat(zeroTimeUnit) as TimeString;
      }
      if (newValue !== this.#value) {
        this.setValue(newValue);
      }
    }
  }

  select(unit: TimeUnit, halfUnit = false) {
    if (this.#input) {
      const offset = halfUnit ? 1 : 0;
      if (unit === "hours") {
        this.selectionStart = this.#input.selectionStart = 0 + offset;
        this.selectionEnd = this.#input.selectionEnd = 2;
      } else if (unit === "minutes") {
        this.selectionStart = this.#input.selectionStart = 3 + offset;
        this.selectionEnd = this.#input.selectionEnd = 5;
      } else if (unit === "seconds") {
        this.selectionStart = this.#input.selectionStart = 6 + offset;
        this.selectionEnd = this.#input.selectionEnd = 8;
      }
      this.#input.setSelectionRange(this.selectionStart, this.selectionEnd);
      if (halfUnit) {
        this.#halfUnitSelected = unit;
        this.#unitSelected = undefined;
      } else {
        this.#halfUnitSelected = undefined;
        this.#unitSelected = unit;
      }
    }
  }

  removeSelection() {
    this.#selectionStart = this.selectionEnd = 8;
    this.#unitSelected = undefined;
    this.#halfUnitSelected = undefined;
  }

  restoreSelection() {
    if (this.#unitSelected) {
      this.select(this.#unitSelected);
    }
  }

  advanceSelection() {
    if (this.#unitSelected) {
      this.select(this.#unitSelected, true);
    } else if (this.#halfUnitSelected === "hours") {
      this.select("minutes");
    } else if (this.#halfUnitSelected === "minutes") {
      this.select("seconds");
    } else if (this.#halfUnitSelected === "seconds") {
      this.select("seconds");
    } else {
      throw Error("unreachable code, in theory");
    }
  }

  moveFocus(direction: "left" | "right") {
    if (direction === "right") {
      if (
        this.#unitSelected === "hours" ||
        this.#halfUnitSelected === "hours"
      ) {
        this.select("minutes");
      } else if (
        this.#unitSelected === "minutes" ||
        this.#halfUnitSelected === "minutes"
      ) {
        this.select("seconds");
      } else if (
        this.#unitSelected === "seconds" ||
        this.#halfUnitSelected === "seconds"
      ) {
        // Already at the rightmost field, stay at seconds
        this.select("seconds");
      }
    } else {
      if (
        this.#unitSelected === "seconds" ||
        this.#halfUnitSelected === "seconds"
      ) {
        this.select("minutes");
      } else if (
        this.#unitSelected === "minutes" ||
        this.#halfUnitSelected === "minutes"
      ) {
        this.select("hours");
      } else if (
        this.#unitSelected === "hours" ||
        this.#halfUnitSelected === "hours"
      ) {
        // Already at the leftmost field, stay at hours
        this.select("hours");
      } else {
        const selection = this.getSelection();
        if (selection === CursorAtEnd) {
          this.select("seconds");
        }
      }
    }
  }

  pasteValue(value: TimeString) {
    this.#halfUnitSelected = undefined;
    this.#unitSelected = undefined;
    this.#value = value;
  }

  private getUnitAtCursorPos(cursorPos = this.cursorPos): TimeUnit {
    if (cursorPos >= 0 && cursorPos < 3) {
      return "hours";
    } else if (cursorPos < 6) {
      return "minutes";
    } else if (cursorPos <= 8) {
      return "seconds";
    } else {
      throw Error(
        `[MaskedInput] getUnitAtCursorPos invalid cursor position ${cursorPos}`,
      );
    }
  }

  incrementValue() {
    if (this.#input) {
      this.#isIncrementalChange = true;
      const unit = this.getUnitAtCursorPos();
      const unitValue = this.getUnitValue(unit);
      const newUnitValue = incrementTimeUnitValue(unit, unitValue);
      this.setUnitValue(unit, newUnitValue);
      this.select(unit);
    }
  }

  decrementValue() {
    if (this.#input) {
      this.#isIncrementalChange = true;
      const unit = this.getUnitAtCursorPos();
      const unitValue = this.getUnitValue(unit);
      const newUnitValue = decrementTimeUnitValue(unit, unitValue);
      this.setUnitValue(unit, newUnitValue);
      this.select(unit);
    }
  }

  backspace() {
    if (this.#input) {
      const { cursorPos } = this;

      if (this.#unitSelected === "seconds") {
        this.clear("seconds");
        this.select("minutes");
      } else if (this.#unitSelected === "minutes") {
        this.clear("minutes");
        this.select("hours");
      } else if (this.#unitSelected === "hours") {
        this.clear("hours");
        this.select("hours");
      } else {
        if (cursorPos > 0) {
          const offset =
            this.selectionStart === 6 || this.selectionStart === 3 ? 2 : 1;
          const newValue = this.#value
            .slice(0, cursorPos - offset)
            .concat(zeroTime.slice(cursorPos - offset, cursorPos))
            .concat(this.#value.slice(cursorPos)) as TimeString;
          this.selectionStart -= offset;
          this.selectionEnd -= offset;
          this.setValue(newValue);

          requestAnimationFrame(() => {
            this.#input?.setSelectionRange(
              this.#selectionStart,
              this.selectionEnd,
            );
          });
        }
      }
    }
  }

  update(key: Digit) {
    if (this.#input) {
      const { cursorPos } = this;
      if (cursorPos < 8) {
        const originalValue = this.#value;
        const newValue = this.#value
          .split("")
          .toSpliced(cursorPos, 1, key)
          .join("") as TimeString;

        this.setValue(newValue);

        if (!isValidTimeString(newValue)) {
          if (this.#unitSelected) {
            this.select(this.#unitSelected);
            this.#input.classList.add("invalid");
          }
        } else {
          this.#input.classList.remove("invalid");

          if (this.#controlled && newValue === originalValue) {
            // Special case - user has overtyped a digit with same digit,
            // value has not changed, so will not be set, which would normally
            // trigger advance in controlled mode. Advance so next digit
            // typed will be in correct position
            this.advanceSelection();
          } else if (!this.#controlled) {
            this.advanceSelection();
          }
        }
      }
    }
  }

  private getSelection(): Selection {
    if (this.#input) {
      const { selectionEnd, selectionStart } = this.#input;
      if (selectionEnd === null || selectionStart === null) {
        return NullSelection;
      } else if (selectionStart === 0 && selectionEnd === 8) {
        return FullSelection;
      } else if (selectionStart === 8 && selectionEnd === 8) {
        return CursorAtEnd;
      } else {
        return {
          end: selectionEnd,
          start: selectionStart,
        };
      }
    } else {
      throw Error(`[MasketInput] selection referenced, but no input`);
    }
  }

  click() {
    if (this.#input) {
      this.#isFocused = true;
      const selection = this.getSelection();
      if (selection === NullSelection) {
        this.select("hours");
      } else if (selection === FullSelection) {
        // do nothing
      } else {
        const cursorPos = this.#input.selectionStart ?? 0;
        this.select(this.getUnitAtCursorPos(cursorPos));
      }
    }
  }
  doubleClick() {
    if (this.#input) {
      const { selectionStart, selectionEnd } = this.#input;
      if (selectionStart === null || selectionEnd === null) {
        // do nothing
      } else {
        if (selectionStart < 3) {
          this.select("hours");
        } else if (selectionStart < 6) {
          this.select("minutes");
        } else if (selectionStart <= 8) {
          this.select("seconds");
        }
      }
    }
    // }
  }

  focus = () => {
    if (this.#input) {
      this.#isFocused = true;

      requestAnimationFrame(() => {
        this.select("hours");
      });
    }
  };

  blur = () => {
    this.removeSelection();
    this.#isFocused = false;
  };
}
