import {
  createSyntheticEvent,
  decrementTimeUnitValue,
  EventEmitter,
  incrementTimeUnitValue,
  isValidTimeString,
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

const unitStart: Record<TimeUnit, number> = {
  hours: 0,
  minutes: 3,
  seconds: 6,
};
const unitMaxValue: Record<TimeUnit, number> = {
  hours: 23,
  minutes: 59,
  seconds: 59,
};
const nextUnit: Record<TimeUnit, TimeUnit> = {
  hours: "minutes",
  minutes: "seconds",
  seconds: "seconds",
};
const previousUnit: Record<TimeUnit, TimeUnit> = {
  hours: "hours",
  minutes: "hours",
  seconds: "minutes",
};

export const invalidClassName = "vuuTimeInput-invalid";

const isValidUnitValue = (unit: TimeUnit, value: string) =>
  /^[0-9]{2}$/.test(value) && parseInt(value) <= unitMaxValue[unit];

export type MaskedInputEvents = {
  change: ChangeEventHandler<HTMLInputElement>;
};

export class MaskedInput extends EventEmitter<MaskedInputEvents> {
  #controlled = false;
  #input: HTMLInputElement | null = null;
  #isFocused = false;
  #selectionStart = -1;
  #selectionEnd = -1;
  #value: TimeString;
  #unitSelected?: TimeUnit;
  #halfUnitSelected?: TimeUnit;

  constructor(
    defaultValue: TimeString | undefined,
    inputEl: HTMLInputElement | null = null,
  ) {
    super();
    this.#value = defaultValue ?? zeroTime;
    if (inputEl) {
      this.input = inputEl;
    }
  }

  /**
   * Attach (or re-attach) the input element. Re-attaching the same element
   * is a no-op, attaching a different element detaches the previous one.
   */
  set input(el: HTMLInputElement | null) {
    if (el === this.#input) {
      return;
    }
    this.#input?.removeEventListener("change", this.emitSyntheticChangeEvent);
    this.#input = el;
    el?.addEventListener("change", this.emitSyntheticChangeEvent);
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

  private get selectedUnit(): TimeUnit | undefined {
    return this.#unitSelected ?? this.#halfUnitSelected;
  }

  private setValue(value: TimeString) {
    if (!this.#controlled) {
      this.#value = value;
    }

    if (this.#input) {
      // The change event must carry the new value, so we set it on the input
      // before dispatching. The native change event is converted to a synthetic
      // event and emitted (see input setter).
      this.#input.value = value;
      this.#input.dispatchEvent(
        new Event("change", {
          bubbles: true,
          composed: true,
        }),
      );
      if (this.#controlled) {
        // In controlled mode, the input only reflects a new value once
        // the owner passes it back to us. If the owner rejects the change,
        // the input must continue to show the existing value.
        this.#input.value = this.#value;
      }
    }
  }

  private getUnitValue<T extends TimeUnit>(unit: T): TimeUnitValue<T> {
    const start = unitStart[unit];
    return this.#value.slice(start, start + 2) as TimeUnitValue<T>;
  }

  private setUnitValue(unit: TimeUnit, value: string) {
    const newValue = updateTimeString(
      this.#value,
      unit,
      value as TimeUnitValue<TimeUnit>,
    );
    if (newValue !== this.#value) {
      this.setValue(newValue);
    }
  }

  private setInvalid(invalid: boolean) {
    if (this.#input) {
      if (invalid) {
        this.#input.classList.add(invalidClassName);
        this.#input.setAttribute("aria-invalid", "true");
      } else {
        this.#input.classList.remove(invalidClassName);
        this.#input.removeAttribute("aria-invalid");
      }
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
    if (value !== this.#value) {
      this.#value = value;
      if (this.isFocused) {
        // React will update the input value after this, which
        // will lose our selection. Restore it once that has happened.
        requestAnimationFrame(() => {
          this.restoreSelection();
        });
      }
    }
  }

  clear(unit: TimeUnit) {
    if (this.#input) {
      this.setUnitValue(unit, zeroTimeUnit);
    }
  }

  select(unit: TimeUnit, halfUnit = false) {
    if (this.#input) {
      const offset = halfUnit ? 1 : 0;
      this.selectionStart = unitStart[unit] + offset;
      this.selectionEnd = unitStart[unit] + 2;
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
    this.selectionStart = this.selectionEnd = 8;
    this.#unitSelected = undefined;
    this.#halfUnitSelected = undefined;
  }

  restoreSelection() {
    if (this.#unitSelected) {
      this.select(this.#unitSelected);
    } else if (this.#halfUnitSelected) {
      this.select(this.#halfUnitSelected, true);
    }
  }

  moveFocus(direction: "left" | "right") {
    const unit = this.selectedUnit;
    if (unit) {
      this.select(direction === "right" ? nextUnit[unit] : previousUnit[unit]);
    } else {
      this.select(direction === "right" ? "hours" : "seconds");
    }
  }

  /**
   * Replace the entire value, e.g. from a paste. Invalid values are ignored.
   * Returns true if value was accepted.
   */
  pasteValue(value: string) {
    const trimmedValue = value.trim();
    if (this.#input && isValidTimeString(trimmedValue)) {
      this.setInvalid(false);
      if (trimmedValue !== this.#value) {
        this.setValue(trimmedValue);
      }
      this.select("hours");
      return true;
    }
    return false;
  }

  private getUnitAtCursorPos(cursorPos = this.cursorPos): TimeUnit {
    if (cursorPos < 3) {
      return "hours";
    } else if (cursorPos < 6) {
      return "minutes";
    } else {
      return "seconds";
    }
  }

  private get activeUnit(): TimeUnit {
    return this.selectedUnit ?? this.getUnitAtCursorPos();
  }

  incrementValue() {
    if (this.#input) {
      const unit = this.activeUnit;
      const newUnitValue = incrementTimeUnitValue(
        unit,
        this.getUnitValue(unit),
      );
      this.setInvalid(false);
      this.setUnitValue(unit, newUnitValue);
      this.select(unit);
    }
  }

  decrementValue() {
    if (this.#input) {
      const unit = this.activeUnit;
      const newUnitValue = decrementTimeUnitValue(
        unit,
        this.getUnitValue(unit),
      );
      this.setInvalid(false);
      this.setUnitValue(unit, newUnitValue);
      this.select(unit);
    }
  }

  /**
   * If a full unit is selected, it is cleared and selection moves to the
   * previous unit. If we are midway through entering a unit, the unit is
   * cleared and remains selected.
   */
  backspace() {
    if (this.#input) {
      const unit = this.activeUnit;
      const isPartiallyEntered = this.#halfUnitSelected === unit;
      this.setInvalid(false);
      this.clear(unit);
      this.select(isPartiallyEntered ? unit : previousUnit[unit]);
    }
  }

  /**
   * Typing the first digit of a unit sets the unit to that digit followed
   * by zero, e.g '1' => '10' and selection moves to the second digit. If
   * the digit cannot be the first digit of a valid unit, e.g '3' for hours,
   * the unit is set to '03' and selection advances to the next unit.
   * Typing the second digit completes the unit and selection advances to the
   * next unit. A second digit which would produce an invalid value is
   * rejected and the input is marked as invalid.
   */
  update(key: Digit) {
    if (this.#input) {
      const unit = this.activeUnit;
      const isSecondDigit = this.#halfUnitSelected === unit;
      const digit = parseInt(key);
      const maxFirstDigit = Math.floor(unitMaxValue[unit] / 10);

      let newUnitValue: string;
      let advance: boolean;

      if (isSecondDigit) {
        newUnitValue = this.getUnitValue(unit)[0] + key;
        advance = true;
      } else if (digit > maxFirstDigit) {
        newUnitValue = `0${key}`;
        advance = true;
      } else {
        newUnitValue = `${key}0`;
        advance = false;
      }

      if (!isValidUnitValue(unit, newUnitValue)) {
        this.setInvalid(true);
        this.select(unit, isSecondDigit);
        return;
      }

      this.setInvalid(false);
      this.setUnitValue(unit, newUnitValue);

      if (advance) {
        this.select(nextUnit[unit]);
      } else {
        this.select(unit, true);
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
      } else {
        return {
          end: selectionEnd,
          start: selectionStart,
        };
      }
    } else {
      throw Error(`[MaskedInput] selection referenced, but no input`);
    }
  }

  click() {
    if (this.#input) {
      this.#isFocused = true;
      const selection = this.getSelection();
      if (selection.start === null) {
        this.select("hours");
      } else if (selection === FullSelection) {
        // do nothing
      } else {
        this.select(this.getUnitAtCursorPos(selection.start));
      }
    }
  }

  doubleClick() {
    if (this.#input) {
      const { selectionStart } = this.#input;
      if (selectionStart !== null) {
        this.select(this.getUnitAtCursorPos(selectionStart));
      }
    }
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
