import { EventEmitter, TimeString } from "@vuu-ui/vuu-utils";

type TimeUnit = "hours" | "minutes" | "seconds";
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

const incrementTime = (value: string, unit: TimeUnit) => {
  if (value === "hh" || value == "mm" || value === "ss") {
    return "00";
  } else if (/\d\d/.test(value)) {
    const num = parseInt(value);
    if (unit === "hours" && num < 23) {
      return `${num + 1}`.padStart(2, "0").slice(-2);
    } else if (unit === "hours" && num === 23) {
      return "00";
    } else if (num < 59) {
      return `${num + 1}`.padStart(2, "0").slice(-2);
    } else if (num === 59) {
      return "00";
    }
  }
  return value;
};

const decrementTime = (value: string, unit: TimeUnit) => {
  if (value === "hh" || value == "mm" || value === "ss") {
    return "00";
  } else if (/\d\d/.test(value)) {
    const num = parseInt(value);
    if (unit === "hours" && num > 0) {
      return `${num - 1}`.padStart(2, "0").slice(-2);
    } else if (unit === "hours" && num === 0) {
      return "23";
    } else if (num > 0) {
      return `${num - 1}`.padStart(2, "0").slice(-2);
    } else if (num === 0) {
      return "59";
    }
  }
  return value;
};

export type MaskedInputEvents = {
  change: (value: TimeString) => void;
};

export class MaskedInput extends EventEmitter<MaskedInputEvents> {
  #input: HTMLInputElement | null;
  #pattern = "hh:mm:ss";
  #selectionStart = -1;
  #selectionEnd = -1;
  #showTemplateWhileEditing = true;
  #value;
  #unitSelected?: TimeUnit;
  #halfUnitSelected?: TimeUnit;

  constructor(
    value = "",
    inputEl: HTMLInputElement | null = null,
    showTemplateWhileEditing = true,
  ) {
    super();
    this.#input = inputEl;
    this.#showTemplateWhileEditing = showTemplateWhileEditing;
    this.#value = value;
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

  get hours() {
    return this.#value.slice(0, 2);
  }

  set hours(value: string) {
    if (this.#input) {
      const newValue = `${value}:${this.minutes}:${this.seconds}`;
      this.#value = newValue;
      this.#input.value = this.#value;
      this.emit("change", newValue as TimeString);
    }
  }

  get minutes() {
    return this.#value.slice(3, 5);
  }

  set minutes(value: string) {
    if (this.#input) {
      const newValue = `${this.hours}:${value}:${this.seconds}`;
      this.#value = newValue;
      this.#input.value = this.#value;
      this.emit("change", newValue as TimeString);
    }
  }

  get seconds() {
    return this.#value.slice(6, 8);
  }

  set seconds(value: string) {
    if (this.#input) {
      const newValue = `${this.hours}:${this.minutes}:${value}`;
      this.#value = newValue;
      this.#input.value = this.#value;
      this.emit("change", newValue as TimeString);
    }
  }

  get value() {
    return this.#value;
  }

  set value(value: string) {
    this.#value = value;
  }

  clear(unit: TimeUnit) {
    if (this.#input) {
      const { value } = this;
      const pattern = this.#showTemplateWhileEditing
        ? this.#pattern
        : "00:00:00";

      if (unit === "hours") {
        this.value = pattern.slice(0, 2).concat(value.slice(2));
      } else if (unit === "minutes") {
        this.value = value
          .slice(0, 3)
          .concat(pattern.slice(3, 5))
          .concat(value.slice(5));
      } else if (unit === "seconds") {
        this.value = value.slice(0, 6).concat(pattern.slice(6));
      }
      this.#input.value = this.value;
      this.emit("change", this.value as TimeString);
    }
  }

  select(unit: TimeUnit, halfUnit = false) {
    if (this.#input) {
      console.log(`select ${unit}`);
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

  incrementValue() {
    const { cursorPos } = this;
    if (this.#input) {
      if (cursorPos >= 0 && cursorPos <= 2) {
        const value = this.hours;
        const nextValue = incrementTime(value, "hours");
        if (nextValue !== value) {
          this.hours = nextValue;
          this.select("hours");
        }
      } else if (cursorPos >= 3 && cursorPos < 6) {
        const value = this.minutes;
        const nextValue = incrementTime(value, "hours");
        if (nextValue !== value) {
          this.minutes = nextValue;
          this.select("minutes");
        }
      } else if (cursorPos >= 5 && cursorPos <= 8) {
        const value = this.seconds;
        const nextValue = incrementTime(value, "seconds");
        if (nextValue !== value) {
          this.seconds = nextValue;
          this.select("seconds");
        }
      }
    }
  }

  decrementValue() {
    const { cursorPos } = this;
    if (this.#input) {
      if (this.#unitSelected === "hours") {
        const value = this.hours;
        const nextValue = decrementTime(value, "hours");
        if (nextValue !== value) {
          this.hours = nextValue;
          this.select("hours");
        }
      } else if (this.#unitSelected) {
        const value = this[this.#unitSelected];
        const nextValue = decrementTime(value, this.#unitSelected);
        if (nextValue !== value) {
          this[this.#unitSelected] = nextValue;
          this.select(this.#unitSelected);
        }
      } else {
        if (cursorPos >= 0 && cursorPos <= 2) {
          const value = this.hours;
          const nextValue = decrementTime(value, "hours");
          if (nextValue !== value) {
            this.hours = nextValue;
            this.select("hours");
          }
        } else if (cursorPos >= 3 && cursorPos < 6) {
          const value = this.minutes;
          const nextValue = decrementTime(value, "hours");
          if (nextValue !== value) {
            this.minutes = nextValue;
            this.select("minutes");
          }
        } else if (cursorPos >= 5 && cursorPos <= 8) {
          const value = this.seconds;
          const nextValue = decrementTime(value, "seconds");
          if (nextValue !== value) {
            this.seconds = nextValue;
            this.select("seconds");
          }
        }
      }
    }
  }

  backspace() {
    if (this.#input) {
      const { cursorPos, value } = this;
      const pattern = this.#showTemplateWhileEditing
        ? this.#pattern
        : "00:00:00";

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
        console.log("NEVER HAPPENS");
        if (cursorPos > 0) {
          //   console.log(`Backspace val = ${this.#value} cursorPos ${cursorPos}`);
          const offset =
            this.selectionStart === 6 || this.selectionStart === 3 ? 2 : 1;
          this.value = value
            .slice(0, cursorPos - offset)
            .concat(pattern.slice(cursorPos - offset, cursorPos))
            .concat(value.slice(cursorPos));
          this.selectionStart -= offset;
          this.selectionEnd -= offset;
          this.#input.value = this.value;
          this.emit("change", this.value as TimeString);

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
        this.value = this.value.split("").toSpliced(cursorPos, 1, key).join("");
        this.#input.value = this.value;
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

  getUnitAtCursorPos(cursorPos: number): TimeUnit {
    if (cursorPos < 3) {
      return "hours";
    } else if (cursorPos < 6) {
      return "minutes";
    } else {
      return "seconds";
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
      if (this.value === "") {
        if (this.#showTemplateWhileEditing) {
          this.value = this.#input.value = this.#pattern;
        } else {
          this.value = this.#input.value = "00:00:00";
          this.emit("change", this.value as TimeString);
        }
      }
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
    if (this.#input && this.#input.value === this.#pattern) {
      this.value = this.#input.value = "";
      this.emit("change", this.value as TimeString);
    } else {
      this.removeSelection();
    }
  };
}
