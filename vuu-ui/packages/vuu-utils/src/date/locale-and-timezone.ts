import { logger } from "../logging-utils";

const { warn } = logger("Date/time validation");

type LocaleAndTimeZone = { locale: string; timeZone: string };
type AttributeType = keyof LocaleAndTimeZone;

export function getDefaultLocaleAndTimeZone(): LocaleAndTimeZone {
  return Intl.DateTimeFormat().resolvedOptions();
}

function validateOrGetDefault(type: AttributeType, value?: string): string {
  const { locale, options } =
    type === "locale"
      ? { locale: value, options: {} }
      : { locale: undefined, options: { [type]: value } };

  try {
    // if invalid it either throws or falls back to default locale/timeZone
    return Intl.DateTimeFormat(locale, options).resolvedOptions()[type];
  } catch (_) {
    return getDefaultLocaleAndTimeZone()[type];
  }
}

function validateOrGetDefaultWithWarning(
  type: AttributeType,
  value?: string
): string {
  const validatedValue = validateOrGetDefault(type, value);

  if (value !== undefined && value !== validatedValue) {
    warn?.(`Invalid ${type} ${value} passed. Falling back to user's default.`);
  }

  return validatedValue;
}

export function validateLocaleOrGetDefault(locale?: string): string {
  return validateOrGetDefaultWithWarning("locale", locale);
}

export function validateTimeZoneOrGetDefault(timeZone?: string): string {
  return validateOrGetDefaultWithWarning("timeZone", timeZone);
}

export const localeOptions = [
  "de-DE",
  "en-GB",
  "en-US",
  "ja-JP",
  "zh-Hans-CN",
] as const;

export const timeZoneOptions = [
  "America/Los_Angeles",
  "America/New_York",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Australia/Perth",
  "Europe/Berlin",
  "Europe/London",
] as const;
