import { describe, expect, it } from "vitest";
import { getPctScrollTop } from "../src/useTableScroll";

describe("getPctScrollTop", () => {
  it("returns proportional position within the scroll range", () => {
    expect(getPctScrollTop(500, 1000)).toBe(0.5);
  });
  it("returns 0 when there is no scroll range", () => {
    expect(getPctScrollTop(0, 0)).toBe(0);
    expect(getPctScrollTop(10, -5)).toBe(0);
  });
  it("snaps to 0 when within rounding distance of the top", () => {
    expect(getPctScrollTop(1, 33_218_005)).toBe(0);
  });
  it("snaps to 1 when within rounding distance of the end", () => {
    expect(getPctScrollTop(33_218_004, 33_218_005)).toBe(1);
    expect(getPctScrollTop(33_218_006, 33_218_005)).toBe(1);
  });
});
