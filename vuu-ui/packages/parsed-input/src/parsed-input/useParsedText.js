import { useCallback, useRef, useState } from 'react';
import { useParser } from '../parser-provider';

const SPACES = '                 ';
const str = (len) => SPACES.slice(0, len);
const SUGGESTION_PRIORITIES = {
  EOF: 0,
  '=': 1
};

const NO_SUGGESTIONS = { values: [], total: 0 };

const bySuggestionPriority = ({ value: v1 }, { value: v2 }) =>
  (SUGGESTION_PRIORITIES[v1] ?? 2) - (SUGGESTION_PRIORITIES[v2] ?? 2);

const whiteSpaceToken = (token1, token2) => ({
  type: 'ws',
  text: str(token2.start - (token1.start + token1.text.length))
});

// TODO use reducer to efficiently build up token list with minimal creation
const addWhiteSpace = (tokens, caretPosition) => {
  const result = tokens.reduce((out, token, idx, all) => {
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
  result: null,
  tokens: [],
  insertSymbol: ''
};

const sameSuggestions = (s1, s2) => {
  if (s1.total === s2.total) {
    return s1.values.every((s) => s2.values.find((suggs) => suggs.value === s.value));
  }
};

export const useParsedText = () => {
  const parse = useParser();
  const textRef = useRef('');
  const [{ errors, result, tokens, insertSymbol }, setState] = useState(initialState);
  const [suggestions, setSuggestions] = useState(NO_SUGGESTIONS);
  const suggestionsRef = useRef(suggestions);

  const parseText = useCallback(
    async (newText, typedSubstitutionText) => {
      const [text, result, errors, tokens, promisedSuggestions, insertSymbol] = parse(
        newText,
        typedSubstitutionText
      );
      // Note: text can change, symbols can be inserted
      textRef.current = text;

      setState(() => ({
        errors,
        result,
        tokens: addWhiteSpace(tokens, text.length),
        insertSymbol
      }));
      const newSuggestions = await promisedSuggestions;

      if (
        !newSuggestions.isMultiSelect ||
        !sameSuggestions(suggestionsRef.current, newSuggestions)
      ) {
        // don't refresh the suggestions whilst user is editing a multi-select list
        // TODO we might need to reset sugegstions if user is typingt to filter
        suggestionsRef.current = newSuggestions;
        newSuggestions.values.sort(bySuggestionPriority);
        setSuggestions(newSuggestions);
      }
    },
    [parse]
  );

  return {
    errors,
    result,
    parseText,
    suggestions,
    textRef,
    tokens,
    insertSymbol
  };
};
