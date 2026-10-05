import {
  createSyntheticEvent,
  decrementTimeUnitValue,
  EventEmitter,
  incrementTimeUnitValue,
  normaliseTimeString,
  TimeString,
  TimeStringMillis,
  TimeUnit,
  TimeUnitValue,
  updateTimeString,
  zeroTime,
  zeroTimeMillis,
} from "@vuu-ui/vuu-utils";
import { ChangeEventHandler } from "react";

export type Digit = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";

export type TimeValue = TimeString | TimeStringMillis;

type UnitSpec = {
  length: number;
  max: number;
  start: number;
};

const unitSpec: Record<TimeUnit, UnitSpec> = {
  hours: { start: 0, length: 2, max: 23 },
  minutes: { start: 3, length: 2, max: 59 },
  seconds: { start: 6, length: 2, max: 59 },
  milliseconds: { start: 9, length: 3, max: 999 },
};

const secondsUnits: TimeUnit[] = ["hours", "minutes", "seconds"];
const millisecondsUnits: TimeUnit[] = [...secondsUnits, "milliseconds"];

export const invalidClassName = "vuuTimeInput-invalid";

const isValidUnitValue = (unit: TimeUnit, value: string) => {
  const { length, max } = unitSpec[unit];
  return (
    value.length === length && /^[0-9]+$/.test(value) && parseInt(value) <= max
  );
};

export interface MaskedInputOptions {
  /**
   * When true, value includes milliseconds, hh:mm:ss.SSS
   */
  milliseconds?: boolean;
}

export type MaskedInputEvents = {
  change: ChangeEventHandler<HTMLInputElement>;
};

export class MaskedInput extends EventEmitter<MaskedInputEvents> {
  #controlled = false;
  #input: HTMLInputElement | null = null;
  #isFocused = false;
  #milliseconds: boolean;
  #selectionStart = -1;
  #selectionEnd = -1;
  #units: TimeUnit[];
  #value: TimeValue;
  #selectedUnit?: TimeUnit;
  /**
   * The number of digits of the selected unit that have been entered.
   * 0 means the whole unit is selected.
   */
  #digitIndex = 0;

  constructor(
    defaultValue: TimeValue | undefined,
    inputEl: HTMLInputElement | null = null,
    { milliseconds = false }: MaskedInputOptions = {},
  ) {
    super();
    this.#milliseconds = milliseconds;
    this.#units = milliseconds ? millisecondsUnits : secondsUnits;
    this.#value = this.normalise(defaultValue) ?? this.zeroValue;
    if (inputEl) {
      this.input = inputEl;
    }
  }

  get milliseconds() {
    return this.#milliseconds;
  }

  private get zeroValue(): TimeValue {
    return this.#milliseconds ? zeroTimeMillis : zeroTime;
  }

  /**
   * Length of the formatted value, hh:mm:ss or hh:mm:ss.SSS
   */
  get length() {
    return this.#milliseconds ? 12 : 8;
  }

