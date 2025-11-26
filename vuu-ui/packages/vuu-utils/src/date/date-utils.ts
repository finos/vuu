import { CalendarDate } from "@internationalized/date";

export function toCalendarDate(d: Date) {
  return new CalendarDate(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

export type oneToFive = 1 | 2 | 3 | 4 | 5;
export type zeroToFive = 0 | oneToFive;
export type sixToNine = 6 | 7 | 8 | 9;
export type zeroToNine = zeroToFive | sixToNine;
export type oneToNine = oneToFive | sixToNine;
export type TimeUnit = "hours" | "minutes" | "seconds";
export type Hours = `${0 | 1}${zeroToNine}` | `2${0 | 1 | 2 | 3}`;
export type Minutes = `${zeroToFive}${zeroToNine}`;
export type Seconds = `${zeroToFive}${zeroToNine}`;

export type TimeUnitValue<T extends TimeUnit> = T extends "hours"
  ? Hours
  : T extends "minutes"
    ? Minutes
    : Seconds;

// This should work, works fine in TypeScript playground, but hangs tsc
// export type TimeString = `${Hours}:${Minutes}:${Seconds}`;
export type TimeString =
  `${number}${number}:${number}${number}:${number}${number}`;

type YYYY = `19${zeroToNine}${zeroToNine}` | `20${zeroToNine}${zeroToNine}`;
type MM = `0${oneToNine}` | `1${0 | 1 | 2}`;
type DD = `${0}${oneToNine}` | `${1 | 2}${zeroToNine}` | `3${0 | 1}`;

export type DateStringISO = `${YYYY}-${MM}-${DD}`;

export const zeroTime: TimeString = "00:00:00";
export const zeroTimeUnit: TimeUnitValue<TimeUnit> = "00";

export function incrementTimeUnitValue<T extends TimeUnit>(
  unit: T,
  value: TimeUnitValue<T>,
) {
  const num = parseInt(value);
  if (unit === "hours" && num < 23) {
    return `${num + 1}`.padStart(2, "0").slice(-2) as Hours;
  } else if (unit === "hours" && num === 23) {
    return "00" as Hours;
  } else if (num < 59) {
    return `${num + 1}`.padStart(2, "0").slice(-2) as TimeUnitValue<T>;
  } else if (num === 59) {
    return "00" as TimeUnitValue<T>;
  }
  return value;
}

export function decrementTimeUnitValue<T extends TimeUnit>(
  unit: T,
  value: TimeUnitValue<T>,
) {
  const num = parseInt(value);
  if (unit === "hours" && num > 0) {
    return `${num - 1}`.padStart(2, "0").slice(-2) as Hours;
  } else if (unit === "hours" && num === 0) {
    return "23" as Hours;
  } else if (num > 0) {
    return `${num - 1}`.padStart(2, "0").slice(-2) as TimeUnitValue<T>;
  } else if (num === 0) {
    return "59" as TimeUnitValue<T>;
  }
  return value;
}

// TODO accept numeric values with appropriate type checks
export function updateTimeString<T extends TimeUnit>(
  timeString: TimeString,
  unit: T,
  value: TimeUnitValue<T>,
): TimeString {
  const newTimeString =
    unit === "hours"
      ? value.concat(timeString.slice(2))
      : unit === "minutes"
        ? timeString.slice(0, 3).concat(value).concat(timeString.slice(5))
        : timeString.slice(0, 6).concat(value);
  if (isValidTimeString(newTimeString)) {
    return newTimeString;
  } else {
    throw Error(`[date-utils] udateTimeSting invalid result ${newTimeString}`);
  }
}

const validTimePattern = /(?:[0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]/;
export const isValidTimeString = (value: unknown): value is TimeString =>
  typeof value === "string" && validTimePattern.test(value);

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
  asDate: (date?: Date | DateStringISO) => Date;
}

const padZero = (val: number) => `${val}`.padStart(2, "0");

class TimeImpl implements Time {
  #hours: number;
  #minutes: number;
  #seconds: number;

  constructor(timeString: TimeString) {
    const [hours, minutes, seconds] = timeString.split(":");
    this.#hours = parseInt(hours);
    this.#minutes = parseInt(minutes);
    this.#seconds = parseInt(seconds);
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
    dt.setMilliseconds(0);
    return dt;
  }

  toString() {
    return Time.toString(this.#hours, this.#minutes, this.#seconds);
  }
}

export const Time = (timeString: TimeString): Time =>
  new TimeImpl(timeString) as Time;

Time.millisToTimeString = (timestamp: number) =>
  new Date(timestamp).toTimeString().slice(0, 8) as TimeString;

Time.toString = (hours: number, minutes: number, seconds: number) => {
  return `${padZero(hours)}:${padZero(minutes)}:${padZero(seconds)}` as TimeString;
};
