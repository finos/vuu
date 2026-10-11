import type { Code, Root, RootContent } from "mdast";
import type { MdxJsxFlowElement } from "mdast-util-mdx-jsx";

/**
 * Mermaid diagrams, authored as fenced code blocks (the form supported by
 * GitHub and Docusaurus), e.g
 *
 *   ```mermaid
 *   flowchart LR
 *     a --> b
 *   ```
 *
 * are replaced with a `<Mermaid chart="..." />` element, rendered in the
 * browser by the Mermaid component supplied to MDX documents. Runs before
 * syntax highlighting, so these blocks are not highlighted as code.
 */
type Parent = { children: RootContent[] };

const isParent = (node: RootContent | Root): node is RootContent & Parent =>
  Array.isArray((node as Partial<Parent>).children);

const toMermaidElement = ({ value }: Code): MdxJsxFlowElement => ({
  type: "mdxJsxFlowElement",
  name: "Mermaid",
  attributes: [{ type: "mdxJsxAttribute", name: "chart", value }],
  children: [],
});

const transform = (parent: Parent) => {
  parent.children = parent.children.map((child) => {
    if (child.type === "code" && child.lang === "mermaid") {
      return toMermaidElement(child);
    } else if (isParent(child)) {
      transform(child);
    }
    return child;
  });
};

export const remarkMermaid = () => (tree: Root) => transform(tree);
