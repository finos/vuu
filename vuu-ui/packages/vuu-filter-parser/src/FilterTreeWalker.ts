import type { SyntaxNode, Tree } from "@lezer/common";
import type {
  Filter,
  FilterCombinatorOp,
  MultipleValueFilterClauseOp,
  SingleValueFilterClauseOp,
} from "@vuu-ui/vuu-filter-types";

type FilterValue = string | number | boolean;

const expressionNodeNames = new Set([
  "ColumnValueExpression",
  "ColumnSetExpression",
  "AndExpression",
  "OrExpression",
  "ParenthesizedExpression",
]);

const children = (node: SyntaxNode) => {
  const result: SyntaxNode[] = [];
  for (let child = node.firstChild; child; child = child.nextSibling) {
    result.push(child);
  }
  return result;
};

const childExpressions = (node: SyntaxNode) =>
  children(node).filter(({ name }) => expressionNodeNames.has(name));

const text = (node: SyntaxNode, source: string) =>
  source.substring(node.from, node.to);

const parseValue = (
  node: SyntaxNode,
  source: string,
): FilterValue | undefined => {
  switch (node.name) {
    case "String":
      return source.substring(node.from + 1, node.to - 1);
    case "Number": {
      const numericText = text(node, source);
      const numericValue = parseFloat(numericText);
      // Integers too large to be represented safely (e.g epoch nanos) are
      // preserved as string, to avoid loss of precision.
      return /^-?\d+$/.test(numericText) && !Number.isSafeInteger(numericValue)
        ? numericText
        : numericValue;
    }
    case "True":
      return true;
    case "False":
      return false;
    default:
      return undefined;
  }
};

const buildColumnValueFilter = (node: SyntaxNode, source: string) => {
  const filter: Partial<Filter> & { value?: FilterValue } = {};
  for (const child of children(node)) {
    if (child.name === "Column") {
      filter.column = text(child, source);
    } else if (child.name === "Operator") {
      filter.op = text(child, source) as SingleValueFilterClauseOp;
    } else {
      const value = parseValue(child, source);
      if (value !== undefined) {
        filter.value = value;
      }
    }
  }
  return filter;
};

const buildColumnSetFilter = (node: SyntaxNode, source: string) => {
  const filter: {
    column?: string;
    op: MultipleValueFilterClauseOp;
    values?: FilterValue[];
  } = { op: "in" };
  for (const child of children(node)) {
    if (child.name === "Column") {
      filter.column = text(child, source);
    } else if (child.name === "Values") {
      filter.values = children(child)
        .map((valueNode) => parseValue(valueNode, source))
        .filter((value) => value !== undefined);
    }
  }
  return filter as Partial<Filter>;
};

/**
 * Operands with the same combinator as their parent are merged into it, so
 * 'a and b and c' produces a single 'and' with three filters. An operand with
 * a different combinator (only possible via parentheses or precedence) stays
 * a nested filter.
 */
const buildMultiClauseFilter = (
  node: SyntaxNode,
  op: FilterCombinatorOp,
  source: string,
): Partial<Filter> | undefined => {
  const filters: Partial<Filter>[] = [];
  for (const operand of childExpressions(node)) {
    const filter = buildFilter(operand, source);
    if (filter?.op === op && "filters" in filter) {
      filters.push(...(filter.filters as Partial<Filter>[]));
    } else if (filter) {
      filters.push(filter);
    }
  }
  if (filters.length <= 1) {
    return filters[0];
  }
  return { op, filters } as Filter;
};

const buildFilter = (
  node: SyntaxNode,
  source: string,
): Partial<Filter> | undefined => {
  switch (node.name) {
    case "ColumnValueExpression":
      return buildColumnValueFilter(node, source);
    case "ColumnSetExpression":
      return buildColumnSetFilter(node, source);
    case "AndExpression":
      return buildMultiClauseFilter(node, "and", source);
    case "OrExpression":
      return buildMultiClauseFilter(node, "or", source);
    case "ParenthesizedExpression": {
      const [expression] = childExpressions(node);
      return expression ? buildFilter(expression, source) : undefined;
    }
    default:
      return undefined;
  }
};

export const walkTree = (tree: Tree, source: string) => {
  const { topNode } = tree;
  const [expression] = childExpressions(topNode);
  const filter = expression ? buildFilter(expression, source) : undefined;
  const filterName = topNode.getChild("FilterName");
  if (filter && filterName) {
    return { ...filter, name: text(filterName, source) };
  }
  return filter;
};
