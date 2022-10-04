/* eslint-disable no-throw-literal */
import * as c3 from "antlr4-c3";
import { CommonTokenStream } from "antlr4ts";
import {
  ExpressionContext,
  FilterParser,
} from "../../generated/parsers/filter/FilterParser";
import { ParsedFilter } from "./FilterVisitor";
import { computeTokenIndexAndText } from "./parse-utils";
import { UIToken } from "./ui-tokens";

export type SuggestionItem = {
  completion: string;
  isIllustration: boolean;
  isListItem: boolean;
  isSelected: boolean;
  type?: string;
  typedName?: string;
  value: string;
};

export type SuggestionResult = {
  isMultiSelect?: boolean;
  total: number;
  values: SuggestionItem[];
};

export type SuggestionProviderProps = {
  parsedFilter: ParsedFilter;
  isListItem?: boolean;
  operator?: string;
  text: string;
  token: "COLUMN-NAME" | "NAMED-FILTER" | "FILTER-NAME" | "COLUMN-VALUE";
  values?: UIToken[];
};

export type SuggestionProviderResult = {
  isListItem?: boolean;
  values: SuggestionItem[];
  total?: number;
};

export type SuggestionProvider = (
  props: SuggestionProviderProps
) => SuggestionProviderResult | Promise<SuggestionProviderResult>;

type SuggestedValues = {
  values: Array<{ value: string; completion: string }>;
};

export const NO_SUGGESTIONS: SuggestionResult = {
  isMultiSelect: false,
  values: [],
  total: 0,
};

const NO_OPERATOR = [];

const getInValues = (tokens) => {
  return tokens.filter((t) => t.text !== ",");
};

const getOperatorToken = (uiTokens: UIToken[]) => {
  for (let i = uiTokens.length - 1; i >= 0; i--) {
    const token = uiTokens[i];
    // TODO us this always correct ?
    if (token.type === "operator") {
      if (token.text === "in") {
        return [token, getInValues(uiTokens.slice(i + 2))];
      } else {
        return [token];
      }
    }
  }
  return NO_OPERATOR;
};

const textValue = (text) =>
  text.startsWith("'") ? text.slice(1, -1).toLowerCase() : text;

const maybeSuggest = (suggestion, text, lastToken, suggestions) => {
  // ID_ tokens are typed substitutions
  if (!suggestion.startsWith("ID_") && tokenMatches(suggestion, text)) {
    suggestions.push({
      value: suggestion,
      completion: getCompletion(suggestion, lastToken),
    });
  }
};

const fullMatchOnOnlyCandidate = (suggestions, text) =>
  suggestions.length === 1 &&
  suggestions[0].value.toLowerCase() === text.toLowerCase();

function tokenMatches(completion, text) {
  const lcCompletion = completion.toLowerCase();
  const lcText = text === "" ? text : text.toLowerCase();
  return (
    lcText.trim().length === 0 ||
    (lcCompletion.startsWith(lcText) && lcCompletion !== lcText)
  );
}

const getCompletion = (suggestion, lastTokenText) => {
  if (suggestion.startsWith(lastTokenText)) {
    return suggestion.slice(lastTokenText.length);
  } else {
    return suggestion;
  }
};

