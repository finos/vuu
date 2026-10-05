import { CalendarDate } from "@internationalized/date";

export function toCalendarDate(d: Date) {
  return new CalendarDate(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

export type oneToFive = 1 | 2 | 3 | 4 | 5;
export type zeroToFive = 0 | oneToFive;
export type sixToNine = 6 | 7 | 8 | 9;
export type zeroToNine = zeroToFive | sixToNine;
export type oneToNine = oneToFive | sixToNine;
export type TimeUnit = "hours" | "minutes" | "seconds" | "milliseconds";
export type Hours = `${0 | 1}${zeroToNine}` | `2${0 | 1 | 2 | 3}`;
export type Minutes = `${zeroToFive}${zeroToNine}`;
export type Seconds = `${zeroToFive}${zeroToNine}`;
export type Milliseconds = `${zeroToNine}${zeroToNine}${zeroToNine}`;

export type TimeUnitValue<T extends TimeUnit> = T extends "hours"
  ? Hours
  : T extends "minutes"
    ? Minutes
    : T extends "seconds"
      ? Seconds
      : Milliseconds;

// This should work, works fine in TypeScript playground, but hangs tsc
// export type TimeString = `${Hours}:${Minutes}:${Seconds}`;
export type TimeString =
  `${number}${number}:${number}${number}:${number}${number}`;
/**
 * A TimeString with millisecond precision, hh:mm:ss.SSS
 */
export type TimeStringMillis = `${TimeString}.${number}${number}${number}`;

type YYYY = `19${zeroToNine}${zeroToNine}` | `20${zeroToNine}${zeroToNine}`;
type MM = `0${oneToNine}` | `1${0 | 1 | 2}`;
type DD = `${0}${oneToNine}` | `${1 | 2}${zeroToNine}` | `3${0 | 1}`;

export type DateStringISO = `${YYYY}-${MM}-${DD}`;

export const zeroTime: TimeString = "00:00:00";
export const zeroTimeMillis: TimeStringMillis = "00:00:00.000";
export const zeroTimeUnit: TimeUnitValue<TimeUnit> = "00";

const unitMaxValue: Record<TimeUnit, number> = {
  hours: 23,
  minutes: 59,
  seconds: 59,
  milliseconds: 999,
};

const unitLength = (unit: TimeUnit) => (unit === "milliseconds" ? 3 : 2);

export function incrementTimeUnitValue<T extends TimeUnit>(
  unit: T,
  value: TimeUnitValue<T>,
) {
  const num = parseInt(value);
  const newValue = num >= unitMaxValue[unit] ? 0 : num + 1;
  return `${newValue}`.padStart(unitLength(unit), "0") as TimeUnitValue<T>;
}

export function decrementTimeUnitValue<T extends TimeUnit>(
  unit: T,
  value: TimeUnitValue<T>,
) {
  const num = parseInt(value);
  const newValue = num <= 0 ? unitMaxValue[unit] : num - 1;
  return `${newValue}`.padStart(unitLength(unit), "0") as TimeUnitValue<T>;
}

// TODO accept numeric values with appropriate type checks
export function updateTimeString<
  S extends TimeString | TimeStringMillis,
  T extends TimeUnit,
>(timeString: S, unit: T, value: TimeUnitValue<T>): S {
  const newTimeString =
    unit === "hours"
      ? value.concat(timeString.slice(2))
      : unit === "minutes"
        ? timeString.slice(0, 3).concat(value).concat(timeString.slice(5))
        : unit === "seconds"
          ? timeString.slice(0, 6).concat(value).concat(timeString.slice(8))
          : timeString.slice(0, 9).concat(value);
  if (
    isValidTimeString(newTimeString) ||
    isValidTimeStringMillis(newTimeString)
  ) {
    return newTimeString as S;
  } else {
    throw Error(`[date-utils] udateTimeSting invalid result ${newTimeString}`);
  }
}

const validTimePattern = /^(?:[0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;
const validTimeMillisPattern =
  /^(?:[0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]\.[0-9]{3}$/;

export const isValidTimeString = (value: unknown): value is TimeString =>
  typeof value === "string" && validTimePattern.test(value);

export const isValidTimeStringMillis = (
  value: unknown,
): value is TimeStringMillis =>
  typeof value === "string" && validTimeMillisPattern.test(value);

/**
 * Convert a valid TimeString or TimeStringMillis to the required precision.
 * Milliseconds are added (as 000) or removed as necessary. Returns undefined
 * if value is not a valid time.
 */
export function normaliseTimeString(
  value: unknown,
  milliseconds: true,
): TimeStringMillis | undefined;
export function normaliseTimeString(
  value: unknown,
  milliseconds?: false,
): TimeString | undefined;
export function normaliseTimeString(
  value: unknown,
  milliseconds?: boolean,
): TimeString | TimeStringMillis | undefined;
export function normaliseTimeString(
  value: unknown,
  milliseconds = false,
): TimeString | TimeStringMillis | undefined {
  if (isValidTimeString(value)) {
    return milliseconds ? `${value}.000` : value;
  } else if (isValidTimeStringMillis(value)) {
    return milliseconds ? value : (value.slice(0, 8) as TimeString);
  }
}

export function asTimeString(value: unknown, allowUndefined: false): TimeString;
export function asTimeString(
  value: unknown,
  allowUndefined?: true,
): TimeString | undefined;
export function asTimeString(
  value: unknown,
  allowUndefined = false,
): TimeString | undefined {
  if (value === undefined) {
    if (allowUndefined) {
      return value;
    } else {
      throw Error("[date-utils] asTimeString, value cannot be undefined");
    }
  } else if (isValidTimeString(value)) {
    return value;
  } else if (typeof value === "number") {
    // we are assuming we have a value representing milliseconds since epoch.
    // If not, we will get an unpredictable time here. Is this too risky ?
    return Time.millisToTimeString(value);
  } else if (typeof value === "string") {
    // see if we have a long value, test if we can create time
    const valueAsInt = parseInt(value);
    if (!isNaN(valueAsInt)) {
      return Time.millisToTimeString(valueAsInt);
    }
  } else {
    throw Error(
      `[date-utils] asTimeString, value ${value} is not valid TimeString`,
    );
  }
}

export interface Time {
  hours: number;
  minutes: number;
  seconds: number;
  milliseconds: number;
  asDate: (date?: Date | DateStringISO) => Date;
}

const padZero = (val: number) => `${val}`.padStart(2, "0");

class TimeImpl implements Time {
  #hours: number;
  #minutes: number;
  #seconds: number;
  #milliseconds: number | undefined;

  constructor(timeString: TimeString | TimeStringMillis) {
    const [hours, minutes, secondsAndMillis] = timeString.split(":");
    const [seconds, milliseconds] = secondsAndMillis.split(".");
    this.#hours = parseInt(hours);
    this.#minutes = parseInt(minutes);
    this.#seconds = parseInt(seconds);
    this.#milliseconds =
      milliseconds === undefined ? undefined : parseInt(milliseconds);
  }

  get hours() {
    return this.#hours;
  }
  get minutes() {
    return this.#minutes;
  }
  get seconds() {
    return this.#seconds;
  }
  get milliseconds() {
    return this.#milliseconds ?? 0;
  }

  asDate(date?: Date | DateStringISO) {
    const dt =
      date === undefined
        ? new Date()
        : typeof date === "string"
          ? new Date(date)
          : date;

    dt.setHours(this.#hours);
    dt.setMinutes(this.#minutes);
    dt.setSeconds(this.seconds);
    dt.setMilliseconds(this.milliseconds);
    return dt;
  }

  toString() {
    return Time.toString(
      this.#hours,
      this.#minutes,
      this.#seconds,
      this.#milliseconds,
    );
  }
}

export const Time = (timeString: TimeString | TimeStringMillis): Time =>
  new TimeImpl(timeString) as Time;

Time.millisToTimeString = (timestamp: number) =>
  new Date(timestamp).toTimeString().slice(0, 8) as TimeString;

function timeToString(
  hours: number,
  minutes: number,
  seconds: number,
): TimeString;
function timeToString(
  hours: number,
  minutes: number,
  seconds: number,
  milliseconds: number,
): TimeStringMillis;
function timeToString(
  hours: number,
  minutes: number,
  seconds: number,
  milliseconds?: number,
): TimeString | TimeStringMillis;
function timeToString(
  hours: number,
  minutes: number,
  seconds: number,
  milliseconds?: number,
) {
  const timeString =
    `${padZero(hours)}:${padZero(minutes)}:${padZero(seconds)}` as TimeString;
  return milliseconds === undefined
    ? timeString
    : (`${timeString}.${`${milliseconds}`.padStart(3, "0")}` as TimeStringMillis);
}

Time.toString = timeToString;

Time.isDateInMillis = (dtInMillis: string | number): boolean => {
  const n = typeof dtInMillis === "number" ? dtInMillis : Number(dtInMillis);
  if (!Number.isFinite(n) || !Number.isInteger(n)) return false;

  return new Date(n).getTime() === n;
};
