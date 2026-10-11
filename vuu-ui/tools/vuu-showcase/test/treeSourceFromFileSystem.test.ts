import path from "path";
import type { TreeSourceNode } from "@vuu-ui/vuu-utils";
import { describe, expect, it } from "vitest";
import {
  findEmbeddedExamples,
  type NodeData,
  treeSourceFromFileSystem,
} from "../scripts/treeSourceFromFileSystem";

const examplesPath = path.join(__dirname, "fixtures/examples");

const byId = (nodes: TreeSourceNode<NodeData>[], id: string) =>
  nodes.find((node) => node.id === id) as TreeSourceNode<NodeData>;

describe("treeSourceFromFileSystem", () => {
  const [tree, tags] = treeSourceFromFileSystem(examplesPath);

  it("uses unprefixed names for ids and keys, humanised names for labels", () => {
    const folder = byId(tree, "GettingStarted");
    expect(folder).toMatchObject({
      keySegment: "GettingStarted",
      label: "Getting started",
    });
    const file = byId(folder.childNodes ?? [], "GettingStarted/Basics");
    const example = byId(
      file.childNodes ?? [],
      "GettingStarted/Basics/PinnedColumns",
    );
    expect(example).toMatchObject({
      keySegment: "PinnedColumns",
      label: "Pinned columns",
    });
    expect(example.nodeData).toMatchObject({
      componentName: "PinnedColumns",
      description: "A table with pinned columns.",
      sourceRange: [4, 8],
    });
  });

  it("prefers an explicit title", () => {
    const file = byId(
      byId(tree, "GettingStarted").childNodes ?? [],
      "GettingStarted/Basics",
    );
    expect(
      byId(file.childNodes ?? [], "GettingStarted/Basics/GridLayoutFromJSON")
        .label,
    ).toEqual("Grid from JSON");
  });

  it("collects tags and marks data consumers as live", () => {
    expect(tags.sort()).toEqual(["data-consumer", "experimental"]);
    const file = byId(
      byId(tree, "GettingStarted").childNodes ?? [],
      "GettingStarted/Basics",
    );
    expect(file.childNodes?.map(({ nodeData }) => !!nodeData?.live)).toEqual([
      true,
      false,
      true,
      false,
    ]);
  });

  it("records example counts and live status on folders", () => {
    expect(byId(tree, "GettingStarted").nodeData).toEqual({
      count: 4,
      live: true,
    });
    const tables = byId(tree, "Tables");
    expect(tables.nodeData).toEqual({ count: 2 });
    expect(byId(tables.childNodes ?? [], "Tables/Grid").nodeData).toEqual({
      count: 1,
    });
  });

  it("orders numbered documents, without the prefix in the route", () => {
    const docs = byId(tree, "Docs");
    const chapter = byId(docs.childNodes ?? [], "Docs/Chapter");
    expect(chapter.nodeData).toMatchObject({ order: 2 });
    expect(chapter.nodeData?.path).toMatch(/Docs\/02-Chapter.mdx$/);
    expect(docs.nodeData?.order).toBeUndefined();
  });

  it("keeps document paths alongside counts", () => {
    const columns = byId(
      byId(tree, "Tables").childNodes ?? [],
      "Tables/Columns",
    );
    expect(columns.nodeData?.path).toMatch(/Tables\/Columns.mdx$/);
    expect(columns.nodeData?.count).toEqual(1);
    const docs = byId(tree, "Docs");
    expect(docs.nodeData?.path).toMatch(/Docs\/Index.mdx$/);
    expect(byId(docs.childNodes ?? [], "Docs/1.Introduction").label).toEqual(
      "Introduction",
    );
  });
});

describe("findEmbeddedExamples", () => {
  const mdx = `
import { Flash, Other as Renamed, Unused } from "./Table/Formatting.examples";
import { Thing } from "../shared/Thing.examples.tsx";
import { NotAnExample } from "./component";

<Flash />
<Renamed height={200} />
<Thing />
<NotAnExample />
`;

  it("identifies examples imported and rendered by a document", () => {
    expect(findEmbeddedExamples("src/examples/Docs/Table.mdx", mdx)).toEqual([
      "src/examples/Docs/Table/Formatting.examples.tsx#Flash",
      "src/examples/Docs/Table/Formatting.examples.tsx#Other",
      "src/examples/shared/Thing.examples.tsx#Thing",
    ]);
  });
});
