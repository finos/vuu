import type { TreeNodeFilterProps } from "@vuu-ui/vuu-data-local";
import { describe, expect, it } from "vitest";
import {
  isNavFilterActive,
  matchesNavFilter,
  type NavFilterContext,
} from "../src/showcase-main/tree-nav/nav-filter";

const paths: Record<string, string> = {
  "k-pinned": "/Table/Columns/PinnedColumns",
  "k-table": "/Table",
  "k-live": "/Table/BigData/LiveTable",
};

const context: NavFilterContext = {
  favourites: ["/Table/Columns/PinnedColumns"],
  pathForKey: (key) => paths[key],
  recent: ["/Table/BigData/LiveTable"],
};

const node = (
  key: string,
  label: string,
  nodeData: unknown = {},
): TreeNodeFilterProps => ({ depth: 3, key, label, nodeData });

const pinned = node("k-pinned", "Pinned columns", {
  description: "Columns fixed to the left edge",
  tags: ["sticky"],
});
const live = node("k-live", "Live table", { live: true });

describe("matchesNavFilter", () => {
  it("matches label, tags and description, case insensitive", () => {
    const match = (query: string) =>
      matchesNavFilter({ query }, context, pinned);
    expect(match("PINNED")).toBe(true);
    expect(match("sticky")).toBe(true);
    expect(match("left edge")).toBe(true);
    expect(match("grid")).toBe(false);
  });
  it("matches the names of ancestor folders", () => {
    expect(matchesNavFilter({ query: "columns" }, context, live)).toBe(false);
    expect(matchesNavFilter({ query: "bigdata" }, context, live)).toBe(true);
  });
  it("treats regex characters literally", () => {
    expect(matchesNavFilter({ query: ".*" }, context, pinned)).toBe(false);
  });
  it("never matches headings", () => {
    const heading = node("k-h", "Components", { heading: true });
    expect(matchesNavFilter({ query: "comp" }, context, heading)).toBe(false);
  });
  it("applies chips, combined with any query", () => {
    expect(matchesNavFilter({ chip: "live", query: "" }, context, live)).toBe(
      true,
    );
    expect(matchesNavFilter({ chip: "live", query: "" }, context, pinned)).toBe(
      false,
    );
    expect(
      matchesNavFilter({ chip: "favourites", query: "" }, context, pinned),
    ).toBe(true);
    expect(
      matchesNavFilter({ chip: "favourites", query: "" }, context, live),
    ).toBe(false);
    expect(
      matchesNavFilter({ chip: "recent", query: "live" }, context, live),
    ).toBe(true);
    expect(
      matchesNavFilter({ chip: "recent", query: "x" }, context, live),
    ).toBe(false);
  });
  it("filters test fixtures", () => {
    const fixture = node("k-pinned", "Pinned columns", {
      fixtureFor: ["packages/a.playwright.test.tsx"],
    });
    expect(
      matchesNavFilter({ chip: "fixtures", query: "" }, context, fixture),
    ).toBe(true);
    expect(
      matchesNavFilter({ chip: "fixtures", query: "" }, context, pinned),
    ).toBe(false);
  });
});

describe("isNavFilterActive", () => {
  it("is active with a query or chip", () => {
    expect(isNavFilterActive({ query: "  " })).toBe(false);
    expect(isNavFilterActive({ query: "a" })).toBe(true);
    expect(isNavFilterActive({ chip: "live", query: "" })).toBe(true);
  });
});
