import { SuggestionResult, UIToken } from "@vuu-ui/datagrid-parsers";
import { ParsedFilter } from "@vuu-ui/datagrid-parsers/src/filter-parser/FilterVisitor";
import { MutableRefObject, useCallback, useRef, useState } from "react";
import { useParser } from "../parser-provider";

interface ParseState {
  errors?: Error[];
  insertSymbol?: string;
  result?: ParsedFilter;
  tokens: UIToken[];
}

interface ParseHistoryEntry extends ParseState {
  suggestions: SuggestionResult;
  text: string;
}

const SPACES = "                 ";
const str = (len: number) => SPACES.slice(0, len);
const SUGGESTION_PRIORITIES = {
  EOF: 0,
  "=": 1,
};

const NO_SUGGESTIONS: SuggestionResult = {
  values: [],
  total: 0,
  isMultiSelect: undefined,
};

const bySuggestionPriority = ({ value: v1 }, { value: v2 }) =>
  (SUGGESTION_PRIORITIES[v1] ?? 2) - (SUGGESTION_PRIORITIES[v2] ?? 2);

/**
 * If two tokens are not contiguous, there is whitespace in between. Create
 * an explicit token to represent this whitespace.
 *
 * @param token1 {UIToken}
 * @param token2 {UIToken}
 * @returns
 */
const whiteSpaceToken = (
  token1: UIToken,
  token2: Pick<UIToken, "start">
): UIToken => ({
  start: token1.start + token1.text.length,
  type: "ws",
  text: str(token2.start - (token1.start + token1.text.length)),
});

// TODO use reducer to efficiently build up token list with minimal creation
const addWhiteSpace = (tokens: UIToken[], caretPosition: number) => {
  const result = tokens.reduce<UIToken[]>((out, token, idx, all) => {
    if (idx) {
      out.push(whiteSpaceToken(all[idx - 1], token));
    }
    out.push(token);
    return out;
  }, []);

  if (tokens.length > 0) {
    const [lastToken] = tokens.slice(-1);
    if (lastToken.start + lastToken.text.length < caretPosition) {
      result.push(whiteSpaceToken(lastToken, { start: caretPosition }));
    }
  }

  return result;
};

const initialState = {
  errors: [],
  result: undefined,
  tokens: [],
  insertSymbol: "",
} as ParseState;

// const sameSuggestions = (s1, s2) => {
//   if (s1.total === s2.total) {
//     return s1.values.every((s) => s2.values.find((suggs) => suggs.value === s.value));
//   }
// };

export interface ParsedTextHookResult {
  hasErrors: boolean;
  insertSymbol?: string;
  parseText: (text: string, typedTest: string) => void;
  result: ParsedFilter | undefined;
  suggestions: SuggestionResult;
  textRef: MutableRefObject<string>;
  tokens: UIToken[];
}

export const useParsedText = (): ParsedTextHookResult => {
  const parse = useParser();
  const textRef = useRef("");
  const [{ errors, result, tokens, insertSymbol }, setState] =
    useState<ParseState>(initialState);
  const [suggestions, setSuggestions] = useState(NO_SUGGESTIONS);
  const suggestionsRef = useRef(suggestions);

  const parseText = useCallback(
    async (newText: string, typedSubstitutionText?: string) => {
      console.log(
        `[useParsedText] parseText text='${newText}' typedSubstitutionText='${typedSubstitutionText}'`
      );
      const [text, result, errors, tokens, promisedSuggestions, insertSymbol] =
        parse(newText, typedSubstitutionText);
      // Note: text can change, symbols can be inserted
      textRef.current = text;

      const tokensWithWhitespace = addWhiteSpace(tokens, text.length);

      setState(() => ({
        errors,
        result,
        tokens: tokensWithWhitespace,
        insertSymbol,
      }));
      const newSuggestions = await promisedSuggestions;
      suggestionsRef.current = newSuggestions;
      newSuggestions.values.sort(bySuggestionPriority);
      setSuggestions(newSuggestions);
    },
    [parse]
  );

  return {
    hasErrors: errors !== undefined && errors.length > 0,
    result,
    parseText,
    suggestions,
    textRef,
    tokens,
    insertSymbol,
  };
};
