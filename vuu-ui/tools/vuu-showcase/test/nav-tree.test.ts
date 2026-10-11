import type { TreeSourceNode } from "@vuu-ui/vuu-utils";
import { describe, expect, it } from "vitest";
import {
  buildNavTree,
  navKeyFromPath,
  pathFromNavKey,
} from "../src/showcase-main/tree-nav/nav-tree";

const treeSource: TreeSourceNode[] = [
  {
    id: "Docs",
    label: "Docs",
    childNodes: [{ id: "Docs/Table", label: "Table" }],
  },
  {
    id: "Table",
    label: "Table",
    childNodes: [
      {
        id: "Table/Misc",
        label: "Misc",
        childNodes: [{ id: "Table/Misc/DefaultTable", label: "DefaultTable" }],
      },
    ],
  },
  { id: "Layout", label: "Layout" },
];

describe("nav-tree", () => {
  describe("buildNavTree", () => {
    it("promotes Docs and Theme, groups everything else under Examples", () => {
      const navTree = buildNavTree(treeSource);
      expect(navTree.map(({ id }) => id)).toEqual([
        "Docs",
        "Theme",
        "Examples",
      ]);
      expect(navTree[0]).toBe(treeSource[0]);
      expect(navTree[2].childNodes).toEqual([treeSource[1], treeSource[2]]);
      expect(navTree[2].expanded).toBe(true);
    });
    it("omits Docs when the tree source has none", () => {
      const navTree = buildNavTree(treeSource.slice(1));
      expect(navTree.map(({ id }) => id)).toEqual(["Theme", "Examples"]);
    });
  });

  describe("navKeyFromPath", () => {
    it("returns undefined for the root", () => {
      expect(navKeyFromPath("/")).toBeUndefined();
    });
    it("maps Theme and Docs paths to top level keys", () => {
      expect(navKeyFromPath("/Theme")).toEqual("$root|Theme");
      expect(navKeyFromPath("/Docs")).toEqual("$root|Docs");
      expect(navKeyFromPath("/Docs/Table")).toEqual("$root|Docs|Table");
    });
    it("maps example paths to keys under Examples", () => {
      expect(navKeyFromPath("/Table/Misc/DefaultTable")).toEqual(
        "$root|Examples|Table|Misc|DefaultTable",
      );
      expect(navKeyFromPath("/DocsExtra")).toEqual("$root|Examples|DocsExtra");
    });
    it("ignores a trailing slash", () => {
      expect(navKeyFromPath("/Docs/Table/")).toEqual("$root|Docs|Table");
    });
  });

  describe("pathFromNavKey", () => {
    it("maps keys back to unchanged urls", () => {
      expect(pathFromNavKey("$root|Theme")).toEqual("/Theme");
      expect(pathFromNavKey("$root|Docs|Table")).toEqual("/Docs/Table");
      expect(pathFromNavKey("$root|Examples|Table|Misc|DefaultTable")).toEqual(
        "/Table/Misc/DefaultTable",
      );
    });
    it("returns undefined for the Examples group", () => {
      expect(pathFromNavKey("$root|Examples")).toBeUndefined();
    });
    it("round trips with navKeyFromPath", () => {
      for (const path of [
        "/Theme",
        "/Docs/Table",
        "/Table/Misc/DefaultTable",
      ]) {
        expect(pathFromNavKey(navKeyFromPath(path) as string)).toEqual(path);
      }
    });
  });
});
