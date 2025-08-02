import { describe, expect, it, vi } from "vitest";
import { Digit, MaskedInput } from "../src/time-input/MaskedInput";

const MockEl = (setSelectionRange?: (from: number, to: number) => void): any =>
  new (class {
    setSelectionRange(from: number, to: number) {
      console.log(`setselectionRange ${from} ${to}`);
      setSelectionRange?.(from, to);
    }
  })();

describe("MaskedInput", () => {
  it("is empty before interaction", () => {
    const maskedInput = new MaskedInput("", MockEl());
    expect(maskedInput.value).toEqual("");
  });

  describe("WHEN showTemplateWhileEditing is true", () => {
    describe("AND no value set and focus received", () => {
      it("THEN value = template and cursor position = 0", () => {
        vi.useFakeTimers();

        const maskedInput = new MaskedInput("", MockEl());
        maskedInput.focus();
        expect(maskedInput.value).toEqual("hh:mm:ss");

        vi.advanceTimersToNextTimer();

        expect(maskedInput.cursorPos).toEqual(0);
        expect(maskedInput.selectionStart).toEqual(0);
        expect(maskedInput.selectionEnd).toEqual(2);
      });
    });

    describe("AND focus received and zero pressed 6 times", () => {
      it("THEN value is edited correctly, cursor positions are correct and final value = '00:00:00'", () => {
        const maskedInput = new MaskedInput("", MockEl());
        vi.useFakeTimers();

        maskedInput.focus();

        vi.advanceTimersToNextTimer();

        // prettier-ignore
        const expectedValues = ["0h:mm:ss","00:mm:ss","00:0m:ss","00:00:ss","00:00:0s","00:00:00"]
        const expectedCursorPositions = [1, 3, 4, 6, 7, 6];
        for (let i = 0; i < 6; i++) {
          maskedInput.update("0");
          expect(maskedInput.value).toEqual(expectedValues[i]);
          expect(maskedInput.cursorPos).toEqual(expectedCursorPositions[i]);
        }
      });
      describe("AND backspace pressed 3 times", () => {
        it("THEN value = template and cursor position = 0", () => {
          const maskedInput = new MaskedInput("", MockEl());
          vi.useFakeTimers();

          maskedInput.focus();

          vi.advanceTimersToNextTimer();

          // prettier-ignore
          const expectedValues = ["00:00:ss","00:mm:ss", "hh:mm:ss"]
          const expectedCursorPositions = [3, 0, 0];
          for (let i = 0; i < 6; i++) {
            maskedInput.update("0");
          }
          for (let i = 0; i < 3; i++) {
            maskedInput.backspace();
            expect(maskedInput.cursorPos).toEqual(expectedCursorPositions[i]);
            expect(maskedInput.value).toEqual(expectedValues[i]);
          }
        });
      });
    });
  });
});
describe("WHEN showTemplateWhileEditing is false", () => {
  describe("AND no value set and focus received", () => {
    it("THEN value = '00:00:00' and cursor position = 0", () => {
      vi.useFakeTimers();

      const maskedInput = new MaskedInput("", MockEl(), false);
      maskedInput.focus();
      expect(maskedInput.value).toEqual("00:00:00");

      vi.advanceTimersToNextTimer();

      expect(maskedInput.cursorPos).toEqual(0);
      expect(maskedInput.selectionStart).toEqual(0);
      expect(maskedInput.selectionEnd).toEqual(2);
    });
  });

  describe("AND focus received and 1-6 key pressed", () => {
    it("THEN value is edited correctly, cursor positions are correct and final value = '12:34:56'", () => {
      const maskedInput = new MaskedInput("", MockEl(), false);
      vi.useFakeTimers();

      maskedInput.focus();

      vi.advanceTimersToNextTimer();

      // prettier-ignore
      const expectedValues = ["10:00:00","12:00:00","12:30:00","12:34:00","12:34:50","12:34:56"]
      const expectedCursorPositions = [1, 3, 4, 6, 7, 6];
      for (let i = 0; i < 6; i++) {
        maskedInput.update(String(i + 1) as Digit);
        expect(maskedInput.value).toEqual(expectedValues[i]);
        expect(maskedInput.cursorPos).toEqual(expectedCursorPositions[i]);
      }
    });
    describe("AND backspace pressed 3 times", () => {
      it("THEN value = template and cursor position = 0", () => {
        const maskedInput = new MaskedInput("", MockEl(), false);
        vi.useFakeTimers();

        maskedInput.focus();

        vi.advanceTimersToNextTimer();

        // prettier-ignore
        const expectedValues = ["12:34:00","12:00:00", "00:00:00"]
        const expectedCursorPositions = [3, 0, 0];
        for (let i = 0; i < 6; i++) {
          maskedInput.update(String(i + 1) as Digit);
        }
        for (let i = 0; i < 3; i++) {
          maskedInput.backspace();
          expect(maskedInput.cursorPos).toEqual(expectedCursorPositions[i]);
          expect(maskedInput.value).toEqual(expectedValues[i]);
        }
      });
    });
  });
});
