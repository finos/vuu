import { afterEach, describe, expect, it, vi } from "vitest";
import {
  CHROME_MODE_STORAGE_KEY,
  clampNavWidth,
  getInitialChromeMode,
  getStoredNavWidth,
  NAV_WIDTH_DEFAULT,
  NAV_WIDTH_MAX,
  NAV_WIDTH_MIN,
  NAV_WIDTH_STORAGE_KEY,
  storeNavWidth,
} from "../src/showcase-main/chrome/chrome-settings";

const mockPrefersDark = (matches: boolean) =>
  vi.spyOn(window, "matchMedia").mockImplementation(
    (query: string) =>
      ({
        matches,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }) as unknown as MediaQueryList,
  );

afterEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe("nav width", () => {
  it("clamps to the allowed range", () => {
    expect(clampNavWidth(100)).toEqual(NAV_WIDTH_MIN);
    expect(clampNavWidth(1000)).toEqual(NAV_WIDTH_MAX);
    expect(clampNavWidth(300.6)).toEqual(301);
  });
  it("defaults when nothing valid is stored", () => {
    expect(getStoredNavWidth()).toEqual(NAV_WIDTH_DEFAULT);
    window.localStorage.setItem(NAV_WIDTH_STORAGE_KEY, "abc");
    expect(getStoredNavWidth()).toEqual(NAV_WIDTH_DEFAULT);
  });
  it("round trips a clamped width", () => {
    storeNavWidth(310);
    expect(getStoredNavWidth()).toEqual(310);
    storeNavWidth(5000);
    expect(window.localStorage.getItem(NAV_WIDTH_STORAGE_KEY)).toEqual(
      `${NAV_WIDTH_MAX}`,
    );
  });
});

describe("chrome mode", () => {
  it("follows the OS preference when no choice is stored", () => {
    mockPrefersDark(true);
    expect(getInitialChromeMode()).toEqual("dark");
    mockPrefersDark(false);
    expect(getInitialChromeMode()).toEqual("light");
  });
  it("prefers an explicit stored choice", () => {
    mockPrefersDark(true);
    window.localStorage.setItem(CHROME_MODE_STORAGE_KEY, "light");
    expect(getInitialChromeMode()).toEqual("light");
  });
});
