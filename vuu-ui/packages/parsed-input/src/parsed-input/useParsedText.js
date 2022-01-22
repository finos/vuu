import { useCallback, useRef, useState } from 'react';
import { useParser } from '../parser-provider';

const SPACES = '                 ';
const str = (len) => SPACES.slice(0, len);
const SUGGESTION_PRIORITIES = {
  EOF: 0,
  '=': 1
};

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
  options: undefined
};

const sameSuggestions = (s1, s2) => {
  if (s1.length === s2.length) {
    return s1.every((s) => s2.find((suggs) => suggs.value === s.value));
  }
};

export const useParsedText = () => {
  const parse = useParser();
  const textRef = useRef('');
  const [{ errors, result, tokens, options }, setState] = useState(initialState);
  const [suggestions, setSuggestions] = useState([]);
  const suggestionsRef = useRef(suggestions);

  const parseText = useCallback(
    async (newText, typedSubstitutionText) => {
      const [text, result, errors, tokens, promisedSuggestions, options] = parse(
        newText,
        typedSubstitutionText
      );
      // Note: text can change, symbols can be inserted
      textRef.current = text;

      setState(() => ({
        errors,
        result,
        tokens: addWhiteSpace(tokens, text.length),
        options
      }));
      const newSuggestions = await promisedSuggestions;

      const isMultiSelect =
        newSuggestions.length > 0 && newSuggestions.every((suggestion) => suggestion.isListItem);

      if (!isMultiSelect || !sameSuggestions(suggestionsRef.current, newSuggestions)) {
        // don't refresh the suggestions whilst user is editing a multi-select list
        suggestionsRef.current = newSuggestions;
        newSuggestions.sort(bySuggestionPriority);
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
    options
  };
};
