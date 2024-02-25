import { describe, expect, it } from "vitest";
import { isConfigChanged, NO_CONFIG_CHANGES } from "../src/datasource-utils";

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
          { filter: { filter: 'ccy = "EUR"' } },
          { filter: { filter: 'ccy = "EUR"' } }
        ).noChanges
      ).toEqual(true);
      expect(
        isConfigChanged(
          {
            filter: { filter: 'ccy = "EUR"' },
            sort: { sortDefs: [{ column: "ric", sortType: "A" }] },
          },
          {
            sort: { sortDefs: [{ column: "ric", sortType: "A" }] },
            filter: { filter: 'ccy = "EUR"' },
          }
        ).noChanges
      ).toEqual(true);
    });
  });

  describe("WHEN filters only differ", () => {
    it("THEN it reports filter changed", () => {
      expect(
        isConfigChanged(
          { filter: { filter: 'ccy = "EUR"' } },
          { filter: { filter: 'ccy = "EUR"' } }
        ).noChanges
      ).toEqual(true);
      expect(
        isConfigChanged(
          { filter: { filter: 'ccy = "EUR"' } },
          { filter: { filter: 'ccy = "CAD"' } }
        )
      ).toEqual({
        ...NO_CONFIG_CHANGES,
        filterChanged: true,
        noChanges: false,
      });
    });
  });
});
