import type { Root, RootContent } from "mdast";
import type { MdxJsxAttribute } from "mdast-util-mdx-jsx";
import type { VFile } from "vfile";

/**
 * Docs embed live examples by importing them from an examples module and
 * rendering them as JSX, e.g
 *
 *   import { PinnedColumns } from "./02-Columns.examples";
 *   <PinnedColumns />
 *
 * In the Showcase, documents render in the showcase chrome, while examples
 * render in an iframe, so they are themed by the preview theme. The import is
 * removed and each usage replaced with
 *
 *   <EmbeddedExample module="./02-Columns.examples" name="PinnedColumns" />
 *
 * EmbeddedExample, like LivePreview (whose import is also removed), is
 * supplied to the document via the MDX components prop.
 */
const EXAMPLES_MODULE = /\.examples(\.tsx?)?$/;
const PROVIDED_COMPONENTS = /(^|\/)LivePreview(\.tsx?)?$/;

type Example = { module: string; name: string };

type EsmNode = Extract<RootContent, { type: "mdxjsEsm" }>;

type ImportSpecifier = {
  type: string;
  imported?: { type: string; name?: string; value?: string };
  local: { name: string };
};

type ImportDeclaration = {
  type: "ImportDeclaration";
  source: { value: unknown };
  specifiers: ImportSpecifier[];
};

const isImportDeclaration = (node: {
  type: string;
}): node is ImportDeclaration => node.type === "ImportDeclaration";

const importedName = ({ imported, local }: ImportSpecifier) =>
  imported?.name ??
  (typeof imported?.value === "string" ? imported.value : local.name);

/** Removes example imports, returns the examples by local name */
const removeImports = (node: EsmNode, examples: Map<string, Example>) => {
  const program = node.data?.estree;
  if (!program) {
    return;
  }
  program.body = program.body.filter((statement) => {
    if (!isImportDeclaration(statement)) {
      return true;
    }
    const source = String(statement.source.value);
    if (EXAMPLES_MODULE.test(source)) {
      statement.specifiers.forEach((specifier) => {
        if (specifier.type === "ImportSpecifier") {
          examples.set(specifier.local.name, {
            module: source.replace(/\.tsx?$/, ""),
            name: importedName(specifier),
          });
        }
      });
      return false;
    }
    return !PROVIDED_COMPONENTS.test(source);
  });
};

const attribute = (name: string, value: string): MdxJsxAttribute => ({
  type: "mdxJsxAttribute",
  name,
  value,
});

type Parent = { children: RootContent[] };

const isParent = (node: RootContent): node is RootContent & Parent =>
  Array.isArray((node as Partial<Parent>).children);

const replaceUsages = (
  parent: Parent,
  examples: Map<string, Example>,
  file: VFile,
) => {
  parent.children.forEach((child) => {
    if (
      (child.type === "mdxJsxFlowElement" ||
        child.type === "mdxJsxTextElement") &&
      child.name &&
      examples.has(child.name)
    ) {
      const { module, name } = examples.get(child.name) as Example;
      if (child.attributes.length > 0 || child.children.length > 0) {
        file.message(
          `Props and children of embedded example ${name} are ignored, it renders in an iframe`,
          child,
        );
      }
      child.name = "EmbeddedExample";
      child.attributes = [attribute("module", module), attribute("name", name)];
      child.children = [];
    } else if (isParent(child)) {
      replaceUsages(child, examples, file);
    }
  });
};

export const remarkEmbeddedExamples = () => (tree: Root, file: VFile) => {
  const examples = new Map<string, Example>();
  tree.children = tree.children.filter((node) => {
    if (node.type === "mdxjsEsm") {
      removeImports(node, examples);
      return (node.data?.estree?.body.length ?? 1) > 0;
    }
    return true;
  });
  if (examples.size > 0) {
    replaceUsages(tree, examples, file);
  }
};
