import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  Digit,
  invalidClassName,
  MaskedInput,
} from "../src/time-input/MaskedInput";
import { TimeString, TimeStringMillis } from "@vuu-ui/vuu-utils";

type Mode = "uncontrolled" | "controlled" | "controlled-rejecting";

const createInput = (value = "") => {
  const input = document.createElement("input");
  input.value = value;
  document.body.appendChild(input);
  return input;
};

const typeDigits = (maskedInput: MaskedInput, digits: string) => {
  for (const digit of digits) {
    maskedInput.update(digit as Digit);
  }
};

const selection = (input: HTMLInputElement) => [
  input.selectionStart,
  input.selectionEnd,
];

describe("MaskedInput", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    vi.useRealTimers();
  });

  const modes: Mode[] = ["uncontrolled", "controlled", "controlled-rejecting"];

  for (const mode of modes) {
    describe(`${mode} mode`, () => {
      let maskedInput: MaskedInput;
      let input: HTMLInputElement;
      let changeValues: string[];

      const setup = (initialValue: TimeString = "00:00:00") => {
        changeValues = [];
        input = createInput(initialValue);
        if (mode === "uncontrolled") {
          maskedInput = new MaskedInput(initialValue, input);
          maskedInput.on("change", (e) => {
            changeValues.push(e.target.value);
          });
        } else {
          maskedInput = new MaskedInput(undefined, input);
          maskedInput.value = initialValue;
          maskedInput.on("change", (e) => {
            changeValues.push(e.target.value);
            if (mode === "controlled") {
              maskedInput.value = e.target.value as TimeString;
            }
          });
        }
        maskedInput.focus();
        vi.advanceTimersToNextTimer();
      };

      // In controlled-rejecting mode, the value never changes
      const expectValue = (value: string, initialValue = "00:00:00") => {
        const expected = mode === "controlled-rejecting" ? initialValue : value;
        expect(maskedInput.value).toEqual(expected);
        expect(input.value).toEqual(expected);
      };

      beforeEach(() => {
        vi.useFakeTimers();
      });

      describe("WHEN focus received", () => {
        beforeEach(() => setup());

        it("THEN value is unchanged and hours are selected", () => {
          expect(maskedInput.value).toEqual("00:00:00");
          expect(selection(input)).toEqual([0, 2]);
          expect(maskedInput.cursorPos).toEqual(0);
        });

        it("THEN typing 1-6 fills in each unit, selection advances", () => {
          // prettier-ignore
          const expectedValues = ["10:00:00","12:00:00","12:30:00","12:34:00","12:34:50","12:34:56"];
          const expectedSelections = [
            [1, 2],
            [3, 5],
            [4, 5],
            [6, 8],
            [7, 8],
            [6, 8],
          ];
          for (let i = 0; i < 6; i++) {
            maskedInput.update(String(i + 1) as Digit);
            expect(selection(input)).toEqual(expectedSelections[i]);
            if (mode !== "controlled-rejecting") {
              expectValue(expectedValues[i]);
            }
          }
          if (mode === "controlled-rejecting") {
            expectValue("00:00:00");
            // every keystroke still notifies owner of proposed change
            expect(changeValues).toEqual([
              "10:00:00",
              "02:00:00",
              "00:30:00",
              "00:04:00",
              "00:00:50",
              "00:00:06",
            ]);
          } else {
            expect(changeValues).toEqual(expectedValues);
          }
        });

        it("THEN first digit too large for unit is zero padded and selection advances", () => {
          maskedInput.update("3");
          expectValue("03:00:00");
          expect(selection(input)).toEqual([3, 5]);
          maskedInput.update("7");
          expectValue("03:07:00");
          expect(selection(input)).toEqual([6, 8]);
          maskedInput.update("9");
          expectValue("03:07:09");
          expect(selection(input)).toEqual([6, 8]);
        });

        it("THEN overtyping the first digit of a unit preserves the second digit", () => {
          if (mode === "controlled-rejecting") return;
          typeDigits(maskedInput, "123456");
          maskedInput.select("hours");
          maskedInput.update("2");
          expectValue("22:34:56");
          maskedInput.update("3");
          expectValue("23:34:56");
        });

        it("THEN overtyping the first digit zero-fills if preserving the second digit would be out of range", () => {
          if (mode === "controlled-rejecting") return;
          typeDigits(maskedInput, "195959");
          maskedInput.select("hours");
          maskedInput.update("2");
          expectValue("20:59:59");
          expect(input.classList.contains("vuuTimeInput-invalid")).toBe(false);
        });

        it("THEN invalid second digit is rejected and input marked invalid", () => {
          if (mode === "controlled-rejecting") return;
          maskedInput.update("2");
          const changeCount = changeValues.length;
          maskedInput.update("5");
          expectValue("20:00:00");
          expect(changeValues.length).toEqual(changeCount);
          expect(input.classList.contains(invalidClassName)).toBe(true);
          expect(input.getAttribute("aria-invalid")).toEqual("true");
          expect(selection(input)).toEqual([1, 2]);

          maskedInput.update("3");
          expectValue("23:00:00");
          expect(input.classList.contains(invalidClassName)).toBe(false);
          expect(input.hasAttribute("aria-invalid")).toBe(false);
          expect(selection(input)).toEqual([3, 5]);
        });

        it("THEN overtyping a digit with the same digit advances and still fires change", () => {
          maskedInput.update("1");
          if (mode === "controlled-rejecting") return;
          maskedInput.select("hours");
          const changeCount = changeValues.length;
          maskedInput.update("1");
          expect(changeValues.length).toEqual(changeCount + 1);
          expect(changeValues.at(-1)).toEqual("10:00:00");
          expect(selection(input)).toEqual([1, 2]);
          maskedInput.update("0");
          expect(selection(input)).toEqual([3, 5]);
        });

        it("THEN ArrowUp increments selected unit and selection is maintained", () => {
          maskedInput.incrementValue();
          expectValue("01:00:00");
          expect(selection(input)).toEqual([0, 2]);
        });

        it("THEN ArrowDown wraps hours from 00 to 23", () => {
          maskedInput.decrementValue();
          expectValue("23:00:00");
          expect(selection(input)).toEqual([0, 2]);
        });

        it("THEN ArrowDown wraps minutes and seconds from 00 to 59", () => {
          maskedInput.moveFocus("right");
          maskedInput.decrementValue();
          expectValue("00:59:00");
          expect(selection(input)).toEqual([3, 5]);
          if (mode === "controlled-rejecting") return;
          maskedInput.moveFocus("right");
          maskedInput.decrementValue();
          expectValue("00:59:59");
          expect(selection(input)).toEqual([6, 8]);
        });

        it("THEN ArrowUp/Down act on the whole unit when partially entered", () => {
          maskedInput.update("1");
          maskedInput.incrementValue();
          expectValue("11:00:00");
          expect(selection(input)).toEqual([0, 2]);
        });

        it("THEN backspace with full unit selected clears unit and selects previous unit", () => {
          if (mode === "controlled-rejecting") return;
          typeDigits(maskedInput, "123456");
          // prettier-ignore
          const expectedValues = ["12:34:00","12:00:00", "00:00:00"];
          const expectedSelections = [
            [3, 5],
            [0, 2],
            [0, 2],
          ];
          for (let i = 0; i < 3; i++) {
            maskedInput.backspace();
            expectValue(expectedValues[i]);
            expect(selection(input)).toEqual(expectedSelections[i]);
          }
        });

        it("THEN backspace with unit partially entered clears unit and keeps it selected", () => {
          maskedInput.moveFocus("right");
          maskedInput.update("4");
          expect(selection(input)).toEqual([4, 5]);
          maskedInput.backspace();
          expectValue("00:00:00");
          expect(selection(input)).toEqual([3, 5]);
          // next digit is treated as first digit of minutes
          maskedInput.update("2");
          maskedInput.update("5");
          expectValue("00:25:00");
          expect(selection(input)).toEqual([6, 8]);
        });

        it("THEN backspace clears invalid state", () => {
          if (mode === "controlled-rejecting") return;
          maskedInput.update("2");
          maskedInput.update("9");
          expect(input.classList.contains(invalidClassName)).toBe(true);
          maskedInput.backspace();
          expect(input.classList.contains(invalidClassName)).toBe(false);
        });

        it("THEN left/right arrows move between units, stopping at ends", () => {
          maskedInput.moveFocus("left");
          expect(selection(input)).toEqual([0, 2]);
          maskedInput.moveFocus("right");
          expect(selection(input)).toEqual([3, 5]);
          maskedInput.moveFocus("right");
          expect(selection(input)).toEqual([6, 8]);
          maskedInput.moveFocus("right");
          expect(selection(input)).toEqual([6, 8]);
          maskedInput.moveFocus("left");
          expect(selection(input)).toEqual([3, 5]);
          maskedInput.moveFocus("left");
          expect(selection(input)).toEqual([0, 2]);
        });

        it("THEN digit entry interleaved with right arrow fills each unit", () => {
          maskedInput.update("2");
          maskedInput.moveFocus("right");
          maskedInput.update("3");
          maskedInput.moveFocus("right");
          maskedInput.update("4");
          if (mode !== "controlled-rejecting") {
            expectValue("20:30:40");
          }
          expect(maskedInput.cursorPos).toEqual(7);
        });

        it("THEN a valid pasted value replaces value", () => {
          expect(maskedInput.pasteValue(" 12:34:56\n")).toBe(true);
          expectValue("12:34:56");
          expect(changeValues).toEqual(["12:34:56"]);
          expect(selection(input)).toEqual([0, 2]);
        });

        it("THEN an invalid pasted value is ignored", () => {
          for (const value of ["x12:34:56", "123:45:00", "24:00:00", "abc"]) {
            expect(maskedInput.pasteValue(value)).toBe(false);
          }
          expectValue("00:00:00");
          expect(changeValues).toEqual([]);
        });
      });

      describe("WHEN mouse used", () => {
        beforeEach(() => setup("12:34:56"));

        it("THEN click selects the unit at the caret", () => {
          maskedInput.blur();
          input.setSelectionRange(4, 4);
          maskedInput.click();
          expect(selection(input)).toEqual([3, 5]);
          input.setSelectionRange(8, 8);
          maskedInput.click();
          expect(selection(input)).toEqual([6, 8]);
          expect(maskedInput.isFocused).toBe(true);
        });

        it("THEN double click selects the unit at the caret", () => {
          input.setSelectionRange(1, 1);
          maskedInput.doubleClick();
          expect(selection(input)).toEqual([0, 2]);
        });
      });
    });
  }

  describe("WHEN no selection has been made", () => {
    it("THEN ArrowUp increments hours", () => {
      const input = createInput("00:00:00");
      const maskedInput = new MaskedInput("00:00:00", input);
      maskedInput.incrementValue();
      expect(maskedInput.value).toEqual("01:00:00");
    });
  });

  describe("WHEN controlled", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    it("THEN selection is restored after owner updates the value", () => {
      const input = createInput("00:00:00");
      const maskedInput = new MaskedInput(undefined, input);
      maskedInput.value = "00:00:00";
      maskedInput.focus();
      vi.advanceTimersToNextTimer();
      maskedInput.update("1");
      // simulate React re-rendering the new value, which resets selection
      maskedInput.value = "10:00:00";
      input.value = "10:00:00";
      input.setSelectionRange(8, 8);
      vi.advanceTimersToNextTimer();
      expect(selection(input)).toEqual([1, 2]);
    });

    it("THEN an external value change while focused does not throw", () => {
      const input = createInput("00:00:00");
      const maskedInput = new MaskedInput(undefined, input);
      maskedInput.value = "00:00:00";
      maskedInput.focus();
      vi.advanceTimersToNextTimer();
      maskedInput.removeSelection();
      maskedInput.value = "15:30:00";
      expect(() => vi.advanceTimersToNextTimer()).not.toThrow();
    });
  });

  describe("input element", () => {
    it("can be re-attached without error", () => {
      const input = createInput();
      const maskedInput = new MaskedInput(undefined, input);
      expect(() => {
        maskedInput.input = null;
        maskedInput.input = input;
        maskedInput.input = input;
      }).not.toThrow();
    });

    it("stops listening to previous element when a new element is attached", () => {
      const input1 = createInput();
      const input2 = createInput();
      const maskedInput = new MaskedInput(undefined, input1);
      const handler = vi.fn();
      maskedInput.on("change", handler);
      maskedInput.input = input2;
      input1.dispatchEvent(new Event("change"));
      expect(handler).not.toHaveBeenCalled();
      input2.dispatchEvent(new Event("change"));
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe("milliseconds", () => {
    for (const mode of ["uncontrolled", "controlled"] as const) {
      describe(`${mode} mode`, () => {
        let maskedInput: MaskedInput;
        let input: HTMLInputElement;
        let changeValues: string[];

        const setup = (initialValue: TimeStringMillis = "00:00:00.000") => {
          changeValues = [];
          input = createInput(initialValue);
          if (mode === "uncontrolled") {
            maskedInput = new MaskedInput(initialValue, input, {
              milliseconds: true,
            });
          } else {
            maskedInput = new MaskedInput(undefined, input, {
              milliseconds: true,
            });
            maskedInput.value = initialValue;
          }
          maskedInput.on("change", (e) => {
            changeValues.push(e.target.value);
            if (mode === "controlled") {
              maskedInput.value = e.target.value as TimeStringMillis;
            }
          });
          maskedInput.focus();
          vi.advanceTimersToNextTimer();
        };

        const expectValue = (value: string) => {
          expect(maskedInput.value).toEqual(value);
          expect(input.value).toEqual(value);
        };

        beforeEach(() => {
          vi.useFakeTimers();
          setup();
        });

        it("THEN focus selects hours", () => {
          expect(selection(input)).toEqual([0, 2]);
        });

        it("THEN typing nine digits enters a complete time", () => {
          // prettier-ignore
          const expected: [string, number[]][] = [
            ["10:00:00.000", [1, 2]],
            ["12:00:00.000", [3, 5]],
            ["12:30:00.000", [4, 5]],
            ["12:34:00.000", [6, 8]],
            ["12:34:50.000", [7, 8]],
            ["12:34:56.000", [9, 12]],
            ["12:34:56.700", [10, 12]],
            ["12:34:56.780", [11, 12]],
            ["12:34:56.789", [9, 12]],
          ];
          "123456789".split("").forEach((digit, i) => {
            maskedInput.update(digit as Digit);
            expectValue(expected[i][0]);
            expect(selection(input)).toEqual(expected[i][1]);
          });
          expect(changeValues).toEqual(expected.map(([value]) => value));
        });

        it("THEN any digit is valid as first digit of milliseconds", () => {
          maskedInput.selectLast();
          maskedInput.update("9");
          expectValue("00:00:00.900");
          expect(selection(input)).toEqual([10, 12]);
          maskedInput.update("9");
          maskedInput.update("9");
          expectValue("00:00:00.999");
          expect(input.classList.contains(invalidClassName)).toBe(false);
        });

        it("THEN right arrow moves through all four units, stopping at milliseconds", () => {
          const expectedSelections = [
            [3, 5],
            [6, 8],
            [9, 12],
            [9, 12],
          ];
          for (const expected of expectedSelections) {
            maskedInput.moveFocus("right");
            expect(selection(input)).toEqual(expected);
          }
          maskedInput.moveFocus("left");
          expect(selection(input)).toEqual([6, 8]);
        });

        it("THEN selectLast selects milliseconds", () => {
          maskedInput.selectLast();
          expect(selection(input)).toEqual([9, 12]);
        });

        it("THEN ArrowUp/Down increment and decrement milliseconds, with wrap", () => {
          maskedInput.selectLast();
          maskedInput.decrementValue();
          expectValue("00:00:00.999");
          expect(selection(input)).toEqual([9, 12]);
          maskedInput.incrementValue();
          expectValue("00:00:00.000");
          maskedInput.incrementValue();
          expectValue("00:00:00.001");
        });

        it("THEN incrementing seconds preserves milliseconds", () => {
          maskedInput.pasteValue("00:00:59.500");
          maskedInput.select("seconds");
          maskedInput.incrementValue();
          expectValue("00:00:00.500");
        });

        it("THEN backspace from milliseconds clears and moves to seconds", () => {
          maskedInput.pasteValue("12:34:56.789");
          maskedInput.selectLast();
          maskedInput.backspace();
          expectValue("12:34:56.000");
          expect(selection(input)).toEqual([6, 8]);
          maskedInput.backspace();
          expectValue("12:34:00.000");
          expect(selection(input)).toEqual([3, 5]);
        });

        it("THEN backspace with milliseconds partially entered clears and keeps them selected", () => {
          maskedInput.selectLast();
          maskedInput.update("4");
          maskedInput.update("5");
          expect(selection(input)).toEqual([11, 12]);
          maskedInput.backspace();
          expectValue("00:00:00.000");
          expect(selection(input)).toEqual([9, 12]);
        });

        it("THEN paste accepts values with or without milliseconds", () => {
          expect(maskedInput.pasteValue("12:34:56.789")).toBe(true);
          expectValue("12:34:56.789");
          expect(maskedInput.pasteValue("01:02:03")).toBe(true);
          expectValue("01:02:03.000");
          expect(maskedInput.pasteValue("01:02:03.4")).toBe(false);
          expectValue("01:02:03.000");
        });

        it("THEN click selects the unit at the caret, including milliseconds", () => {
          maskedInput.blur();
          input.setSelectionRange(10, 10);
          maskedInput.click();
          expect(selection(input)).toEqual([9, 12]);
          input.setSelectionRange(8, 8);
          maskedInput.click();
          expect(selection(input)).toEqual([6, 8]);
          input.setSelectionRange(0, 12);
          maskedInput.click();
          expect(selection(input)).toEqual([0, 12]);
        });
      });
    }

    it("value without milliseconds is normalised", () => {
      const maskedInput = new MaskedInput("12:34:56", createInput(), {
        milliseconds: true,
      });
      expect(maskedInput.value).toEqual("12:34:56.000");
      maskedInput.value = "01:02:03";
      expect(maskedInput.value).toEqual("01:02:03.000");
    });

    it("default value is zero time with milliseconds", () => {
      const maskedInput = new MaskedInput(undefined, createInput(), {
        milliseconds: true,
      });
      expect(maskedInput.value).toEqual("00:00:00.000");
      expect(maskedInput.length).toEqual(12);
    });

    it("milliseconds are removed when not configured", () => {
      const maskedInput = new MaskedInput("12:34:56.789", createInput());
      expect(maskedInput.value).toEqual("12:34:56");
      expect(maskedInput.length).toEqual(8);
    });

    it("attached input showing a value of different precision is updated", () => {
      const input = createInput("12:34:56");
      new MaskedInput("12:34:56", input, { milliseconds: true });
      expect(input.value).toEqual("12:34:56.000");
    });
  });
});
