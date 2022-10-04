import { FilterParser } from "../../generated/parsers/filter/FilterParser";
import { ParsedFilter } from "./FilterVisitor";

// We should be able to derive these from the parser, using Rules
const TOKEN_TYPES = {
  [FilterParser.ID]: "ID",
  [FilterParser.STRING]: "string",
  [FilterParser.EQ]: "operator",
  [FilterParser.GT]: "operator",
  [FilterParser.LT]: "operator",
  [FilterParser.IN]: "operator",
  [FilterParser.CONTAINS]: "operator",
  [FilterParser.STARTS]: "operator",
  [FilterParser.ENDS]: "operator",
  [FilterParser.NEQ]: "operator",
  [FilterParser.INT]: "number",
  [FilterParser.FLOAT]: "number",
  [FilterParser.NUMBER_SHORTHAND]: "number",
};

const tokenType = (type) => TOKEN_TYPES[type] ?? "text";
const NO_SUBSTITUTION = {};

export type UIToken = {
  type: "column" | "operator";
  text: string;
  start: number;
};

export function buildUITokens(
  parser: FilterParser,
  parseResult: ParsedFilter,
  substitution = NO_SUBSTITUTION
) {
  const tokenPositions = mapTokenPositions(parseResult);
  const { tokens: parsedTokens } = parser.inputStream;

  const tokens: UIToken[] = [];
  for (let i = 0; i < parsedTokens.length - 1; i++) {
    const t = parsedTokens[i];
    const tokenText = t.text;
    tokens.push({
      type: tokenPositions[t.start] ?? t.tokenType ?? tokenType(t.type),
      text: substitution[tokenText] ?? tokenText,
      start: t.start,
    });
  }
  return tokens;
}

function mapTokenPositions(parseResults: ParsedFilter, idx = 0, map = {}) {
  const f = parseResults[idx];
  if (!f) {
    return map;
  } else {
    if (f.op === "or" || f.op === "and") {
      f.filters?.forEach((_, i, all) => mapTokenPositions(all, i, map));
    } else if (f.tokenPosition) {
      for (let [key, value] of Object.entries(f.tokenPosition)) {
        map[value] = key;
      }
    }
  }
  return map;
}
