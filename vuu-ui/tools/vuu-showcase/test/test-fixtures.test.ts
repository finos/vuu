import fs from "fs";
import os from "os";
import path from "path";
import type { TreeSourceNode } from "@vuu-ui/vuu-utils";
import { afterAll, describe, expect, it } from "vitest";
import {
  applyFixtureUsage,
  findExampleIds,
  findTestFiles,
} from "../scripts/test-fixtures";
import { resolveWithin } from "../scripts/safe-path";
import type { NodeData } from "../scripts/treeSourceFromFileSystem";

const ids = new Set(["Filters/ColumnFilter/Text", "Layout/Stack/Tabs"]);

describe("test-fixtures", () => {
  it("finds example ids in string literals, wherever they appear", () => {
    const text = `
      const story = "Layout/Stack/Tabs";
      await mount('Filters/ColumnFilter/Text', { a: 1 });
      await mount(\`Filters/ColumnFilter/Text\`);
      await mount("Filters/ColumnFilter/Other");
      expect("Filters").toBe(1);
    `;
    expect([...findExampleIds(text, ids)]).toEqual([
      "Layout/Stack/Tabs",
      "Filters/ColumnFilter/Text",
    ]);
  });

  describe("with test files on disk", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "test-fixtures-"));
    afterAll(() => fs.rmSync(root, { force: true, recursive: true }));
    const write = (file: string, text: string) => {
      const filePath = resolveWithin(root, file);
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, text);
    };
    write("packages/b/B.playwright.test.tsx", `mount("Layout/Stack/Tabs")`);
    write(
      "packages/a/A.playwright.test.ts",
      `mount("Layout/Stack/Tabs"); mount("Filters/ColumnFilter/Text")`,
    );
    write("packages/a/A.test.tsx", `mount("Filters/ColumnFilter/Text")`);
    write(
      "node_modules/x/X.playwright.test.tsx",
      `mount("Filters/ColumnFilter/Text")`,
    );

    it("finds Playwright test files, ignoring node_modules", () => {
      expect(findTestFiles(root)).toEqual([
        "packages/a/A.playwright.test.ts",
        "packages/b/B.playwright.test.tsx",
      ]);
    });

    it("records the test files using each example", () => {
      const example = (id: string): TreeSourceNode<NodeData> => ({
        id,
        label: id,
        nodeData: { componentName: id.split("/").pop() },
      });
      const tree: TreeSourceNode<NodeData>[] = [
        {
          id: "Layout",
          label: "Layout",
          childNodes: [example("Layout/Stack/Tabs"), example("Layout/X")],
        },
        example("Filters/ColumnFilter/Text"),
      ];
      expect(applyFixtureUsage(tree, root)).toEqual({
        fixtureCount: 2,
        testFileCount: 2,
      });
      expect(tree[0].childNodes?.[0].nodeData?.fixtureFor).toEqual([
        "packages/a/A.playwright.test.ts",
        "packages/b/B.playwright.test.tsx",
      ]);
      expect(tree[0].childNodes?.[1].nodeData?.fixtureFor).toBeUndefined();
      expect(tree[1].nodeData?.fixtureFor).toEqual([
        "packages/a/A.playwright.test.ts",
      ]);
    });
  });
});
