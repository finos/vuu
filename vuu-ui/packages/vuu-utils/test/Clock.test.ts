import { describe, expect, it } from "vitest";
import { Clock } from "../src/Clock";

describe("Clock", () => {
  it("defaults to current date", () => {
    const today = new Date();
    const clock = new Clock();
    expect(clock.toString().slice(0, 10)).toEqual(
      today.toISOString().slice(0, 10),
    );
  });

  it("with all values specified, produces expected string value", () => {
    const clock = new Clock({
      year: 2025,
      month: 8,
      day: 1,
      hours: 14,
      minutes: 30,
      seconds: 5,
      milliseconds: 100,
    });
    expect(clock.toString()).toEqual("2025-08-01T14:30:05.100Z");
  });

  it("with date only specified, correctly defaults remaining values", () => {
    const clock = new Clock({
      year: 2025,
      month: 8,
      day: 1,
    });
    expect(clock.toString()).toEqual("2025-08-01T00:00:00.000Z");
  });
  it("with date and hours only specified, correctly defaults remaining values", () => {
    const clock = new Clock({
      year: 2025,
      month: 8,
      day: 1,
      hours: 13,
    });
    expect(clock.toString()).toEqual("2025-08-01T13:00:00.000Z");
  });
  it("with date, hours and minutes only specified, correctly defaults remaining values", () => {
    const clock = new Clock({
      year: 2025,
      month: 8,
      day: 1,
      hours: 13,
      minutes: 30,
    });
    expect(clock.toString()).toEqual("2025-08-01T13:30:00.000Z");
  });
  it("with everything except ms specified, correctly defaults ms", () => {
    const clock = new Clock({
      year: 2025,
      month: 8,
      day: 1,
      hours: 13,
      minutes: 30,
      seconds: 59,
    });
    expect(clock.toString()).toEqual("2025-08-01T13:30:59.000Z");
  });
});
