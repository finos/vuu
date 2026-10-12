import {
  getTextOfJSDocComment,
  type JSDoc,
  type Node,
  type SourceFile,
  SyntaxKind,
  type VariableStatement,
} from "typescript/unstable/ast";
import { createVirtualFileSystem } from "typescript/unstable/fs";
import { API } from "typescript/unstable/sync";

export type ExampleExport = {
  componentName: string;
  description?: string;
  /** 1-based, inclusive line range of the export, including its doc comment */
  sourceRange: [number, number];
  tags?: string[];
  title?: string;
};

// legacy tags syntax: /** tags=data-consumer */
const LEGACY_TAGS = /^\s*tags=([-a-z,]*)\s*$/;

const isExported = (statement: Node) =>
  statement.modifiers?.some((m) => m.kind === SyntaxKind.ExportKeyword) ===
  true;

const isJSDoc = (node: Node): node is JSDoc => node.kind === SyntaxKind.JSDoc;

const splitTags = (text: string) =>
  text
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag !== "");

const readDocComment = (statement: Node) => {
  const docs = statement.jsDoc?.filter(isJSDoc) ?? [];
  let description: string | undefined;
  let tags: string[] | undefined;
  let title: string | undefined;

  for (const doc of docs) {
    const text = getTextOfJSDocComment(doc.comment)?.trim();
    const legacyTags = text?.match(LEGACY_TAGS);
    if (legacyTags) {
      tags = splitTags(legacyTags[1]);
    } else if (text) {
      description = text.replace(/\s*\n\s*/g, " ");
    }
    for (const tag of doc.tags ?? []) {
      const value = getTextOfJSDocComment(tag.comment)?.trim();
      if (tag.tagName.text === "tags" && value) {
        tags = splitTags(value);
      } else if (tag.tagName.text === "title" && value) {
        title = value;
      }
    }
  }
  return { description, tags, title };
};

const PROJECT_DIR = "/__example-exports__";

/**
 * TypeScript 7 has no in-process parser, the unstable sync API parses via
 * the native compiler, so the source is served from a virtual project.
 */
const parseSourceFile = (fileName: string, sourceText: string): SourceFile => {
  const filePath = `${PROJECT_DIR}/source.tsx`;
  const configPath = `${PROJECT_DIR}/tsconfig.json`;
  const api = new API({
    cwd: PROJECT_DIR,
    fs: createVirtualFileSystem({
      [configPath]: JSON.stringify({
        compilerOptions: {
          jsx: "preserve",
          noLib: true,
          noResolve: true,
          types: [],
        },
        files: ["source.tsx"],
      }),
      [filePath]: sourceText,
    }),
  });
  try {
    const project = api
      .updateSnapshot({ openProjects: [configPath] })
      .getProject(configPath);
    const sourceFile = project?.program.getSourceFile(filePath);
    if (!sourceFile) {
      throw Error(`[example-exports] unable to parse ${fileName}`);
    }
    return sourceFile;
  } finally {
    api.close();
  }
};

/**
 * Finds the examples exported from an examples module. Every exported const
 * whose name begins with an upper case letter is an example. A JSDoc comment
 * on the export supplies optional metadata:
 *
 *   /**
 *    * Description of the example
 *    * @tags data-consumer
 *    * @title Explicit title, overrides the humanised name
 *    *\/
 *
 * The legacy form `/** tags=data-consumer *\/` is still supported.
 */
export const parseExampleExports = (
  fileName: string,
  sourceText: string,
): ExampleExport[] => {
  const sourceFile = parseSourceFile(fileName, sourceText);
  const lineOf = (pos: number) =>
    sourceFile.getLineAndCharacterOfPosition(pos).line + 1;

  const examples: ExampleExport[] = [];
  for (const statement of sourceFile.statements) {
    if (
      statement.kind === SyntaxKind.VariableStatement &&
      isExported(statement)
    ) {
      const { description, tags, title } = readDocComment(statement);
      const docStart = statement.jsDoc?.[0]?.getStart(sourceFile);
      const start = lineOf(docStart ?? statement.getStart(sourceFile));
      const end = lineOf(statement.getEnd());
      const { declarationList } = statement as VariableStatement;
      for (const declaration of declarationList.declarations) {
        if (
          declaration.name.kind === SyntaxKind.Identifier &&
          /^[A-Z]/.test(declaration.name.text)
        ) {
          const example: ExampleExport = {
            componentName: declaration.name.text,
            sourceRange: [start, end],
          };
          if (description) example.description = description;
          if (tags) example.tags = tags;
          if (title) example.title = title;
          examples.push(example);
        }
      }
    }
  }
  return examples;
};
