import { describe, expect, it } from "vitest";
import { docSearchEntries, plainText } from "../scripts/docs-search-index";

const mdx = `---
title: Columns
---
import {
  PinnedColumns,
  FitColumnLayout,
} from "./02-Columns.examples";
import { Other } from "./other";

# Columns

The **columns** of a [Table](./01-Table.mdx) are described by \`ColumnDescriptor\`.

## Pinned columns

<PinnedColumns
  height={300}
/>

Set \`pin: "left"\` to keep a column visible.

\`\`\`tsx
## not a heading
const pinned = true;
\`\`\`

### Pinning with fit layout

- Combine pin with columnLayout="fit"

:::note
Admonition text is prose too.
:::
`;

describe("docSearchEntries", () => {
  const entries = docSearchEntries(mdx, "/Docs/Table/Columns", "Columns", [
    "Docs",
    "Table",
  ]);

  it("has an introduction entry and one per h2/h3 section", () => {
    expect(entries.map((e) => e.title)).toEqual([
      ["Columns"],
      ["Columns", "Pinned columns"],
      ["Columns", "Pinned columns", "Pinning with fit layout"],
    ]);
  });

  it("anchors sections with the rendered heading id", () => {
    expect(entries.map((e) => e.anchor)).toEqual([
      undefined,
      "pinned-columns",
      "pinning-with-fit-layout",
    ]);
  });

  it("suffixes repeated headings, as the rendered page does", () => {
    const repeated = docSearchEntries(
      "## A\n\n### Best practices\n\n## B\n\n### Best practices\n",
      "/Docs/X",
      "X",
      [],
    );
    expect(repeated.map((e) => e.anchor)).toEqual([
      undefined,
      "a",
      "best-practices",
      "b",
      "best-practices-1",
    ]);
  });

  it("keeps prose only, as plain text", () => {
    expect(entries[0].text).toBe(
      "The columns of a Table are described by ColumnDescriptor.",
    );
    expect(entries[1].text).toBe('Set pin: "left" to keep a column visible.');
    expect(entries[2].text).toBe(
      'Combine pin with columnLayout="fit" Admonition text is prose too.',
    );
  });
});

describe("plainText", () => {
  it("strips inline markdown and html", () => {
    expect(
      plainText("**bold** _em_ `code` [link](x) <b>tag</b> ![img](y)"),
    ).toBe("bold em code link tag");
  });
});
