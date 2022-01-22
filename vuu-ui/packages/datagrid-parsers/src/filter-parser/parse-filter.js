import { CharStreams } from 'antlr4ts/CharStreams';
import { CommonTokenStream } from 'antlr4ts/CommonTokenStream';
import { lastWord } from '@vuu-ui/utils';
import { FilterParser } from '../../generated/parsers/filter/FilterParser';
import { FilterLexer } from '../../generated/parsers/filter/FilterLexer';
import FilterVisitor from './FilterVisitor.js';
import { getSuggestions } from './parse-suggestions';
import { buildUITokens } from './ui-tokens';

class ExprErrorListener {
  constructor(errors) {
    this.errors = errors;
  }

  syntaxError(recognizer, offendingSymbol, line, column, msg, err) {
    // onsole.log(`%cerror ${msg}`, 'color: red;font-weight: bold;');
    this.errors.push(err);
  }
}

export const parseFilter = (input, typedInput = input, suggestionProvider, isList = false) => {
  // console.log(`%cparseFilter ${input} ('${typedInput}')`, 'color:red;font-weight: bold;');

  const errors = [];

  const parser = constructParser(typedInput);

  const errorListener = new ExprErrorListener(errors);

  parser.removeErrorListeners();
  parser.addErrorListener(errorListener);

  parser.buildParseTrees = true;
  const parseTree = parser.expression();
  // onsole.log({ tokens: parser.inputStream.tokens.map((t) => t.text) });
  const visitor = new FilterVisitor();
  const parseResult = visitor.visit(parseTree);

  const caretPosition = typedInput.length;

  const substitution =
    input === typedInput ? undefined : { [lastWord(typedInput)]: lastWord(input) };

  const parsedTokens = buildUITokens(parser, parseResult, substitution);

  try {
    // Important that we pass the original parseTree, do not allow suggestion mechanism to regenerate it,
    // results will be different, probably due to caching.
    const suggestions = getSuggestions(
      parser,
      parseTree,
      caretPosition,
      suggestionProvider,
      parseResult,
      parsedTokens,
      isList
    );

    return [input, parseResult, errors, parsedTokens, suggestions];
  } catch (err) {
    if (err.type === 'open-list') {
      // TODO do we need to check whether input already ends with space or can we assume it ?
      return parseFilter(`${input}${err.text}`, undefined, suggestionProvider, true);
    } else {
      console.error(err);
      return [];
    }
  }
};

function constructParser(input) {
  let inputStream = CharStreams.fromString(input);
  let lexer = new FilterLexer(inputStream);
  let tokenStream = new CommonTokenStream(lexer);
  var parser = new FilterParser(tokenStream);
  return parser;
}
