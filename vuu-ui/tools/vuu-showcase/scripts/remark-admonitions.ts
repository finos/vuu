import type { Paragraph, PhrasingContent, Root, RootContent } from "mdast";
import type { ContainerDirective } from "mdast-util-directive";
// registers the hName/hProperties data fields
import type {} from "mdast-util-to-hast";

/**
 * Admonitions, authored with the Docusaurus syntax, e.g
 *
 *   :::warning[Deprecated]
 *   Some content
 *   :::
 *
 * Requires remark-directive, which parses the directive syntax.
 */
const admonitionTypes = ["note", "tip", "info", "warning", "danger"];

type Parent = { children: RootContent[] };

const isParent = (node: RootContent | Root): node is RootContent & Parent =>
  Array.isArray((node as Partial<Parent>).children);

const capitalize = (text: string) => text[0].toUpperCase() + text.slice(1);

const toAdmonition = (node: ContainerDirective) => {
  const [first, ...rest] = node.children;
  const hasLabel = first?.type === "paragraph" && first.data?.directiveLabel;
  const titleContent: PhrasingContent[] = hasLabel
    ? (first as Paragraph).children
    : [{ type: "text", value: capitalize(node.name) }];
  const title: Paragraph = {
    type: "paragraph",
    children: titleContent,
    data: { hName: "div", hProperties: { className: ["vuuAdmonition-title"] } },
  };
  node.children = [title, ...(hasLabel ? rest : node.children)];
  node.data = {
    hName: "div",
    hProperties: { className: ["vuuAdmonition", `vuuAdmonition-${node.name}`] },
  };
};

/**
 * remark-directive also parses text such as `:name` and `::name` as
 * directives. Any directive we don't handle is restored to plain text.
 */
const restoreDirective = (node: RootContent): RootContent[] | undefined => {
  switch (node.type) {
    case "textDirective":
      return [{ type: "text", value: `:${node.name}` }, ...node.children];
    case "leafDirective":
      return [
        {
          type: "paragraph",
          children: [
            { type: "text", value: `::${node.name}` },
            ...node.children,
          ],
        },
      ];
    case "containerDirective":
      if (!admonitionTypes.includes(node.name)) {
        node.data = { hName: "div" };
      }
  }
};

const transform = (parent: Parent) => {
  parent.children = parent.children.flatMap((child) => {
    if (
      child.type === "containerDirective" &&
      admonitionTypes.includes(child.name)
    ) {
      toAdmonition(child);
    }
    const restored = restoreDirective(child) ?? [child];
    restored.forEach((node) => {
      if (isParent(node)) {
        transform(node);
      }
    });
    return restored;
  });
};

export const remarkAdmonitions = () => (tree: Root) => transform(tree);
