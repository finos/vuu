import { compile } from "@mdx-js/mdx";
import { describe, expect, it } from "vitest";
import { mdxOptions } from "../scripts/mdx-options";

const source = `import { LivePreview } from "../components/LivePreview";
import { PinnedColumns, Other } from "./02-Columns.examples";

# Columns

<LivePreview>
  <PinnedColumns />
</LivePreview>

<Other />

:::tip[Remember]
Pin it
:::
`;

const compileMdx = async (mdx: string) =>
  String(
    await compile(mdx, {
      ...mdxOptions,
      // biome-ignore lint/suspicious/noExplicitAny: plugin tuple types
      rehypePlugins: [] as any,
    } as Parameters<typeof compile>[1]),
  );

describe("remark-embedded-examples", () => {
  it("replaces example imports with EmbeddedExample", async () => {
    const js = await compileMdx(source);
    expect(js).not.toMatch(/from "\.\/02-Columns\.examples"/);
    expect(js).not.toMatch(/components\/LivePreview/);
    expect(js).toMatch(/module: "\.\/02-Columns\.examples"/);
    expect(js).toMatch(/name: "PinnedColumns"/);
    expect(js).toMatch(/name: "Other"/);
    expect(js).toMatch(/_missingMdxReference\("EmbeddedExample"/);
    expect(js).toMatch(/_missingMdxReference\("LivePreview"/);
  });

  it("converts admonitions to Callout", async () => {
    const js = await compileMdx(source);
    expect(js).toMatch(/_missingMdxReference\("Callout"/);
    expect(js).toMatch(/type: "tip"/);
    expect(js).toMatch(/ShowcaseCallout-title/);
  });
});
