import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Digit, MaskedInput } from "../src/time-input/MaskedInput";
import { TimeString } from "@vuu-ui/vuu-utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MockEl = (setSelectionRange?: (from: number, to: number) => void): any =>
  new (class {
    classList = {
      add: () => undefined,
      remove: () => undefined,
    };
    addEventListener(_: string): void {
      // TBD
    }
    dispatchEvent(_: Event) {
      // TBD
    }
    setSelectionRange(from: number, to: number) {
      setSelectionRange?.(from, to);
    }
  })();

describe("MaskedInput", () => {
  for (const mode of ["uncontrolled", "controlled"]) {
    let maskedInput: MaskedInput;

    describe(`${mode} mode`, () => {
      beforeEach(() => {
        vi.useFakeTimers();
        if (mode === "uncontrolled") {
          maskedInput = new MaskedInput("00:00:00", MockEl());
        } else {
          maskedInput = new MaskedInput(undefined, MockEl());
          maskedInput.value = "00:00:00";
          maskedInput.on("change", (e) => {
            maskedInput.value = e.target.value as TimeString;
            vi.advanceTimersToNextTimer();
          });
        }
        maskedInput.focus();
        vi.advanceTimersToNextTimer();
      });

      afterEach(() => {
        vi.useRealTimers();
      });

      describe(`WHEN ${mode}`, () => {
        it("retains initial value before interaction", () => {
          expect(maskedInput.value).toEqual("00:00:00");
        });
      });

      describe(`WHEN ${mode} AND focus received`, () => {
        it("THEN value = '00:00:00' and cursor position = 0", () => {
          expect(maskedInput.cursorPos).toEqual(0);
          expect(maskedInput.selectionStart).toEqual(0);
          expect(maskedInput.selectionEnd).toEqual(2);
        });

        describe("AND up Arrow key pressed", () => {
          it("THEN value is incremented correctly and cursor position is maintained", () => {
            maskedInput.incrementValue();
            if (mode === "controlled") {
              expect(maskedInput.value).toEqual("00:00:00");
            } else {
              expect(maskedInput.value).toEqual("01:00:00");
            }
            expect(maskedInput.selectionStart).toEqual(0);
            expect(maskedInput.selectionEnd).toEqual(2);
          });
        });

        describe("AND 1-6 key pressed", () => {
          it("THEN value is edited correctly, cursor positions are correct and final value = '12:34:56'", () => {
            // prettier-ignore
            const expectedValues = ["10:00:00","12:00:00","12:30:00","12:34:00","12:34:50","12:34:56"]
            const expectedCursorPositions = [1, 3, 4, 6, 7, 6];
            for (let i = 0; i < 6; i++) {
              maskedInput.update(String(i + 1) as Digit);
              if (mode === "controlled") {
                expect(maskedInput.value).toEqual("00:00:00");
              } else {
                expect(maskedInput.value).toEqual(expectedValues[i]);
                expect(maskedInput.cursorPos).toEqual(
                  expectedCursorPositions[i],
                );
              }
            }
          });
        });

        describe("AND backspace pressed 3 times", () => {
          it("THEN value = template and cursor position = 0", () => {
            // prettier-ignore
            const expectedValues = ["12:34:00","12:00:00", "00:00:00"]
            const expectedCursorPositions = [3, 0, 0];
            for (let i = 0; i < 6; i++) {
              maskedInput.update(String(i + 1) as Digit);
            }
            for (let i = 0; i < 3; i++) {
              maskedInput.backspace();
              if (mode === "uncontrolled") {
                expect(maskedInput.cursorPos).toEqual(
                  expectedCursorPositions[i],
                );
                expect(maskedInput.value).toEqual(expectedValues[i]);
              }
            }
          });
        });
        describe("AND right Arrow key pressed", () => {
          it("THEN 'focus' moves from unit to unit", () => {
            // prettier-ignore
            maskedInput.moveFocus("right");
            expect(maskedInput.selectionStart).toEqual(3);
            expect(maskedInput.selectionEnd).toEqual(5);
            maskedInput.moveFocus("right");
            expect(maskedInput.selectionStart).toEqual(6);
            expect(maskedInput.selectionEnd).toEqual(8);
            maskedInput.moveFocus("right");
            expect(maskedInput.cursorPos).toEqual(6);
          });
        });
        describe("AND right Arrow key pressed, then left Arrow key pressed", () => {
          it("THEN 'focus' moves from unit to unit", () => {
            // prettier-ignore
            maskedInput.moveFocus("right");
            maskedInput.moveFocus("right");
            expect(maskedInput.cursorPos).toEqual(6);
            maskedInput.moveFocus("left");
            expect(maskedInput.cursorPos).toEqual(3);
            maskedInput.moveFocus("left");
            expect(maskedInput.cursorPos).toEqual(0);
          });
        });
        describe("AND digit entered followed by right key press", () => {
          it("THEN 'focus' moves from unit to unit", () => {
            // prettier-ignore
            maskedInput.update("2");
            maskedInput.moveFocus("right");
            maskedInput.update("3");
            maskedInput.moveFocus("right");
            maskedInput.update("4");

            if (mode === "uncontrolled") {
              expect(maskedInput.value).toEqual("20:30:40");
              expect(maskedInput.cursorPos).toEqual(7);
            }
          });
        });
      });
    });
  }
});
