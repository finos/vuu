import { describe, expect, it } from "vitest";
import { calculateBadgeState } from "../src/freeze-control/freezeControlBadge";

describe("calculateBadgeState", () => {
  describe("WHEN newRecordCount is 0", () => {
    it("THEN badgeValue is 0 and isOverflow is false", () => {
      const result = calculateBadgeState(0);
      expect(result.badgeValue).toBe(0);
      expect(result.isOverflow).toBe(false);
    });
  });

  describe("WHEN newRecordCount is less than 99", () => {
    it("THEN badgeValue equals newRecordCount and isOverflow is false", () => {
      const result = calculateBadgeState(50);
      expect(result.badgeValue).toBe(50);
      expect(result.isOverflow).toBe(false);
    });
  });

  describe("WHEN newRecordCount is exactly 99", () => {
    it("THEN badgeValue is 99 and isOverflow is false", () => {
      const result = calculateBadgeState(99);
      expect(result.badgeValue).toBe(99);
      expect(result.isOverflow).toBe(false);
    });
  });

  describe("WHEN newRecordCount is 100", () => {
    it("THEN badgeValue is 99 and isOverflow is true", () => {
      const result = calculateBadgeState(100);
      expect(result.badgeValue).toBe(99);
      expect(result.isOverflow).toBe(true);
    });
  });

  describe("WHEN newRecordCount is greater than 100", () => {
    it("THEN badgeValue is 99 and isOverflow is true", () => {
      const result = calculateBadgeState(150);
      expect(result.badgeValue).toBe(99);
      expect(result.isOverflow).toBe(true);
    });

    it("THEN works for very large numbers", () => {
      const result = calculateBadgeState(99999999999999);
      expect(result.badgeValue).toBe(99);
      expect(result.isOverflow).toBe(true);
    });
  });
});
