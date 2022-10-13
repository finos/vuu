import { CharStreams } from "antlr4ts/CharStreams";
import { CommonTokenStream } from "antlr4ts/CommonTokenStream";
import { lastWord } from "@vuu-ui/utils";
import { FilterParser } from "../../generated/parsers/filter/FilterParser";
import { FilterLexer } from "../../generated/parsers/filter/FilterLexer";
import FilterVisitor, { ParsedFilter } from "./FilterVisitor.js";
import {
  ExactMatchFromListError,
  OpenListError,
  parseSuggestions,
  SuggestionProvider,
  SuggestionResult,
} from "./parse-suggestions";
import { buildUITokens, UIToken } from "./ui-tokens";
import { isOpenList } from "./parse-utils";
import { RecognitionException, Recognizer } from "antlr4ts";

class ExprErrorListener<TSymbol = unknown> {
  errors: RecognitionException[] = [];
  constructor(errors: RecognitionException[]) {
    this.errors = errors;
  }

  syntaxError(
    recognizer: Recognizer<TSymbol, any>,
    offendingSymbol: TSymbol,
    line: number,
    column: number,
    msg: string,
    err: RecognitionException | undefined
  ) {
    // onsole.log(`%cerror ${msg}`, 'color: red;font-weight: bold;');
    if (err !== undefined) {
      this.errors.push(err);
    }
  }
}

const DEFAULT_OPTIONS = { insertSymbol: "" };

export type ParserResults<ParsedType = unknown> = [
  string,
  ParsedType,
  RecognitionException[],
  UIToken[],
  SuggestionResult | Promise<SuggestionResult>,
  string | undefined
];

export type FilterParseResults = ParserResults<ParsedFilter>;

function constructParser(input: string) {
  let inputStream = CharStreams.fromString(input);
  let lexer = new FilterLexer(inputStream);
  let tokenStream = new CommonTokenStream(lexer);
  var parser = new FilterParser(tokenStream);
  return parser;
}

export const parseFilter = (
  input: string,
  typedInput: string = input,
  suggestionProvider: SuggestionProvider,
  { insertSymbol = "" } = DEFAULT_OPTIONS
): FilterParseResults => {
  console.log(
    `%c[parse-filter] input: '${input}', typedInput: '${typedInput}'`,
    "background: green; color: white; font-weight: bold"
  );
  const errors: RecognitionException[] = [];
  // TODO we need to identify where this has happened so we can safely restore the characters
  const safeText = typedInput.replaceAll("/", "--");
  const parser = constructParser(`${safeText}${insertSymbol}`);

  const errorListener = new ExprErrorListener(errors);

  parser.removeErrorListeners();
  parser.addErrorListener(errorListener);

  parser.buildParseTree = true;
  const parseTree = parser.expression();
  // onsole.log({ tokens: parser.inputStream.tokens.map((t) => t.text) });
  const visitor = new FilterVisitor();
  const parseResult = visitor.visit(parseTree);
  console.log(JSON.stringify(parseResult, null, 2));

  const caretPosition = typedInput.length;

  const substitution =
    input === typedInput
      ? undefined
      : { [lastWord(typedInput)]: lastWord(input) };

  const parsedTokens = buildUITokens(parser, parseResult, substitution);
  const isList = isOpenList(parsedTokens);

  try {
    // Important that we pass the original parseTree, do not allow suggestion mechanism to regenerate it,
    // results will be different, probably due to caching.
    const suggestions = parseSuggestions(
      parser,
      parseTree,
      caretPosition,
      suggestionProvider,
      parseResult,
      parsedTokens,
      isList
    );

    if (insertSymbol) {
      const [lastToken] = parsedTokens.slice(-1);
      if (lastToken.text === insertSymbol) {
        parsedTokens.pop();
      }
    }
    return [
      input,
      parseResult,
      errors,
      parsedTokens,
      suggestions,
      insertSymbol,
    ];
  } catch (err: unknown) {
    if (err instanceof OpenListError) {
      // TODO do we need to check whether input already ends with space or can we assume it ?
      return parseFilter(`${input}`, undefined, suggestionProvider, {
        insertSymbol: err.text,
      });
    } else if (err instanceof ExactMatchFromListError) {
      return parseFilter(err.value, err.typedName, suggestionProvider);
    } else {
      throw err;
    }
  }
};
