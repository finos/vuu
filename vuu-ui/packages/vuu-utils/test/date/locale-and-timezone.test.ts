import { describe, expect, it } from "vitest";
import {
  localeOptions,
  timeZoneOptions,
  validateLocaleOrGetDefault,
  validateTimeZoneOrGetDefault,
} from "../../src/date/locale-and-timezone";

const defaultResolvedOptions = Intl.DateTimeFormat().resolvedOptions();

describe("validateLocaleOrGetDefault", () => {
  it("falls back to default when locale is invalid", () => {
    const actual = validateLocaleOrGetDefault("invalid-locale");

    expect(actual).toEqual(defaultResolvedOptions.locale);
  });

  it("returns locale unchanged when valid", () => {
    const actual = validateLocaleOrGetDefault("en-US");

    expect(actual).toEqual("en-US");
  });

  it("falls back to default when locale is undefined", () => {
    const actual = validateLocaleOrGetDefault(undefined);

    expect(actual).toEqual(defaultResolvedOptions.locale);
  });
});

describe("validateTimeZoneOrGetDefault", () => {
  it("falls back to default when time zone is invalid", () => {
    const actual = validateTimeZoneOrGetDefault("Invalid/London");

    expect(actual).toEqual(defaultResolvedOptions.timeZone);
  });

  it("returns time zone unchanged when valid", () => {
    const actual = validateTimeZoneOrGetDefault("Asia/Hong_Kong");

    expect(actual).toEqual("Asia/Hong_Kong");
  });

  it("falls back to default when time zone is undefined", () => {
    const actual = validateTimeZoneOrGetDefault(undefined);

    expect(actual).toEqual(defaultResolvedOptions.timeZone);
  });
});

describe("timezone/locale options", () => {
  it.each(timeZoneOptions)("timezone option $timeZone is valid", (timeZone) => {
    expect(validateTimeZoneOrGetDefault(timeZone)).toEqual(timeZone);
  });

  it.each(localeOptions)("locale option $locale is valid", (locale) => {
    expect(validateLocaleOrGetDefault(locale)).toEqual(locale);
  });
});
