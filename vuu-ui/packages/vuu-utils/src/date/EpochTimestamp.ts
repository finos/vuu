import {
  type DateTimeFields,
  fromDateTimeFields,
  getDateTimeFields,
  type TimeZoneSpec,
} from "./time-zone";

/**
 * How a temporal value is encoded on the wire (i.e in rows received from,
 * and values sent to, the server).
 * - epochMillis, a number (epochtimestamp, or legacy long with a date/time type)
 * - epochNanos, a string of digits (epochtimestampnano). Nanosecond values
 *   cannot be represented safely as JavaScript numbers. A bigint is also
 *   accepted where values are generated locally.
 */
export type TemporalEncoding = "epochMillis" | "epochNanos";

const NANOS_PER_MILLI = 1_000_000n;
const integerPattern = /^-?\d+$/;

/**
 * A timestamp with nanosecond precision. Internally represented as epoch
 * millis (floored) plus nanos within the milli, so the common millisecond
 * case requires no bigint arithmetic.
 *
 * Note: an empty value (null, undefined, '', 0, '0') is treated as 'no value'
 * by fromWire. The Vuu server uses 0 to represent an unset timestamp, so
 * the epoch itself (1970-01-01T00:00:00.000Z) cannot be represented.
 */
export class EpochTimestamp {
  readonly epochMillis: number;
  /** nanoseconds within the millisecond, 0 - 999,999 */
  readonly subMilliNanos: number;

  private constructor(epochMillis: number, subMilliNanos = 0) {
    this.epochMillis = epochMillis;
    this.subMilliNanos = subMilliNanos;
  }

  static fromMillis(epochMillis: number, subMilliNanos = 0) {
    const millis = Math.floor(epochMillis);
    return new EpochTimestamp(millis, subMilliNanos);
  }

  static fromNanos(epochNanos: bigint | string | number) {
    const nanos =
      typeof epochNanos === "bigint" ? epochNanos : BigInt(epochNanos);
    let millis = nanos / NANOS_PER_MILLI;
    let remainder = nanos % NANOS_PER_MILLI;
    if (remainder < 0n) {
      // bigint division truncates towards zero, we want floor
      millis -= 1n;
      remainder += NANOS_PER_MILLI;
    }
    return new EpochTimestamp(Number(millis), Number(remainder));
  }

  static fromDate(date: Date) {
    return new EpochTimestamp(date.getTime());
  }

  static fromFields(
    fields: Partial<DateTimeFields> &
      Pick<DateTimeFields, "year" | "month" | "day">,
    timeZone?: TimeZoneSpec,
    subMilliNanos = 0,
  ) {
    return new EpochTimestamp(
      fromDateTimeFields(fields, timeZone),
      subMilliNanos,
    );
  }

  /**
   * Returns true if value represents 'no value'.
   */
  static isEmpty(value: unknown) {
    return (
      value === null ||
      value === undefined ||
      value === "" ||
      value === 0 ||
      value === "0" ||
      value === 0n
    );
  }

  /**
   * Decode a value as received from the server, or held in a filter,
   * in the given encoding. Returns undefined for an empty or invalid value.
   */
  static fromWire(
    value: unknown,
    encoding: TemporalEncoding,
  ): EpochTimestamp | undefined {
    if (EpochTimestamp.isEmpty(value)) {
      return undefined;
    }
    if (value instanceof EpochTimestamp) {
      return value;
    }
    if (encoding === "epochNanos") {
      if (typeof value === "bigint") {
        return EpochTimestamp.fromNanos(value);
      } else if (typeof value === "string" && integerPattern.test(value)) {
        return EpochTimestamp.fromNanos(value);
      } else if (typeof value === "number" && Number.isFinite(value)) {
        return EpochTimestamp.fromNanos(BigInt(Math.trunc(value)));
      }
    } else {
      if (typeof value === "number" && Number.isFinite(value)) {
        return EpochTimestamp.fromMillis(value);
      } else if (typeof value === "bigint") {
        return EpochTimestamp.fromMillis(Number(value));
      } else if (typeof value === "string" && integerPattern.test(value)) {
        return EpochTimestamp.fromMillis(Number(value));
      }
    }
    return undefined;
  }

  get epochNanos(): bigint {
    return (
      BigInt(this.epochMillis) * NANOS_PER_MILLI + BigInt(this.subMilliNanos)
    );
  }

  toDate() {
    return new Date(this.epochMillis);
  }

  /**
   * Fraction of second, truncated to the requested number of digits
   */
  fractionalSecond(digits: number) {
    if (digits <= 0) {
      return "";
    }
    const millisOfSecond = ((this.epochMillis % 1000) + 1000) % 1000;
    const nineDigits = `${millisOfSecond}`
      .padStart(3, "0")
      .concat(`${this.subMilliNanos}`.padStart(6, "0"));
    return nineDigits.slice(0, Math.min(digits, 9));
  }

  getFields(timeZone?: TimeZoneSpec) {
    return getDateTimeFields(this.epochMillis, timeZone);
  }

  /**
   * Encode for the wire. epochMillis => number, epochNanos => string
   */
  toWire(encoding: "epochMillis"): number;
  toWire(encoding: "epochNanos"): string;
  toWire(encoding: TemporalEncoding): number | string;
  toWire(encoding: TemporalEncoding): number | string {
    return encoding === "epochNanos"
      ? this.epochNanos.toString()
      : this.epochMillis;
  }

  /**
   * Encode as a literal in a filter query (never quoted)
   */
  toLiteral(encoding: TemporalEncoding) {
    return `${this.toWire(encoding)}`;
  }

  /**
   * Add a number of the smallest unit for the encoding, i.e 1 milli or 1 nano.
   * Useful to convert inclusive to exclusive bounds.
   */
  addUnits(units: number, encoding: TemporalEncoding) {
    return encoding === "epochNanos"
      ? EpochTimestamp.fromNanos(this.epochNanos + BigInt(units))
      : EpochTimestamp.fromMillis(this.epochMillis + units, this.subMilliNanos);
  }

  compare(other: EpochTimestamp) {
    return this.epochMillis === other.epochMillis
      ? this.subMilliNanos - other.subMilliNanos
      : this.epochMillis - other.epochMillis;
  }

  equals(other?: EpochTimestamp) {
    return other !== undefined && this.compare(other) === 0;
  }

  toString() {
    const fraction = this.subMilliNanos
      ? this.fractionalSecond(9)
      : this.fractionalSecond(3);
    return this.toDate()
      .toISOString()
      .replace(/\.\d{3}Z$/, `.${fraction}Z`);
  }
}
