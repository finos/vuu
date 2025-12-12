import { describe, expect, it } from "vitest";
import { numericFormatter } from "../src/formatting-utils";
describe("formatting-utils", () => {
  describe("numericFormatter", () => {
    it("returns a numeric string as a numeric string", () => {
      const format = numericFormatter({ type: "number" });
      expect(format("12345")).toEqual("12345");
    });
    it("returns a numeric as a numeric string", () => {
      const format = numericFormatter({ type: "number" });
      expect(format(12345)).toEqual("12345");
    });
    it("leaves decimals intact with no config", () => {
      const format = numericFormatter({ type: "number" });
      expect(format(12345.6789)).toEqual("12345.6789");
    });
    it("preserves negative", () => {
      const format = numericFormatter({ type: "number" });
      expect(format("-12345")).toEqual("-12345");
      expect(format(-12345)).toEqual("-12345");
      expect(format(-12345.6789)).toEqual("-12345.6789");
      expect(format(-0.6789)).toEqual("-0.6789");
      expect(format("-0.05")).toEqual("-0.05");
    });
    it("allows decimal places to be configured", () => {
      const format = numericFormatter({
        type: {
          name: "number",
          formatting: {
            decimals: 2,
          },
        },
      });

      expect(format("-12345")).toEqual("-12,345");
      expect(format(-12345)).toEqual("-12,345");
      expect(format(-12345.6789)).toEqual("-12,345.68");
      expect(format(-12345.6)).toEqual("-12,345.6");
      expect(format(-0.064)).toEqual("-0.06");
      expect(format("-0.064")).toEqual("-0.06");
      expect(format("-0.06")).toEqual("-0.06");
      expect(format("-0.05")).toEqual("-0.05");
    });
    it("allows locale to be discounted for decimals", () => {
      const format = numericFormatter({
        type: {
          name: "number",
          formatting: {
            decimals: 2,
            useLocaleString: false,
          },
        },
      });
      expect(format("-12345")).toEqual("-12345");
      expect(format(-12345)).toEqual("-12345");
      expect(format(-12345.6789)).toEqual("-12345.68");
      expect(format(-12345.6)).toEqual("-12345.6");
      expect(format(-0.6)).toEqual("-0.6");
      expect(format("-0.65")).toEqual("-0.65");
    });
    it("supports zero padding decimals", () => {
      const format = numericFormatter({
        type: {
          name: "number",
          formatting: {
            decimals: 2,
            zeroPad: true,
          },
        },
      });
      expect(format("12345")).toEqual("12,345.00");
      expect(format(12345)).toEqual("12,345.00");
      expect(format(12345.6789)).toEqual("12,345.68");
      expect(format(12345.6)).toEqual("12,345.60");
      expect(format("-12345")).toEqual("-12,345.00");
      expect(format(-12345)).toEqual("-12,345.00");
      expect(format(-12345.6789)).toEqual("-12,345.68");
      expect(format(-12345.6)).toEqual("-12,345.60");

      const format2 = numericFormatter({
        type: {
          name: "number",
          formatting: {
            decimals: 2,
            zeroPad: true,
            useLocaleString: false,
          },
        },
      });
      expect(format2("12345")).toEqual("12345.00");
      expect(format2(12345)).toEqual("12345.00");
      expect(format2(12345.6789)).toEqual("12345.68");
      expect(format2(12345.6)).toEqual("12345.60");
      expect(format2("-12345")).toEqual("-12345.00");
      expect(format2(-12345)).toEqual("-12345.00");
      expect(format2(-12345.6789)).toEqual("-12345.68");
      expect(format2(-0.6)).toEqual("-0.60");
    });
  });
});