export const getSuggestions = (
  parser: FilterParser,
  parseTree: ExpressionContext,
  caretPosition: number,
  suggestionProvider: SuggestionProvider,
  parseResult: ParsedFilter,
  uiTokens: UIToken[],
  isListItem = false
): Promise<SuggestionResult> => {
  const core = new c3.CodeCompletionCore(parser);
  core.preferredRules = new Set([
    FilterParser.RULE_column,
    FilterParser.RULE_filtername,
    FilterParser.RULE_named_filter,
    FilterParser.RULE_atom,
  ]);
  core.ignoredTokens = new Set([FilterParser.LPAREN]);
  let { text, index, alternative } = computeTokenIndexAndText(
    parser,
    parseTree,
    caretPosition
  );
  // onsole.log(
  //   `[parseSuggestions] %ccollect candidates, token text='${text}', caret at ${caretPosition}, token at ${index} isList ${isList}
  //   %calternative ${JSON.stringify(alternative)}
  // `,
  //   'color:red;font-weight: bold;',
  //   'color:black;font-weight: bold;s'
  // );

  let rules, tokens;
  let alternativeText: string | undefined = undefined,
    alternativeRules,
    alternativeTokens;

  ({ rules, tokens } = core.collectCandidates(index));
  // The rules, tokens maps returned by collectCandidates are stateful and mutable
  tokens = new Map(tokens);
  rules = new Map(rules);

  if (alternative) {
    ({ text: alternativeText } = alternative);
    ({ rules: alternativeRules, tokens: alternativeTokens } =
      core.collectCandidates(alternative.index));
  }

  const ruleCount = rules.size + (alternativeRules?.size ?? 0);
  const tokenCount = tokens.size + (alternativeTokens?.size ?? 0);

  if (ruleCount === 0 && tokenCount === 0) {
    return NO_SUGGESTIONS;
  } else if (tokens.size === 1 && tokensIsListOpener(tokens)) {
    // auto inject the '[' and re-parse
    throw { type: "open-list", text: "[" };
  } else if (tokens.size === 2 && tokensAreListSignifiers(tokens)) {
    // do nothing;
  } else if (
    alternativeTokens?.size === 1 &&
    tokensIsListOpener(alternativeTokens)
  ) {
    isListItem = true;
  } else if (
    alternativeTokens?.size === 2 &&
    tokensAreListSignifiers(alternativeTokens)
  ) {
    isListItem = true;
  }

  const suggestions = new AsyncSuggestionsList();
  let ignoreTokens = false;
  const inputStream = parser.inputStream as CommonTokenStream;
  const inputTokens = inputStream.getTokens();
  const [lastToken = { text: "" }] = inputTokens.slice(-2);
  if (rules.has(FilterParser.RULE_filtername)) {
    suggestions.push(
      suggestionProvider({
        parsedFilter: parseResult,
        token: "FILTER-NAME",
        text,
      })
    );
  } else if (rules.has(FilterParser.RULE_named_filter)) {
    suggestions.push(
      suggestionProvider({
        parsedFilter: parseResult,
        token: "NAMED-FILTER",
        text,
      })
    );
  }

  if (rules.has(FilterParser.RULE_column)) {
    suggestions.push(
      suggestionProvider({
        parsedFilter: parseResult,
        token: "COLUMN-NAME",
        text,
      })
    );
  } else if (
    alternativeText &&
    alternativeRules?.has(FilterParser.RULE_column)
  ) {
    const expandedSuggestions = suggestionProvider({
      parsedFilter: parseResult,
      token: "COLUMN-NAME",
      text: alternativeText,
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
    const [operatorToken, values] = getOperatorToken(uiTokens);
    suggestions.push(
      suggestionProvider({
        parsedFilter: parseResult,
        isListItem,
        operator: operatorToken?.text ?? "",
        text,
        token: "COLUMN-VALUE",
        values,
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
      suggestions.push({
        values: suggestedTokens,
        total: suggestedTokens.length,
      });
    }
  }

  if (
    suggestions.size === 0 &&
    alternativeTokens?.size > 0 &&
    alternativeText
  ) {
    const suggestedTokens = [];
    alternativeTokens.forEach((_, key) => {
      const candidate = textValue(parser.vocabulary.getDisplayName(key));
      if (candidate) {
        maybeSuggest(
          candidate,
          alternativeText,
          lastToken.text,
          suggestedTokens
        );
      }
    });
    if (suggestedTokens.length) {
      suggestions.push({
        values: suggestedTokens,
        total: suggestedTokens.length,
      });
    }
  }

  return suggestions.extractResult();
};

class AsyncSuggestionsList {
  #list: SuggestedValues[] = [];
  push(suggestions: SuggestedValues) {
    this.#list.push(suggestions);
    return this;
  }
  get size() {
    return this.#list.length;
  }
  async extractResult(): Promise<SuggestionResult> {
    const values = await Promise.all(this.#list);
    return values.reduce<SuggestionResult>(
      (acc, { values, total = 0, isListItem }) => {
        acc.values.push(...values);
        acc.total += total;
        acc.isMultiSelect = acc.isListItem || isListItem;
        return acc;
      },
      { isMultiSelect: false, values: [], total: 0 }
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
