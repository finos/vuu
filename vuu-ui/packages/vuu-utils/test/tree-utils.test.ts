import { describe, expect, it } from "vitest";
import { metadataKeys } from "../src/column-utils";
import { treeToDataSourceRows } from "../src/tree-utils";

const { KEY } = metadataKeys;

describe("treeToDataSourceRows", () => {
  it("builds row keys from labels by default", () => {
    const [, rows] = treeToDataSourceRows([
      { id: "a", label: "A", childNodes: [{ id: "a/b", label: "B" }] },
    ]);
    expect(rows.map((row) => row[KEY])).toEqual(["$root|A", "$root|A|B"]);
  });
  it("builds row keys from keySegment when provided, label is displayed", () => {
    const [, rows] = treeToDataSourceRows([
      {
        id: "Table",
        keySegment: "Table",
        label: "Tables",
        childNodes: [
          { id: "Table/Pinned", keySegment: "Pinned", label: "Pinned columns" },
        ],
      },
    ]);
    expect(rows.map((row) => row[KEY])).toEqual([
      "$root|Table",
      "$root|Table|Pinned",
    ]);
    expect(rows[1].at(-1)).toEqual("Pinned columns");
  });
});