  private normalise(value: unknown): TimeValue | undefined {
    return normaliseTimeString(value, this.#milliseconds);
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
    if (el) {
      el.addEventListener("change", this.emitSyntheticChangeEvent);
      if (el.value !== "" && el.value !== this.#value) {
        // e.g. input previously used with a different precision
        el.value = this.#value;
      }
    }
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

  private nextUnit(unit: TimeUnit) {
    const index = this.#units.indexOf(unit);
    return this.#units[Math.min(index + 1, this.#units.length - 1)];
  }

  private previousUnit(unit: TimeUnit) {
    const index = this.#units.indexOf(unit);
    return this.#units[Math.max(index - 1, 0)];
  }

  private get firstUnit() {
    return this.#units[0];
  }

  private get lastUnit() {
    return this.#units[this.#units.length - 1];
  }

  private setValue(value: TimeValue) {
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
    const { start, length } = unitSpec[unit];
    return this.#value.slice(start, start + length) as TimeUnitValue<T>;
  }

  private setUnitValue(unit: TimeUnit, value: string) {
    const newValue = updateTimeString(
      this.#value,
      unit,
      value as TimeUnitValue<TimeUnit>,
    );
    // Dispatch even if unchanged: every accepted keystroke fires onChange,
    // existing consumers (e.g. ColumnFilter) rely on this.
    this.setValue(newValue);
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
   * Setting the value this way invokes 'controlled' mode. Value
   * will be normalised to the configured precision.
   */
  set value(value: TimeValue) {
    this.#controlled = true;
    const normalisedValue = this.normalise(value);
    if (normalisedValue !== undefined && normalisedValue !== this.#value) {
      this.#value = normalisedValue;
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
      this.setUnitValue(unit, "0".repeat(unitSpec[unit].length));
    }
  }

  /**
   * Select a unit. If digitIndex > 0, only the digits of the unit
   * not yet entered are selected.
   */
  select(unit: TimeUnit, digitIndex = 0) {
    if (this.#input && this.#units.includes(unit)) {
      const { start, length } = unitSpec[unit];
      this.selectionStart = start + digitIndex;
      this.selectionEnd = start + length;
      this.#input.setSelectionRange(this.selectionStart, this.selectionEnd);
      this.#selectedUnit = unit;
      this.#digitIndex = digitIndex;
    }
  }

  removeSelection() {
    this.selectionStart = this.selectionEnd = this.length;
    this.#selectedUnit = undefined;
    this.#digitIndex = 0;
  }

  restoreSelection() {
    if (this.#selectedUnit) {
      this.select(this.#selectedUnit, this.#digitIndex);
    }
  }

  selectFirst() {
    this.select(this.firstUnit);
  }

  selectLast() {
    this.select(this.lastUnit);
  }

  moveFocus(direction: "left" | "right") {
    const unit = this.#selectedUnit;
    if (unit) {
      this.select(
        direction === "right" ? this.nextUnit(unit) : this.previousUnit(unit),
      );
    } else if (direction === "right") {
      this.selectFirst();
    } else {
      this.selectLast();
    }
  }

  /**
   * Replace the entire value, e.g. from a paste. Values with or without
   * milliseconds are accepted and converted to the configured precision.
   * Invalid values are ignored. Returns true if value was accepted.
   */
  pasteValue(value: string) {
    const normalisedValue = this.normalise(value.trim());
    if (this.#input && normalisedValue !== undefined) {
      this.setInvalid(false);
      if (normalisedValue !== this.#value) {
        this.setValue(normalisedValue);
      }
      this.selectFirst();
      return true;
    }
    return false;
  }

  private getUnitAtCursorPos(cursorPos = this.cursorPos): TimeUnit {
    for (let i = this.#units.length - 1; i > 0; i--) {
      const unit = this.#units[i];
      if (cursorPos >= unitSpec[unit].start) {
        return unit;
      }
    }
    return this.firstUnit;
  }

  private get activeUnit(): TimeUnit {
    return this.#selectedUnit ?? this.getUnitAtCursorPos();
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
      const isPartiallyEntered =
        this.#selectedUnit === unit && this.#digitIndex > 0;
      this.setInvalid(false);
      this.clear(unit);
      this.select(isPartiallyEntered ? unit : this.previousUnit(unit));
    }
  }

  /**
   * Typing the first digit of a unit sets the unit to that digit followed
   * by zeros, e.g '1' => '10' and selection moves to the next digit. If
   * the digit cannot be the first digit of a valid unit, e.g '3' for hours,
   * the unit is zero padded, e.g '03', and selection advances to the next unit.
   * Typing the last digit completes the unit and selection advances to the
   * next unit. A digit which would produce an invalid value is rejected and
   * the input is marked as invalid.
   */
  update(key: Digit) {
    if (this.#input) {
      const unit = this.activeUnit;
      const { length, max } = unitSpec[unit];
      const digitIndex =
        this.#selectedUnit === unit && this.#digitIndex < length
          ? this.#digitIndex
          : 0;
      const maxFirstDigit = Math.floor(max / 10 ** (length - 1));

      let newUnitValue: string;
      let nextDigitIndex: number;

      if (digitIndex === 0 && parseInt(key) > maxFirstDigit) {
        newUnitValue = key.padStart(length, "0");
        nextDigitIndex = length;
      } else {
        // Overwrite the digit at digitIndex, preserving trailing digits.
        // If that yields an out-of-range value (e.g. 19 -> 29 hours),
        // zero-fill the trailing digits instead.
        const unitValue = this.getUnitValue(unit);
        const head = unitValue.slice(0, digitIndex).concat(key);
        const overwritten = head.concat(unitValue.slice(digitIndex + 1));
        newUnitValue = isValidUnitValue(unit, overwritten)
          ? overwritten
          : head.padEnd(length, "0");
        nextDigitIndex = digitIndex + 1;
      }

      if (!isValidUnitValue(unit, newUnitValue)) {
        this.setInvalid(true);
        this.select(unit, digitIndex);
        return;
      }

      this.setInvalid(false);
      this.setUnitValue(unit, newUnitValue);

      if (nextDigitIndex === length) {
        this.select(this.nextUnit(unit));
      } else {
        this.select(unit, nextDigitIndex);
      }
    }
  }

  private getSelection() {
    if (this.#input) {
      const { selectionEnd, selectionStart } = this.#input;
      return { end: selectionEnd, start: selectionStart };
    } else {
      throw Error("[MaskedInput] selection referenced, but no input");
    }
  }

  click() {
    if (this.#input) {
      this.#isFocused = true;
      const { start, end } = this.getSelection();
      if (start === null) {
        this.selectFirst();
      } else if (start === 0 && end === this.length) {
        // full selection, do nothing
      } else {
        this.select(this.getUnitAtCursorPos(start));
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
        this.selectFirst();
      });
    }
  };

  blur = () => {
    this.removeSelection();
    this.#isFocused = false;
  };
}
