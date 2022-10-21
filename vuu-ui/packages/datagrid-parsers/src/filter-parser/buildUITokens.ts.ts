import { FilterParser } from "../../generated/parsers/filter/FilterParser";
import { Filter } from "@vuu-ui/utils";
import { CharacterSubstitution } from "./FilterVisitor";
import { CommonTokenStream, TokenStream } from "antlr4ts";

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
};

type TokenType = keyof typeof TOKEN_TYPES;

const tokenType = (type: TokenType) => TOKEN_TYPES[type] ?? "text";
const NO_SUBSTITUTION = {};

export type UIToken = {
  type: "column" | "operator" | "ws";
  text: string;
  start: number;
};

export function buildUITokens(
  parser: FilterParser,
  parseResult: Filter | undefined,
  typeSubstitution = NO_SUBSTITUTION,
  pattern: RegExp,
  characterSubstitutions?: CharacterSubstitution[]
): UIToken[] {
  if (parseResult) {
    console.log(`[buildUITokens] typedSubstitution ${typeSubstitution},
      characterSubstitutions: ${JSON.stringify(characterSubstitutions)}
    `);
    const tokenPositions = mapTokenPositions([parseResult]);
    const parsedTokens = (parser.inputStream as CommonTokenStream).getTokens();
    const tokens: UIToken[] = [];
    for (let i = 0; i < parsedTokens.length - 1; i++) {
      const t = parsedTokens[i];
      let tokenText = t.text;

      if (
        characterSubstitutions &&
        characterSubstitutions.length > 0 &&
        typeof tokenText === "string" &&
        pattern.test(tokenText)
      ) {
        const substitution =
          characterSubstitutions.shift() as CharacterSubstitution;
        const regexp = new RegExp(`${substitution.substitutedChar}`);
        tokenText = tokenText.replace(regexp, substitution.sourceChar);
      }
      tokens.push({
        type: tokenPositions[t.startIndex] ?? t.tokenType ?? tokenType(t.type),
        text: typeSubstitution[tokenText] ?? tokenText,
        start: t.startIndex,
      });
    }
    return tokens;
  } else {
    return [];
  }
}

function mapTokenPositions(
  filters: Array<Filter & { tokenPosition?: any }>,
  idx = 0,
  map: { [key: number]: string } = {}
) {
  const f = filters[idx];
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
