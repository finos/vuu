/* eslint-disable no-throw-literal */
import * as c3 from 'antlr4-c3';
import { FilterParser } from '../../generated/parsers/filter/FilterParser';
import { computeTokenIndexAndText, NO_SUGGESTIONS } from './parse-utils';

const NO_OPERATOR = [];

const getInValues = (tokens) => {
  return tokens.filter((t) => t.text !== ',');
};

const getOperatorToken = (parsedTokens) => {
  for (let i = parsedTokens.length - 1; i >= 0; i--) {
    const token = parsedTokens[i];
    // TODO us this always correct ?
    if (token.type === 'operator') {
      if (token.text === 'in') {
        return [token, getInValues(parsedTokens.slice(i + 2))];
      } else {
        return [token];
      }
    }
  }
  return NO_OPERATOR;
};

const textValue = (text) => (text.startsWith("'") ? text.slice(1, -1).toLowerCase() : text);

const maybeSuggest = (suggestion, text, lastToken, suggestions) => {
  // ID_ tokens are typed substitutions
  if (!suggestion.startsWith('ID_') && tokenMatches(suggestion, text)) {
    suggestions.push({
      value: suggestion,
      completion: getCompletion(suggestion, lastToken)
    });
  }
};

const fullMatchOnOnlyCandidate = (suggestions, text) =>
  suggestions.length === 1 && suggestions[0].value.toLowerCase() === text.toLowerCase();

function tokenMatches(completion, text) {
  const lcCompletion = completion.toLowerCase();
  const lcText = text === '' ? text : text.toLowerCase();
  return lcText.trim().length === 0 || (lcCompletion.startsWith(lcText) && lcCompletion !== lcText);
}

const getCompletion = (suggestion, lastTokenText) => {
  if (suggestion.startsWith(lastTokenText)) {
    return suggestion.slice(lastTokenText.length);
  } else {
    return suggestion;
  }
};

export const getSuggestions = (
  parser,
  parseTree,
  caretPosition,
  suggestionProvider,
  parseResult,
  parsedTokens,
  isListItem = false
) => {
  const core = new c3.CodeCompletionCore(parser);
  core.preferredRules = new Set([
    FilterParser.RULE_column,
    FilterParser.RULE_filtername,
    FilterParser.RULE_named_filter,
    FilterParser.RULE_atom
  ]);
  core.ignoredTokens = new Set([FilterParser.LPAREN]);
  let { text, index, alternative } = computeTokenIndexAndText(parser, parseTree, caretPosition);
  // onsole.log(
  //   `[parseSuggestions] %ccollect candidates, token text='${text}', caret at ${caretPosition}, token at ${index} isList ${isList}
  //   %calternative ${JSON.stringify(alternative)}
  // `,
  //   'color:red;font-weight: bold;',
  //   'color:black;font-weight: bold;s'
  // );

  let rules, tokens;
  let alternativeText, alternativeRules, alternativeTokens;

  ({ rules, tokens } = core.collectCandidates(index));
  // The rules, tokens maps returned by collectCandidates are stateful and mutable
  tokens = new Map(tokens);
  rules = new Map(rules);

  if (alternative) {
    ({ text: alternativeText } = alternative);
    ({ rules: alternativeRules, tokens: alternativeTokens } = core.collectCandidates(
      alternative.index
    ));
  }

  const ruleCount = rules.size + (alternativeRules?.size ?? 0);
  const tokenCount = tokens.size + (alternativeTokens?.size ?? 0);

  if (ruleCount === 0 && tokenCount === 0) {
    return NO_SUGGESTIONS;
  } else if (tokens.size === 1 && tokensIsListOpener(tokens)) {
    // auto inject the '[' and re-parse
    throw { type: 'open-list', text: '[' };
  } else if (tokens.size === 2 && tokensAreListSignifiers(tokens)) {
    // do nothing;
  } else if (alternativeTokens?.size === 1 && tokensIsListOpener(alternativeTokens)) {
    isListItem = true;
  } else if (alternativeTokens?.size === 2 && tokensAreListSignifiers(alternativeTokens)) {
    isListItem = true;
  }

  const suggestions = new AsyncSuggestionsList();
  let ignoreTokens = false;
  const [lastToken = { text: '' }] = parser.inputStream.tokens.slice(-2);
  if (rules.has(FilterParser.RULE_filtername)) {
    suggestions.push(suggestionProvider(parseResult, { token: 'FILTER-NAME', text }));
  } else if (rules.has(FilterParser.RULE_named_filter)) {
    suggestions.push(suggestionProvider(parseResult, { token: 'NAMED-FILTER', text }));
  }

  if (rules.has(FilterParser.RULE_column)) {
    suggestions.push(suggestionProvider(parseResult, { token: 'COLUMN-NAME', text }));
  } else if (alternativeRules?.has(FilterParser.RULE_column)) {
    const expandedSuggestions = suggestionProvider(parseResult, {
      token: 'COLUMN-NAME',
      text: alternativeText
    });
    if (
      expandedSuggestions.total &&
      !fullMatchOnOnlyCandidate(expandedSuggestions.values, alternativeText)
    ) {
      suggestions.push(expandedSuggestions);
      ignoreTokens = true;
    }
  }
  if (rules.has(FilterParser.RULE_atom)) {
    const [operatorToken, values] = getOperatorToken(parsedTokens);
    suggestions.push(
      suggestionProvider(parseResult, {
        isListItem,
        operator: operatorToken?.text ?? '',
        text,
        token: 'COLUMN-VALUE',
        values
      })
    );
  }

  if (!ignoreTokens) {
    const suggestedTokens = [];
    tokens.forEach((_, key) => {
      let candidate;
      if (key === FilterParser.RULE_column) {
        // ignore
      } else {
        candidate = textValue(parser.vocabulary.getDisplayName(key));
      }

      if (candidate) {
        maybeSuggest(candidate, text, lastToken.text, suggestedTokens);
      }
    });
    if (suggestedTokens.length) {
      suggestions.push({ values: suggestedTokens, total: suggestedTokens.length });
    }
  }

  if (suggestions.size === 0 && alternativeTokens?.size > 0 && alternativeText) {
    const suggestedTokens = [];
    alternativeTokens.forEach((_, key) => {
      const candidate = textValue(parser.vocabulary.getDisplayName(key));
      if (candidate) {
        maybeSuggest(candidate, alternativeText, lastToken.text, suggestedTokens);
      }
    });
    if (suggestedTokens.length) {
      suggestions.push({ values: suggestedTokens, total: suggestedTokens.length });
    }
  }

  return suggestions.extractResult();
};

class AsyncSuggestionsList {
  #list = [];
  push(suggestions) {
    this.#list.push(suggestions);
    return this;
  }
  get size() {
    return this.#list.length;
  }
  async extractResult() {
    const values = await Promise.all(this.#list);
    return values.reduce(
      (acc, { values, total = 0, isListItem }) => {
        acc.values.push(...values);
        acc.total += total;
        acc.isMultiSelect = acc.isListItem || isListItem;
        return acc;
      },
      { values: [], total: 0 }
    );
  }
}

function tokensAreListSignifiers(tokens) {
  const [t1, t2] = tokens.keys();
  if (t1 === FilterParser.COMMA && t2 === FilterParser.RBRACK) {
    return true;
  }
}

function tokensIsListOpener(tokens) {
  const [token] = tokens.keys();
  return token === FilterParser.LBRACK;
}
