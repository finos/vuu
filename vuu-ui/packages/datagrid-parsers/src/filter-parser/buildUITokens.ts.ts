import { FilterParser } from "../../generated/parsers/filter/FilterParser";
import { Filter } from "@vuu-ui/vuu-filters";
import { CharacterSubstitution } from "./FilterVisitor";
import { CommonTokenStream } from "antlr4ts";

export type PositionalTokenName = "column" | "name" | "ws";
type TokenTypeName = "ID" | "string" | "operator" | "number";
// We should be able to derive these from the parser, using Rules
const TOKEN_TYPES: { [key: number]: TokenTypeName } = {
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

type TypeSubstitution = {
  [key: string]: string;
};

type TokenType = keyof typeof TOKEN_TYPES;

const tokenType = (type: TokenType) => TOKEN_TYPES[type] ?? "text";
const NO_SUBSTITUTION = {} as const;

export type UIToken = {
  type: PositionalTokenName | TokenTypeName;
  text: string;
  start: number;
};

export function buildUITokens(
  parser: FilterParser,
  parseResult: Filter | undefined,
  typeSubstitution: TypeSubstitution = NO_SUBSTITUTION,
  pattern: RegExp,
  characterSubstitutions?: CharacterSubstitution[]
): UIToken[] {
  console.log(`[buildUITokens] typedSubstitution ${typeSubstitution},
      characterSubstitutions: ${JSON.stringify(characterSubstitutions)}
    `);
  const tokenPositions = mapTokenPositions(parseResult);
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
      tokenText = tokenText.replaceAll(
        substitution.substitutedChar,
        substitution.sourceChar
      );
    }
    tokens.push({
      type: tokenPositions[t.startIndex] ?? tokenType(t.type as TokenType),
      text: (tokenText && typeSubstitution[tokenText]) ?? tokenText ?? "",
      start: t.startIndex,
    });
  }
  return tokens;
}

function mapTokenPositions(
  filter:
    | (Filter & { tokenPosition?: { [key in PositionalTokenName]?: number } })
    | undefined,
  map: { [key: number]: PositionalTokenName } = {}
) {
  if (!filter) {
    return map;
  } else {
    if (filter.op === "or" || filter.op === "and") {
      filter.filters?.forEach((f) => mapTokenPositions(f, map));
    } else if (filter.tokenPosition) {
      console.log({ tokenPosition: filter.tokenPosition });
      for (let [key, value] of Object.entries(filter.tokenPosition)) {
        map[value] = key as PositionalTokenName;
      }
    }
  }
  return map;
}
