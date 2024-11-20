import { describe, expect, it } from "vitest";
import treeSourceJson from "./treeSourceJson";

import { findInTree } from "../src/showcase-main/showcase-utils";

describe("showcase-utils", () => {
  describe("findInTree", () => {
    it("finds matches at multiple levels", () => {
      const results = findInTree(treeSourceJson, "table");
      console.log({ results });
      expect(results.length).toEqual(20);
    });
  });
});
