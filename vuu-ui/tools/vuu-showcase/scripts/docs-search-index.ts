import fs from "node:fs";
import path from "node:path";
import type { TreeSourceNode } from "@vuu-ui/vuu-utils";
import type { DocSearchEntry } from "../src/showcase-main/command-palette/docs-index";
import { slugify } from "../src/slugify";

export { DOCS_INDEX_URL } from "../src/showcase-main/command-palette/docs-index";
export type { DocSearchEntry };

const TEXT_LENGTH = 200;

/** Markdown inline syntax reduced to its text */
export const plainText = (markdown: string) =>
  markdown
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]*>/g, "")
    .replace(/[*_`~]/g, "")
    .replace(/\s+/g, " ")
    .trim();

interface Section {
  level: number;
  heading?: string;
  lines: string[];
}

const FENCE = /^\s*(```|~~~)/;
const HEADING = /^(#{1,3})\s+(.*?)\s*#*\s*$/;
const NON_PROSE = /^\s*(<|\{|\}|:::|\||---\s*$)/;
const MODULE_STATEMENT = /^\s*(import|export)\s/;
const STATEMENT_END = /(\bfrom\s+["'][^"']*["']|["'])\s*;?\s*$|;\s*$/;
const JSX_OPEN = /^\s*<[A-Za-z]/;
const JSX_CLOSED = /\/>\s*$|<\/[\w.]*>\s*$/;

/**
 * Splits an mdx document into sections at h1-h3 headings, keeping prose only
 * (no code, jsx, imports, admonition fences or tables).
 */
export const extractSections = (mdx: string): Section[] => {
  const text = mdx.replace(/^---\n[\s\S]*?\n---\n/, "");
  const sections: Section[] = [{ level: 0, lines: [] }];
  let inFence = false;
  // the end of a multi-line import/export or jsx element being skipped
  let skipUntil: RegExp | undefined;
  for (const line of text.split("\n")) {
    if (skipUntil) {
      if (skipUntil.test(line)) skipUntil = undefined;
    } else if (FENCE.test(line)) {
      inFence = !inFence;
    } else if (inFence) {
      continue;
    } else if (MODULE_STATEMENT.test(line)) {
      if (!STATEMENT_END.test(line)) skipUntil = STATEMENT_END;
    } else if (JSX_OPEN.test(line) && !JSX_CLOSED.test(line)) {
      skipUntil = JSX_CLOSED;
    } else {
      const heading = HEADING.exec(line);
      if (heading) {
        sections.push({
          heading: plainText(heading[2]),
          level: heading[1].length,
          lines: [],
        });
      } else if (line.trim() && !NON_PROSE.test(line)) {
        sections[sections.length - 1].lines.push(line);
      }
    }
  }
  return sections;
};

const sectionText = ({ lines }: Section) => {
  const text = plainText(lines.join(" ").replace(/^\s*[-*>]\s+/gm, ""));
  return text.length > TEXT_LENGTH
    ? `${text.slice(0, TEXT_LENGTH - 1).trimEnd()}…`
    : text;
};

/** Search entries for one document, its introduction and h2/h3 sections */
export const docSearchEntries = (
  mdx: string,
  route: string,
  label: string,
  breadcrumb: string[],
): DocSearchEntry[] => {
  const entries: DocSearchEntry[] = [];
  let h2: string | undefined;
  let intro: DocSearchEntry | undefined;
  for (const section of extractSections(mdx)) {
    if (section.level <= 1) {
      // the h1 repeats the document label, its text belongs to the intro
      intro ??= { breadcrumb, route, text: "", title: [label] };
      intro.text ||= sectionText(section);
      if (!entries.includes(intro)) entries.push(intro);
    } else if (section.heading) {
      if (section.level === 2) h2 = section.heading;
      entries.push({
        anchor: slugify(section.heading),
        breadcrumb,
        route,
        text: sectionText(section),
        title:
          section.level === 3 && h2
            ? [label, h2, section.heading]
            : [label, section.heading],
      });
    }
  }
  return entries;
};

type Node = TreeSourceNode<{ path?: string }>;

/** Search entries for every mdx document in the tree */
export const buildDocsSearchIndex = (
  treeSource: Node[],
  showcaseDir: string,
): DocSearchEntry[] => {
  const entries: DocSearchEntry[] = [];
  const visit = (nodes: Node[], breadcrumb: string[]) => {
    for (const node of nodes) {
      const docPath = node.nodeData?.path;
      if (docPath?.endsWith(".mdx")) {
        const mdx = fs.readFileSync(path.resolve(showcaseDir, docPath), "utf8");
        entries.push(
          ...docSearchEntries(mdx, `/${node.id}`, node.label, breadcrumb),
        );
      }
      if (node.childNodes) {
        visit(node.childNodes as Node[], [...breadcrumb, node.label]);
      }
    }
  };
  visit(treeSource, []);
  return entries;
};

/** Writes the docs search index to outDir */
export const writeDocsSearchIndex = (
  treeSource: Node[],
  showcaseDir: string,
  outDir: string,
  url: string,
) => {
  const entries = buildDocsSearchIndex(treeSource, showcaseDir);
  const target = path.join(outDir, url);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, JSON.stringify(entries));
  return entries.length;
};
