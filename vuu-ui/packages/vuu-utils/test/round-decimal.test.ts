import { describe, expect, it } from "vitest";

import { exceedsMaxSafeInteger } from "../src";

// MAX_SAFE_INTEGER = "9007199254740991";

describe("round-decimal", () => {
  describe("exceedsMaxSafeInteger", () => {
    it("evcaluates correctly agains max safe integer", () => {
      expect(exceedsMaxSafeInteger("100")).toEqual(false);
      expect(exceedsMaxSafeInteger("99999999")).toEqual(false);
      expect(exceedsMaxSafeInteger("9007199254740991")).toEqual(false);
      expect(exceedsMaxSafeInteger("9007199254740992")).toEqual(true);
      expect(exceedsMaxSafeInteger("10000000000000000")).toEqual(true);
    });
  });
});
