import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  discoverShowcaseExamples,
  exposeNameFromModuleName,
  moduleNameFromRelativePath,
} from "../scripts/showcase-examples";

describe("showcase example discovery", () => {
  it("creates stable federation module and expose names", () => {
    const moduleName = moduleNameFromRelativePath(
      "Table/BigData.examples.tsx",
    );

    expect(moduleName).toBe("examples/Table/BigData");
    expect(exposeNameFromModuleName(moduleName)).toBe(
      "./examples/Table/BigData",
    );
    expect(moduleNameFromRelativePath("Table/Index.mdx")).toBe(
      "examples/Table/Index",
    );
  });

  it("discovers every supported example source as a remote expose", () => {
    const examples = discoverShowcaseExamples(
      path.resolve(import.meta.dirname, "../../../showcase/src/examples"),
    );

    expect(examples.exposes).toHaveProperty("./examples/Table/BigData");
    expect(examples.exposes).toHaveProperty("./examples/Table/Index");
    expect(examples.exposes).toHaveProperty("./examples/1.ApplicationFeatures");
  });
});
