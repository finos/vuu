import { describe, expect, it } from "vitest";
import {
  isConfigChanged,
  NO_CONFIG_CHANGES,
} from "../../src/datasource/datasource-utils";

describe("datasource-utils", () => {
  describe("WHEN configs are empty", () => {
    it("reports no change", () => {
      const result = isConfigChanged({}, {});
      expect(result.noChanges).toEqual(true);
    });
  });

  describe("WHEN configs match", () => {
    it("reports no change", () => {
      expect(
        isConfigChanged(
          { filterSpec: { filter: 'ccy = "EUR"' } },
          { filterSpec: { filter: 'ccy = "EUR"' } },
        ).noChanges,
      ).toEqual(true);
      expect(
        isConfigChanged(
          {
            filterSpec: { filter: 'ccy = "EUR"' },
            sort: { sortDefs: [{ column: "ric", sortType: "A" }] },
          },
          {
            sort: { sortDefs: [{ column: "ric", sortType: "A" }] },
            filterSpec: { filter: 'ccy = "EUR"' },
          },
        ).noChanges,
      ).toEqual(true);
    });
  });

  describe("WHEN filters only differ", () => {
    it("THEN it reports filter changed", () => {
      expect(
        isConfigChanged(
          { filterSpec: { filter: 'ccy = "EUR"' } },
          { filterSpec: { filter: 'ccy = "EUR"' } },
        ).noChanges,
      ).toEqual(true);
      expect(
        isConfigChanged(
          { filterSpec: { filter: 'ccy = "EUR"' } },
          { filterSpec: { filter: 'ccy = "CAD"' } },
        ),
      ).toEqual({
        ...NO_CONFIG_CHANGES,
        filterChanged: true,
        noChanges: false,
      });
    });
  });
});
