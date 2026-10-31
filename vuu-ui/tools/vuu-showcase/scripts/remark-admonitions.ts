import type { Paragraph, PhrasingContent, Root, RootContent } from "mdast";
import type { ContainerDirective } from "mdast-util-directive";
import type { MdxJsxFlowElement } from "mdast-util-mdx-jsx";
// registers the hName/hProperties data fields
import type {} from "mdast-util-to-hast";

/**
 * Admonitions, authored with the Docusaurus syntax, e.g
 *
 *   :::warning[Deprecated]
 *   Some content
 *   :::
 *
 * Requires remark-directive, which parses the directive syntax. Each is
 * rendered as a `<Callout type="warning">`, the first child is the title. The
 * Callout component is supplied to MDX documents.
 */
const admonitionTypes = ["note", "tip", "info", "warning", "danger"];

type Parent = { children: RootContent[] };

const isParent = (node: RootContent | Root): node is RootContent & Parent =>
  Array.isArray((node as Partial<Parent>).children);

const capitalize = (text: string) => text[0].toUpperCase() + text.slice(1);

const toCallout = (node: ContainerDirective): MdxJsxFlowElement => {
  const [first, ...rest] = node.children;
  const hasLabel = first?.type === "paragraph" && first.data?.directiveLabel;
  const titleContent: PhrasingContent[] = hasLabel
    ? (first as Paragraph).children
    : [{ type: "text", value: capitalize(node.name) }];
  const title: Paragraph = {
    type: "paragraph",
    children: titleContent,
    data: {
      hName: "div",
      hProperties: { className: ["ShowcaseCallout-title"] },
    },
  };
  return {
    type: "mdxJsxFlowElement",
    name: "Callout",
    attributes: [{ type: "mdxJsxAttribute", name: "type", value: node.name }],
    children: [title, ...(hasLabel ? rest : node.children)],
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
    const replaced =
      child.type === "containerDirective" &&
      admonitionTypes.includes(child.name)
        ? [toCallout(child)]
        : (restoreDirective(child) ?? [child]);
    replaced.forEach((node) => {
      if (isParent(node)) {
        transform(node);
      }
    });
    return replaced as RootContent[];
  });
};

export const remarkAdmonitions = () => (tree: Root) => transform(tree);
