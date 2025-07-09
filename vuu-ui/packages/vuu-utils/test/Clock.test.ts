import { describe, expect, it } from "vitest";
import { Clock } from "../src/Clock";

describe("Clock", () => {
  describe("constructor", () => {
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

  describe("Clock.advance", () => {
    it("advances in milliseconds by default", () => {
      const clock = new Clock({
        year: 2025,
        month: 8,
        day: 1,
        hours: 14,
        minutes: 30,
      });
      clock.advance(100);
      expect(clock.toString()).toEqual("2025-08-01T14:30:00.100Z");
    });
    it("ms unit can be specified explicitly", () => {
      const clock = new Clock({
        year: 2025,
        month: 8,
        day: 1,
        hours: 14,
        minutes: 30,
      });
      clock.advance(150, "ms");
      expect(clock.toString()).toEqual("2025-08-01T14:30:00.150Z");
    });
    it("advances in seconds", () => {
      const clock = new Clock({
        year: 2025,
        month: 8,
        day: 1,
        hours: 14,
        minutes: 30,
      });
      clock.advance(10, "seconds");
      expect(clock.toString()).toEqual("2025-08-01T14:30:10.000Z");
    });
    it("can advance many minutes", () => {
      const clock = new Clock({
        year: 2025,
        month: 8,
        day: 1,
        hours: 14,
        minutes: 30,
      });
      clock.advance(185, "minutes");
      expect(clock.toString()).toEqual("2025-08-01T17:35:00.000Z");
    });
  });
});
