import type { DataSourceCallbackMessage } from "@vuu-ui/vuu-data-types";
import { metadataKeys, Range, type TreeSourceNode } from "@vuu-ui/vuu-utils";
import { describe, expect, it } from "vitest";
import { TreeDataSource } from "../src/tree-data-source/TreeDataSource";

const { DEPTH, IS_EXPANDED, KEY } = metadataKeys;

const source: TreeSourceNode[] = [
  {
    id: "a",
    label: "A",
    childNodes: [
      {
        id: "a/b",
        label: "B",
        childNodes: [
          { id: "a/b/x", label: "X", nodeData: { tag: "match" } },
          { id: "a/b/y", label: "Y" },
        ],
      },
      {
        id: "a/c",
        label: "C",
        childNodes: [{ id: "a/c/z", label: "Z", nodeData: { tag: "match" } }],
      },
    ],
  },
  { id: "d", label: "D" },
];

const createDataSource = async () => {
  const dataSource = new TreeDataSource({ data: source });
  let rows: unknown[][] = [];
  await dataSource.subscribe(
    { range: Range(0, 100) },
    (message: DataSourceCallbackMessage) => {
      if (message.type === "viewport-update" && message.rows) {
        rows = message.rows as unknown[][];
      }
    },
  );
  return {
    dataSource,
    keys: () => rows.map((row) => row[KEY]),
    rows: () => rows,
  };
};

describe("TreeDataSource", () => {
  describe("filterNodes", () => {
    it("shows matching nodes with their ancestors, each once", async () => {
      const { dataSource, keys } = await createDataSource();
      dataSource.filterNodes(
        ({ nodeData }) => (nodeData as { tag?: string })?.tag === "match",
      );
      expect(keys()).toEqual([
        "$root|A",
        "$root|A|B",
        "$root|A|B|X",
        "$root|A|C",
        "$root|A|C|Z",
      ]);
    });

    it("passes label, depth and key to the predicate", async () => {
      const { dataSource, keys } = await createDataSource();
      const visited: string[] = [];
      dataSource.filterNodes(({ depth, key, label }) => {
        visited.push(`${depth}:${label}:${key}`);
        return label === "D";
      });
      expect(visited).toContain("3:Y:$root|A|B|Y");
      expect(keys()).toEqual(["$root|D"]);
    });

    it("marks only folders as expanded", async () => {
      const { dataSource, rows } = await createDataSource();
      dataSource.filterNodes(({ label }) => label === "X");
      expect(rows().map((row) => [row[DEPTH], row[IS_EXPANDED]])).toEqual([
        [1, true],
        [2, true],
        [3, false],
      ]);
    });

    it("supports collapse and expand while filtered", async () => {
      const { dataSource, keys } = await createDataSource();
      dataSource.filterNodes(({ label }) => label === "X" || label === "Z");
      dataSource.closeTreeNode("$root|A|B");
      expect(keys()).toEqual([
        "$root|A",
        "$root|A|B",
        "$root|A|C",
        "$root|A|C|Z",
      ]);
      dataSource.openTreeNode("$root|A|B");
      expect(keys()).toHaveLength(5);
    });

    it("restores the unfiltered tree when cleared", async () => {
      const { dataSource, keys } = await createDataSource();
      dataSource.filterNodes(undefined);
      const unfiltered = keys();
      expect(unfiltered).toEqual(["$root|A", "$root|D"]);
      dataSource.filterNodes(({ label }) => label === "Z");
      dataSource.closeTreeNode("$root|A");
      dataSource.filterNodes(undefined);
      expect(keys()).toEqual(unfiltered);
    });
  });
});
