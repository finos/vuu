import { describe, expect, it } from "vitest";
import {
  highlightText,
  SearchIndex,
  toWords,
  withinOneEdit,
} from "../src/showcase-main/command-palette/search-engine";

describe("toWords", () => {
  it("splits camelCase, kebab-case and acronyms", () => {
    expect(toWords("--vuuTablePinnedColumn-borderColor")).toEqual([
      "vuu",
      "table",
      "pinned",
      "column",
      "border",
      "color",
    ]);
    expect(toWords("SIMULTable HTMLInput")).toEqual([
      "simul",
      "table",
      "html",
      "input",
    ]);
  });
});

describe("withinOneEdit", () => {
  it.each([
    ["pinned", "pinned", true],
    ["pined", "pinned", true],
    ["pinnde", "pinned", true],
    ["pinnex", "pinned", true],
    ["pinnedd", "pinned", true],
    ["pnned", "pinned", true],
    ["pine", "pinned", false],
    ["column", "pinned", false],
  ])("%s ~ %s is %s", (a, b, expected) => {
    expect(withinOneEdit(a, b)).toBe(expected);
  });
});

describe("SearchIndex", () => {
  type Item = { title: string; body?: string };
  const items: Item[] = [
    { title: "PinnedColumns", body: "Table columns" },
    { title: "SearchWithPin" },
    { title: "Instruments", body: "pinned to the left" },
    { title: "AutoTable" },
  ];
  const index = new SearchIndex(items, ({ body = "", title }) => [
    { text: title, weight: 10 },
    { text: body, weight: 2 },
  ]);
  const titles = (query: string) =>
    index.search(query).map(({ item }) => item.title);

  it("requires every term to match and ranks title matches first", () => {
    expect(titles("pinned")).toEqual(["PinnedColumns", "Instruments"]);
    expect(titles("pinned col")).toEqual(["PinnedColumns"]);
  });

  it("matches word prefixes and substrings", () => {
    // an exact word outranks a word prefix
    expect(titles("pin")).toEqual([
      "SearchWithPin",
      "PinnedColumns",
      "Instruments",
    ]);
    expect(titles("utotab")).toEqual(["AutoTable"]);
  });

  it("tolerates a typo in longer terms", () => {
    expect(titles("pinend")).toEqual(["PinnedColumns", "Instruments"]);
  });

  it("returns nothing for an empty query", () => {
    expect(index.search("  ")).toEqual([]);
  });
});

describe("highlightText", () => {
  it("marks every occurrence of every term, merging overlaps", () => {
    expect(highlightText("SearchAndPinned", "pin and")).toEqual([
      { text: "Search" },
      { match: true, text: "AndPin" },
      { text: "ned" },
    ]);
  });
});
