import {
  decrementTimeUnitValue,
  EventEmitter,
  Hours,
  incrementTimeUnitValue,
  Minutes,
  Seconds,
  TimeString,
  TimeUnit,
  TimeUnitValue,
  updateTimeString,
  zeroTime,
  zeroTimeUnit,
} from "@vuu-ui/vuu-utils";

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
  change: (value: TimeString) => void;
};

export class MaskedInput extends EventEmitter<MaskedInputEvents> {
  #controlled = false;
  #input: HTMLInputElement | null;
  #pattern = "hh:mm:ss";
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
    this.#input = inputEl;
    this.#value = defaultValue ?? zeroTime;
  }

  set input(el: HTMLInputElement) {
    this.#input = el;
  }

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
      this.#value = value;
      if (this.#input) {
        this.#input.value = value;
      }
    }
    this.emit("change", value);
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

  get hours() {
    return this.#value.slice(0, 2) as Hours;
  }

  get minutes() {
    return this.#value.slice(3, 5) as Minutes;
  }

  get seconds() {
    return this.#value.slice(6, 8) as Seconds;
  }

  get value() {
    return this.#value;
  }

  /**
   * Setting the value this way invokes 'controlled' mode
   */
  set value(value: TimeString) {
    console.log(`set controlled value ${value}`);
    this.#controlled = true;
    this.#value = value;
    requestAnimationFrame(() => {
      this.restoreSelection();
    });
  }

  clear(unit: TimeUnit) {
    if (this.#input) {
      if (unit === "hours") {
        this.#value = zeroTimeUnit.concat(this.#value.slice(2)) as TimeString;
      } else if (unit === "minutes") {
        this.#value = this.#value
          .slice(0, 3)
          .concat(zeroTimeUnit)
          .concat(this.#value.slice(5)) as TimeString;
      } else if (unit === "seconds") {
        this.#value = this.#value
          .slice(0, 6)
          .concat(zeroTimeUnit) as TimeString;
      }
      this.#input.value = this.#value;
      this.emit("change", this.#value as TimeString);
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

  moveFocus(direction: "left" | "right") {
    console.log(`move focus ${direction} selected ${this.#unitSelected}`);
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
      } else {
        const selection = this.getSelection();
        console.log({ selection });
        if (selection === CursorAtEnd) {
          console.log("cursor at end");
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
      const unit = this.getUnitAtCursorPos();
      const unitValue = this.getUnitValue(unit);
      const newUnitValue = incrementTimeUnitValue(unit, unitValue);
      this.setUnitValue(unit, newUnitValue);
      this.select(unit);
    }
  }

  decrementValue() {
    if (this.#input) {
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
          //   console.log(`Backspace val = ${this.#value} cursorPos ${cursorPos}`);
          const offset =
            this.selectionStart === 6 || this.selectionStart === 3 ? 2 : 1;
          const newValue = this.#value
            .slice(0, cursorPos - offset)
            .concat(zeroTime.slice(cursorPos - offset, cursorPos))
            .concat(this.#value.slice(cursorPos)) as TimeString;
          this.#value = newValue;
          this.selectionStart -= offset;
          this.selectionEnd -= offset;
          this.#input.value = this.#value;
          this.emit("change", this.#value as TimeString);

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
        const newValue = this.#value
          .split("")
          .toSpliced(cursorPos, 1, key)
          .join("") as TimeString;
        this.#value = newValue;
        this.#input.value = this.#value;
        if (this.#unitSelected) {
          this.select(this.#unitSelected, true);
        } else if (this.#halfUnitSelected === "hours") {
          this.select("minutes");
        } else if (this.#halfUnitSelected === "minutes") {
          this.select("seconds");
        } else if (this.#halfUnitSelected === "seconds") {
          this.select("seconds");
        } else {
          console.log("NEVER HAPPENS");
          if (this.selectionStart === 1 || this.selectionStart === 4) {
            this.selectionStart += 2;
            this.selectionEnd += 2;
          } else {
            this.selectionStart += 1;
            this.selectionEnd += 1;
          }
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
      //   if (this.value !== this.#pattern) {
      const { selectionStart, selectionEnd } = this.#input;
      if (selectionStart === null || selectionEnd === null) {
        // do nothing
        // } else if (selectionStart === selectionEnd) {
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
    console.log("maskefinput focus");
    if (this.#input) {
      // if (this.#value === "") {
      //   if (this.#showTemplateWhileEditing) {
      //     this.#value = this.#input.value = this.#pattern;
      //   } else {
      //     this.#value = this.#input.value = "00:00:00";
      //     this.emit("change", this.value as TimeString);
      //   }
      // }
      requestAnimationFrame(() => {
        this.select("hours");
        setTimeout(() => {
          if (this.#input?.selectionStart !== 0) {
            this.select("hours");
          }
        }, 200);
      });
    }
  };

  blur = () => {
    // if (this.#input && this.#input.value === this.#pattern) {
    //   this.#value = this.#input.value = "";
    //   this.emit("change", this.#value as TimeString);
    // } else {
    this.removeSelection();
    // }
  };
}
