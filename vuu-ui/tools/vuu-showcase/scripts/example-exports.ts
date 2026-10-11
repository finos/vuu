import ts from "typescript";

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

const isExported = (statement: ts.Statement) =>
  ts.canHaveModifiers(statement) &&
  ts
    .getModifiers(statement)
    ?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword) === true;

const commentText = (comment: ts.JSDoc["comment"]) =>
  typeof comment === "string"
    ? comment
    : comment?.map(({ text }) => text).join("");

const splitTags = (text: string) =>
  text
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag !== "");

const readDocComment = (statement: ts.Statement) => {
  const docs = ts.getJSDocCommentsAndTags(statement).filter(ts.isJSDoc);
  let description: string | undefined;
  let tags: string[] | undefined;
  let title: string | undefined;

  for (const doc of docs) {
    const text = commentText(doc.comment)?.trim();
    const legacyTags = text?.match(LEGACY_TAGS);
    if (legacyTags) {
      tags = splitTags(legacyTags[1]);
    } else if (text) {
      description = text.replace(/\s*\n\s*/g, " ");
    }
    for (const tag of doc.tags ?? []) {
      const value = commentText(tag.comment)?.trim();
      if (tag.tagName.text === "tags" && value) {
        tags = splitTags(value);
      } else if (tag.tagName.text === "title" && value) {
        title = value;
      }
    }
  }
  return { description, tags, title };
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
  const sourceFile = ts.createSourceFile(
    fileName,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const lineOf = (pos: number) =>
    sourceFile.getLineAndCharacterOfPosition(pos).line + 1;

  const examples: ExampleExport[] = [];
  for (const statement of sourceFile.statements) {
    if (ts.isVariableStatement(statement) && isExported(statement)) {
      const { description, tags, title } = readDocComment(statement);
      const docStart = ts.getJSDocCommentsAndTags(statement)[0]?.getStart();
      const start = lineOf(docStart ?? statement.getStart(sourceFile));
      const end = lineOf(statement.getEnd());
      for (const declaration of statement.declarationList.declarations) {
        if (
          ts.isIdentifier(declaration.name) &&
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
