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
  suggestions: [],
  tokens: [],
  options: undefined
};

// const GREEN = 'color: green;',
//   BROWN_BOLD = 'color:brown;font-weight:bold;',
//   BLACK_BOLD = 'color:black;font-weight: bold;';

export const useParsedText = () => {
  const parse = useParser();
  const textRef = useRef('');
  const prevSuggestions = useRef([]);
  const [{ errors, result, suggestions, tokens, options }, setState] = useState(initialState);

  const parseText = useCallback(
    async (newText, typedSubstitutionText) => {
      const [text, result, errors, tokens, promisedSuggestions, options] = parse(
        newText,
        typedSubstitutionText
      );
      // Note: text can change, symbols can be inserted
      textRef.current = text;
      //   console.log(
      //     `%c[useParsedText] newText '${newText}' '%c${text}%c ${JSON.stringify(tokens,null,2)}' setState %ctokens%c
      // ${JSON.stringify(tokens)}
      // `,
      //     GREEN,
      //     BROWN_BOLD,
      //     GREEN,
      //     BLACK_BOLD,
      //     GREEN,
      //   );

      //   console.log({result})

      // setState(state => ({ ...state, errors, result, tokens: addWhiteSpace(tokens, text.length), options }));
      setState(() => ({
        suggestions: [],
        errors,
        result,
        tokens: addWhiteSpace(tokens, text.length),
        options
      }));
      const newSuggestions = await promisedSuggestions;
      // if (!sameSuggestions(prevSuggestions.current, newSuggestions)) {
      // console.log(
      //   `%c[useParsedText] newText '${newText}' '%c${text}%c' setState %csuggestions%c
      // ${JSON.stringify(newSuggestions)}
      // `,
      //   GREEN,
      //   BROWN_BOLD,
      //   GREEN,
      //   BLACK_BOLD,
      //   GREEN
      // );
      newSuggestions.sort(bySuggestionPriority);
      setState((state) => ({ ...state, suggestions: newSuggestions }));
      prevSuggestions.current = newSuggestions;
      // }
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
