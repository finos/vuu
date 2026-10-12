import fs from "fs";
import os from "os";
import path from "path";
import type { TreeSourceNode } from "@vuu-ui/vuu-utils";
import { afterAll, afterEach, describe, expect, it } from "vitest";
import {
  applyExampleHistory,
  syncExampleHistory,
  updateExampleHistory,
} from "../scripts/example-history";
import type { NodeData } from "../scripts/treeSourceFromFileSystem";

const example = (id: string): TreeSourceNode<NodeData> => ({
  id,
  label: id,
  nodeData: { componentName: id.split("/").pop() },
});

const tree = (): TreeSourceNode<NodeData>[] => [
  {
    id: "Table",
    label: "Table",
    nodeData: { path: "Table/Index.mdx" },
    childNodes: [example("Table/A"), example("Table/B")],
  },
  example("C"),
];

describe("example-history", () => {
  it("adds new examples with the given date, keeps known dates, drops removed", () => {
    const { added, history, removed } = updateExampleHistory(
      { "Table/A": "2024-01-01", Gone: "2023-01-01" },
      tree(),
      "2026-10-12",
    );
    expect(added).toEqual(["Table/B", "C"]);
    expect(removed).toEqual(["Gone"]);
    expect(history).toEqual({
      C: "2026-10-12",
      "Table/A": "2024-01-01",
      "Table/B": "2026-10-12",
    });
    expect(Object.keys(history)).toEqual(["C", "Table/A", "Table/B"]);
  });

  it("can date new examples individually", () => {
    const { history } = updateExampleHistory({}, tree(), ({ id }) =>
      id === "C" ? "2020-02-02" : undefined,
    );
    expect(history.C).toBe("2020-02-02");
    expect(history["Table/A"]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("records dates on examples only", () => {
    const nodes = tree();
    applyExampleHistory(nodes, { "Table/A": "2024-01-01", Table: "x" });
    expect(nodes[0].nodeData?.added).toBeUndefined();
    expect(nodes[0].childNodes?.[0].nodeData?.added).toBe("2024-01-01");
    expect(nodes[0].childNodes?.[1].nodeData?.added).toBeUndefined();
  });

  describe("syncExampleHistory", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "example-history-"));
    const file = path.join(dir, "history.json");
    afterEach(() => fs.rmSync(file, { force: true }));
    afterAll(() => fs.rmSync(dir, { force: true, recursive: true }));

    it("rewrites the file only when examples are added or removed", () => {
      const history = {
        C: "2022-01-01",
        "Table/A": "2022-01-01",
        "Table/B": "2022-01-02",
      };
      fs.writeFileSync(file, JSON.stringify(history));
      const before = fs.readFileSync(file, "utf8");
      const nodes = tree();
      syncExampleHistory(nodes, dir, file);
      expect(fs.readFileSync(file, "utf8")).toBe(before);
      expect(nodes[1].nodeData?.added).toBe("2022-01-01");

      fs.writeFileSync(file, JSON.stringify({ C: "2022-01-01" }));
      const { added } = syncExampleHistory(tree(), dir, file);
      expect(added).toEqual(["Table/A", "Table/B"]);
      expect(Object.keys(JSON.parse(fs.readFileSync(file, "utf8")))).toEqual([
        "C",
        "Table/A",
        "Table/B",
      ]);
    });

    it("creates a missing file, without git history", () => {
      syncExampleHistory(tree(), dir, file);
      expect(Object.keys(JSON.parse(fs.readFileSync(file, "utf8")))).toEqual([
        "C",
        "Table/A",
        "Table/B",
      ]);
    });
  });
});
