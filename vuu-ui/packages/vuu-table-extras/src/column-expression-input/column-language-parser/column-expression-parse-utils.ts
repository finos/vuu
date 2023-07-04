import { SyntaxNode } from "@finos/vuu-codemirror";
import { parser } from "./generated/column-parser";

const strictParser = parser.configure({ strict: true });

const RelationalOperands = ["Number", "String"];

export const ColumnNamedTerms: readonly string[] = [
  ...RelationalOperands,
  "AndCondition",
  "ArithmeticExpression",
  "BooleanOperator",
  "RelationalOperatorOperator",
  "CallExpression",
  "CloseBrace",
  "Column",
  "Comma",
  "ConditionalExpression",
  "Divide",
  "Equal",
  "If",
  "Minus",
  "OpenBrace",
  "OrCondition",
  "ParenthesizedExpression",
  "Plus",
  "RelationalExpression",
  "RelationalOperator",
  "Times",
];

export const isCompleteExpression = (src: string) => {
  try {
    strictParser.parse(src);
    return true;
  } catch (err) {
    return false;
  }
};

export const lastNamedChild = (node: SyntaxNode): SyntaxNode | null => {
  let { lastChild } = node;
  while (lastChild && !ColumnNamedTerms.includes(lastChild.name)) {
    lastChild = lastChild.prevSibling;
    console.log(lastChild?.name);
  }
  return lastChild;
};

export const isCompleteRelationalExpression = (node?: SyntaxNode) => {
  if (node?.name === "RelationalExpression") {
    const { firstChild } = node;
    const lastChild = lastNamedChild(node);
    if (
      firstChild?.name === "Column" &&
      typeof lastChild?.name === "string" &&
      RelationalOperands.includes(lastChild.name)
    ) {
      return true;
    }
  }

  return false;
};
