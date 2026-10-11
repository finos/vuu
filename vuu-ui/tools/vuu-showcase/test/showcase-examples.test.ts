import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  discoverShowcaseExamples,
  exposeNameFromModuleName,
  moduleNameFromRelativePath,
  parseExampleAnnotation,
} from "../scripts/showcase-examples";

describe("showcase example discovery", () => {
  it("creates stable federation module and expose names", () => {
    const moduleName = moduleNameFromRelativePath("Table/BigData.examples.tsx");

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

  it("parses tags and attributes from an example annotation", () => {
    expect(parseExampleAnnotation("tags=data-consumer ")).toEqual({
      tags: ["data-consumer"],
    });
    expect(
      parseExampleAnnotation(
        "tags=data-consumer,remote-module contextPanelPlacement=module ",
      ),
    ).toEqual({
      attributes: { contextPanelPlacement: "module" },
      tags: ["data-consumer", "remote-module"],
    });
  });

  it("keeps ordered document routes distinct from federation source paths", () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "showcase-"));
    try {
      const docsDirectory = path.join(directory, "01-Docs");
      fs.mkdirSync(docsDirectory);
      fs.writeFileSync(path.join(docsDirectory, "Index.mdx"), "# Docs");
      fs.writeFileSync(path.join(docsDirectory, "02-Guide.mdx"), "# Guide");
      fs.writeFileSync(path.join(docsDirectory, "03-Panel.mdx"), "# Panel");
      fs.writeFileSync(
        path.join(docsDirectory, "03-Panel.examples.tsx"),
        "export const Panel = () => null;",
      );

      const { exposes, treeSource } = discoverShowcaseExamples(directory);
      expect(treeSource[0]).toEqual(
        expect.objectContaining({
          id: "Docs",
          label: "Docs",
          nodeData: { kind: "document", moduleName: "examples/01-Docs/Index" },
        }),
      );
      expect(treeSource[0].childNodes?.map(({ id }) => id)).toEqual([
        "Docs/Guide",
        "Docs/Panel",
      ]);
      expect(treeSource[0].childNodes?.[1]).toEqual(
        expect.objectContaining({
          nodeData: {
            kind: "document",
            moduleName: "examples/01-Docs/03-Panel",
          },
          childNodes: [
            expect.objectContaining({ id: "Docs/Panel/Panel" }),
          ],
        }),
      );
      expect(exposes["./examples/01-Docs/02-Guide"]).toBe(
        path.join(docsDirectory, "02-Guide.mdx"),
      );
      expect(exposes["./examples/01-Docs/03-Panel"]).toBe(
        path.join(docsDirectory, "03-Panel.mdx"),
      );
    } finally {
      fs.rmSync(directory, { force: true, recursive: true });
    }
  });

  it("annotates only the export that follows an annotation", () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "showcase-"));
    try {
      fs.writeFileSync(
        path.join(directory, "Panel.examples.tsx"),
        [
          "/** Ordinary doc comments are not annotations */",
          "export const Plain = () => null;",
          "/** tags=remote-module contextPanelPlacement=module */",
          "export const Annotated = () => null;",
          "export const AfterAnnotated = () => null;",
        ].join("\n"),
      );
      const { treeSource } = discoverShowcaseExamples(directory);
      const nodeData = Object.fromEntries(
        (treeSource[0].childNodes ?? []).map(({ label, nodeData }) => [
          label,
          nodeData,
        ]),
      );

      expect(nodeData.Plain).not.toHaveProperty("tags");
      expect(nodeData.Annotated).toEqual(
        expect.objectContaining({
          attributes: { contextPanelPlacement: "module" },
          componentName: "Annotated",
          tags: ["remote-module"],
        }),
      );
      expect(nodeData.AfterAnnotated).not.toHaveProperty("tags");
    } finally {
      fs.rmSync(directory, { force: true, recursive: true });
    }
  });
});
