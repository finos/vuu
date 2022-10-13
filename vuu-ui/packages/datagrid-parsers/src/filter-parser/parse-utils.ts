import { ErrorNode, TerminalNode } from "antlr4ts/tree";
import { Filter } from "@vuu-ui/utils";

//TODO need to ingestthese in a non-specific way
import { FilterParser } from "../../generated/parsers/filter/FilterParser";
import { NamedFilter, ParsedFilter } from "./FilterVisitor";
const singleCharacterSymbols = new Set([
  FilterParser.EQ,
  FilterParser.GT,
  FilterParser.LT,
  FilterParser.COMMA,
  FilterParser.LBRACK,
  FilterParser.RBRACK,
]);

// const SPECIAL_SPACE = "\u00A0";
const SPECIAL_SPACE = "_";

const FALSE = [false];
const caretAtEndOfText = (tokens, caretPosition) => {
  if (tokens.length < 2) {
    return FALSE;
  }
  const [lastToken] = tokens.slice(-2);
  const { start, text } = lastToken;
  if (text.length > 0 && start + text.length === caretPosition) {
    return [true, text];
  } else {
    return FALSE;
  }
};

const getNamedFilter = (namedFilters, name) =>
  namedFilters.find((f) => f.name === name)?.filter;

const LBRACK = "[";
const RBRACK = "]";

export const isOpenList = (tokens) => {
  for (let i = tokens.length - 1; i >= 0; i--) {
    const { text } = tokens[i];
    if (text === RBRACK) {
      return false;
    } else if (text === LBRACK) {
      return true;
    }
  }
  return false;
};

const NO_MATCHES = [];
// for now just assume only '/' => '-'
export const replaceAll = (text) => {
  let char = "/";
  let pos = text.indexOf(char);
  if (pos === -1) {
    return [text, NO_MATCHES];
  } else {
    const matches = [];
    while (pos !== -1) {
      matches.push(pos);
      pos = text.indexOf(char, pos + 1);
    }
    return [text.replaceAll(char, "-"), matches];
  }
};

export const filterAsQuery = (filter: Filter, namedFilters) => {
  console.log(`filterAsQuery`, {
    filter,
  });
  if (filter.op === "or" || filter.op === "and") {
    const [clause1, clause2] = filter.filters;
    return `${filterAsQuery(clause1, namedFilters)} ${
      filter.op
    } ${filterAsQuery(clause2, namedFilters)}`;
  } else if (filter.name) {
    return filterAsQuery(getNamedFilter(namedFilters, filter.name));
  }

  let query = "";
  const { column, op, value, values } = filter;
  if (typeof value === "string" && value.indexOf(SPECIAL_SPACE) !== -1) {
    query = `${column} ${op} '${value.replace(RegExp(SPECIAL_SPACE), " ")}'`;
  } else if (value) {
    query = `${column} ${op} ${value}`;
  } else if (values) {
    query = `${column} ${op} [${values.join(",")}]`;
  }
  return query;
};

export function extractFilter([parseResult]: ParsedFilter): {
  filter: Filter;
  name?: string;
} {
  const { pos, tokenPosition, label, ...filter } = parseResult;
  return { filter: filter as Filter, name: label };
}

export function computeTokenIndexAndText(parser, parseTree, caretPosition) {
  const [atEndOfText, caretText = ""] = caretAtEndOfText(
    parser.inputStream.tokens,
    caretPosition
  );
  const {
    index,
    text,
    singleCharacterSymbol = false,
  } = computeTokenPosition(parseTree, caretPosition);

  return atEndOfText && !singleCharacterSymbol
    ? { index, text, alternative: { index: index - 1, text: caretText } }
    : { index, text };
}

function computeTokenPosition(parseTree, caretPosition) {
  if (parseTree instanceof ErrorNode) {
    return;
  } else if (parseTree instanceof TerminalNode) {
    return computeTokenPositionOfTerminal(parseTree, caretPosition);
  } else {
    return computeTokenPositionOfChildNode(parseTree, caretPosition);
  }
}

function positionOfToken(token, text, caretPosition) {
  let start = token.charPositionInLine;
  let stop = token.charPositionInLine + text.length;
  if (start <= caretPosition && stop >= caretPosition) {
    let index = token.tokenIndex;
    if (singleCharacterSymbols.has(token.type)) {
      return {
        index: index + 1,
        singleCharacterSymbol: true,
        text: "",
      };
    } else {
      return {
        index: index,
        start,
        text: text.substring(0, caretPosition - start),
      };
    }
  } else {
    return undefined;
  }
}

function computeTokenPositionOfTerminal(parseTree, caretPosition) {
  return positionOfToken(
    parseTree.symbol,
    parseTree.text,
    caretPosition,
    parseTree
  );
}

function computeTokenPositionOfChildNode(parseTree, caretPosition) {
  for (let i = 0; i < parseTree.childCount; i++) {
    let position = computeTokenPosition(parseTree.getChild(i), caretPosition);
    if (position !== undefined) {
      return position;
    }
  }
}
