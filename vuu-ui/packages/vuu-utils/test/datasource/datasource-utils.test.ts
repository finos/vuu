import { describe, expect, it } from "vitest";
import {
  createSessionTableParams,
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

describe("createSessionTableParams", () => {
  it("includes only copyOption and sessionType when no overrides are supplied", () => {
    expect(createSessionTableParams("All", "edit")).toEqual({
      copyOption: "All",
      sessionType: "edit",
    });
  });

  it("ignores overrides that carry no blueprint params", () => {
    expect(
      createSessionTableParams("Empty", "import", { columns: ["ric"] }),
    ).toEqual({ copyOption: "Empty", sessionType: "import" });
  });

  it("includes sessionTableName and joins columnsToCopy", () => {
    expect(
      createSessionTableParams("Selected", "export", {
        sessionTableName: "export-orders",
        columnsToCopy: ["orderId", "ric"],
      }),
    ).toEqual({
      copyOption: "Selected",
      sessionType: "export",
      sessionTableName: "export-orders",
      columnsToCopy: "orderId,ric",
    });
  });

  it('passes columnsToCopy "*" through unchanged', () => {
    expect(
      createSessionTableParams("All", "edit", { columnsToCopy: "*" }),
    ).toEqual({ copyOption: "All", sessionType: "edit", columnsToCopy: "*" });
  });
});
