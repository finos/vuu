import { CalendarDate } from "@internationalized/date";

export function toCalendarDate(d: Date) {
  return new CalendarDate(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

type oneToFive = 1 | 2 | 3 | 4 | 5;
type zeroToFive = 0 | oneToFive;
type sixToNine = 6 | 7 | 8 | 9;
type zeroToNine = zeroToFive | sixToNine;
type oneToNine = oneToFive | sixToNine;

type Hours = `${0 | 1}${zeroToNine}` | `2${0 | 1 | 2 | 3}`;
type Minutes = `${zeroToFive}${zeroToNine}`;
type Seconds = `${zeroToFive}${zeroToNine}`;

export type TimeString = `${Hours}:${Minutes}:${Seconds}`;

type YYYY = `19${zeroToNine}${zeroToNine}` | `20${zeroToNine}${zeroToNine}`;
type MM = `0${oneToNine}` | `1${0 | 1 | 2}`;
type DD = `${0}${oneToNine}` | `${1 | 2}${zeroToNine}` | `3${0 | 1}`;

export type DateStringISO = `${YYYY}-${MM}-${DD}`;

const validTimeShape = /\d\d:\d\d:\d\d/;
const validTimePattern = /(?:[0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]/;
export const stringIsTimeShaped = (val: string) => validTimeShape.test(val);
export const stringIsValidTime = (val: string): val is TimeString =>
  validTimePattern.test(val);
export const stringIsInvalidTime = (val: string) =>
  stringIsTimeShaped(val) && !stringIsValidTime(val);

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
    return `${padZero(this.#hours)}:${padZero(this.#minutes)}:${padZero(this.#seconds)}`;
  }
}

export const Time = (timeString: TimeString): Time =>
  new TimeImpl(timeString) as Time;
