// Generated from ./src/grammars/Filter.g4 by ANTLR 4.9.0-SNAPSHOT
import { ATN } from "antlr4ts/atn/ATN";
import { ATNDeserializer } from "antlr4ts/atn/ATNDeserializer";
import { FailedPredicateException } from "antlr4ts/FailedPredicateException";
import { NoViableAltException } from "antlr4ts/NoViableAltException";
import { Parser } from "antlr4ts/Parser";
import { ParserRuleContext } from "antlr4ts/ParserRuleContext";
import { ParserATNSimulator } from "antlr4ts/atn/ParserATNSimulator";
import { RecognitionException } from "antlr4ts/RecognitionException";
import { Token } from "antlr4ts/Token";
import { VocabularyImpl } from "antlr4ts/VocabularyImpl";
import * as Utils from "antlr4ts/misc/Utils";
export class FilterParser extends Parser {
    static TRUE = 1;
    static FALSE = 2;
    static AND = 3;
    static OR = 4;
    static AS = 5;
    static LT = 6;
    static GT = 7;
    static EQ = 8;
    static NEQ = 9;
    static IN = 10;
    static CONTAINS = 11;
    static STARTS = 12;
    static ENDS = 13;
    static LBRACK = 14;
    static RBRACK = 15;
    static LPAREN = 16;
    static RPAREN = 17;
    static COMMA = 18;
    static COLON = 19;
    static INT = 20;
    static FLOAT = 21;
    static INT_ABBR = 22;
    static FLOAT_ABBR = 23;
    static STRING = 24;
    static ID_STRING = 25;
    static ID_NUMERIC = 26;
    static ID = 27;
    static WS = 28;
    static RULE_expression = 0;
    static RULE_or_expression = 1;
    static RULE_and_expression = 2;
    static RULE_as_clause = 3;
    static RULE_term = 4;
    static RULE_col_set_expression = 5;
    static RULE_col_val_expression = 6;
    static RULE_numeric_col_val_expression = 7;
    static RULE_string_col_val_expression = 8;
    static RULE_default_col_val_expression = 9;
    static RULE_atoms = 10;
    static RULE_atom = 11;
    static RULE_numeric_column = 12;
    static RULE_string_column = 13;
    static RULE_column = 14;
    static RULE_filtername = 15;
    static RULE_named_filter = 16;
    static RULE_string_operator = 17;
    static RULE_numeric_operator = 18;
    static RULE_equality_operator = 19;
    static RULE_comparison_operator = 20;
    static RULE_substring_operator = 21;
    static RULE_operator = 22;
    // tslint:disable:no-trailing-whitespace
    static ruleNames = [
        "expression", "or_expression", "and_expression", "as_clause", "term",
        "col_set_expression", "col_val_expression", "numeric_col_val_expression",
        "string_col_val_expression", "default_col_val_expression", "atoms", "atom",
        "numeric_column", "string_column", "column", "filtername", "named_filter",
        "string_operator", "numeric_operator", "equality_operator", "comparison_operator",
        "substring_operator", "operator",
    ];
    static _LITERAL_NAMES = [
        undefined, "'true'", "'false'", "'and'", "'or'", "'as'", "'<'", "'>'",
        "'='", "'!='", "'in'", "'contains'", "'starts'", "'ends'", "'['", "']'",
        "'('", "')'", "','", "':'",
    ];
    static _SYMBOLIC_NAMES = [
        undefined, "TRUE", "FALSE", "AND", "OR", "AS", "LT", "GT", "EQ", "NEQ",
        "IN", "CONTAINS", "STARTS", "ENDS", "LBRACK", "RBRACK", "LPAREN", "RPAREN",
        "COMMA", "COLON", "INT", "FLOAT", "INT_ABBR", "FLOAT_ABBR", "STRING",
        "ID_STRING", "ID_NUMERIC", "ID", "WS",
    ];
    static VOCABULARY = new VocabularyImpl(FilterParser._LITERAL_NAMES, FilterParser._SYMBOLIC_NAMES, []);
    // @Override
    // @NotNull
    get vocabulary() {
        return FilterParser.VOCABULARY;
    }
    // tslint:enable:no-trailing-whitespace
    // @Override
    get grammarFileName() { return "Filter.g4"; }
    // @Override
    get ruleNames() { return FilterParser.ruleNames; }
    // @Override
    get serializedATN() { return FilterParser._serializedATN; }
    createFailedPredicateException(predicate, message) {
        return new FailedPredicateException(this, predicate, message);
    }
    constructor(input) {
        super(input);
        this._interp = new ParserATNSimulator(FilterParser._ATN, this);
    }
    // @RuleVersion(0)
    expression() {
        let _localctx = new ExpressionContext(this._ctx, this.state);
        this.enterRule(_localctx, 0, FilterParser.RULE_expression);
        let _la;
        try {
            this.enterOuterAlt(_localctx, 1);
            {
                this.state = 46;
                this.or_expression();
                this.state = 48;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                if (_la === FilterParser.AS) {
                    {
                        this.state = 47;
                        this.as_clause();
                    }
                }
                this.state = 50;
                this.match(FilterParser.EOF);
            }
        }
        catch (re) {
            if (re instanceof RecognitionException) {
                _localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            }
            else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return _localctx;
    }
    // @RuleVersion(0)
    or_expression() {
        let _localctx = new Or_expressionContext(this._ctx, this.state);
        this.enterRule(_localctx, 2, FilterParser.RULE_or_expression);
        try {
            let _alt;
            this.enterOuterAlt(_localctx, 1);
            {
                this.state = 52;
                this.and_expression();
                this.state = 57;
                this._errHandler.sync(this);
                _alt = this.interpreter.adaptivePredict(this._input, 1, this._ctx);
                while (_alt !== 2 && _alt !== ATN.INVALID_ALT_NUMBER) {
                    if (_alt === 1) {
                        {
                            {
                                this.state = 53;
                                this.match(FilterParser.OR);
                                this.state = 54;
                                this.or_expression();
                            }
                        }
                    }
                    this.state = 59;
                    this._errHandler.sync(this);
                    _alt = this.interpreter.adaptivePredict(this._input, 1, this._ctx);
                }
            }
        }
        catch (re) {
            if (re instanceof RecognitionException) {
                _localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            }
            else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return _localctx;
    }
    // @RuleVersion(0)
    and_expression() {
        let _localctx = new And_expressionContext(this._ctx, this.state);
        this.enterRule(_localctx, 4, FilterParser.RULE_and_expression);
        let _la;
        try {
            this.enterOuterAlt(_localctx, 1);
            {
                this.state = 60;
                this.term();
                this.state = 65;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                while (_la === FilterParser.AND) {
                    {
                        {
                            this.state = 61;
                            this.match(FilterParser.AND);
                            this.state = 62;
                            this.term();
                        }
                    }
                    this.state = 67;
                    this._errHandler.sync(this);
                    _la = this._input.LA(1);
                }
            }
        }
        catch (re) {
            if (re instanceof RecognitionException) {
                _localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            }
            else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return _localctx;
    }
    // @RuleVersion(0)
    as_clause() {
        let _localctx = new As_clauseContext(this._ctx, this.state);
        this.enterRule(_localctx, 6, FilterParser.RULE_as_clause);
        try {
            this.enterOuterAlt(_localctx, 1);
            {
                this.state = 68;
                this.match(FilterParser.AS);
                this.state = 69;
                this.filtername();
            }
        }
        catch (re) {
            if (re instanceof RecognitionException) {
                _localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            }
            else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return _localctx;
    }
    // @RuleVersion(0)
    term() {
        let _localctx = new TermContext(this._ctx, this.state);
        this.enterRule(_localctx, 8, FilterParser.RULE_term);
        try {
            this.state = 78;
            this._errHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this._input, 3, this._ctx)) {
                case 1:
                    this.enterOuterAlt(_localctx, 1);
                    {
                        this.state = 71;
                        this.col_val_expression();
                    }
                    break;
                case 2:
                    this.enterOuterAlt(_localctx, 2);
                    {
                        this.state = 72;
                        this.col_set_expression();
                    }
                    break;
                case 3:
                    this.enterOuterAlt(_localctx, 3);
                    {
                        this.state = 73;
                        this.named_filter();
                    }
                    break;
                case 4:
                    this.enterOuterAlt(_localctx, 4);
                    {
                        this.state = 74;
                        this.match(FilterParser.LPAREN);
                        this.state = 75;
                        this.or_expression();
                        this.state = 76;
                        this.match(FilterParser.RPAREN);
                    }
                    break;
            }
        }
        catch (re) {
            if (re instanceof RecognitionException) {
                _localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            }
            else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return _localctx;
    }
    // @RuleVersion(0)
    col_set_expression() {
        let _localctx = new Col_set_expressionContext(this._ctx, this.state);
        this.enterRule(_localctx, 10, FilterParser.RULE_col_set_expression);
        try {
            this.enterOuterAlt(_localctx, 1);
            {
                this.state = 82;
                this._errHandler.sync(this);
                switch (this._input.LA(1)) {
                    case FilterParser.ID:
                        {
                            this.state = 80;
                            this.column();
                        }
                        break;
                    case FilterParser.ID_STRING:
                        {
                            this.state = 81;
                            this.string_column();
                        }
                        break;
                    default:
                        throw new NoViableAltException(this);
                }
                this.state = 84;
                this.match(FilterParser.IN);
                this.state = 85;
                this.match(FilterParser.LBRACK);
                this.state = 86;
                this.atoms();
                this.state = 87;
                this.match(FilterParser.RBRACK);
            }
        }
        catch (re) {
            if (re instanceof RecognitionException) {
                _localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            }
            else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return _localctx;
    }
    // @RuleVersion(0)
    col_val_expression() {
        let _localctx = new Col_val_expressionContext(this._ctx, this.state);
        this.enterRule(_localctx, 12, FilterParser.RULE_col_val_expression);
        try {
            this.state = 92;
            this._errHandler.sync(this);
            switch (this._input.LA(1)) {
                case FilterParser.ID_NUMERIC:
                    this.enterOuterAlt(_localctx, 1);
                    {
                        this.state = 89;
                        this.numeric_col_val_expression();
                    }
                    break;
                case FilterParser.ID_STRING:
                    this.enterOuterAlt(_localctx, 2);
                    {
                        this.state = 90;
                        this.string_col_val_expression();
                    }
                    break;
                case FilterParser.ID:
                    this.enterOuterAlt(_localctx, 3);
                    {
                        this.state = 91;
                        this.default_col_val_expression();
                    }
                    break;
                default:
                    throw new NoViableAltException(this);
            }
        }
        catch (re) {
            if (re instanceof RecognitionException) {
                _localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            }
            else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return _localctx;
    }
    // @RuleVersion(0)
    numeric_col_val_expression() {
        let _localctx = new Numeric_col_val_expressionContext(this._ctx, this.state);
        this.enterRule(_localctx, 14, FilterParser.RULE_numeric_col_val_expression);
        try {
            this.enterOuterAlt(_localctx, 1);
            {
                this.state = 94;
                this.numeric_column();
                this.state = 95;
                this.numeric_operator();
                this.state = 96;
                this.atom();
            }
        }
        catch (re) {
            if (re instanceof RecognitionException) {
                _localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            }
            else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return _localctx;
    }
    // @RuleVersion(0)
    string_col_val_expression() {
        let _localctx = new String_col_val_expressionContext(this._ctx, this.state);
        this.enterRule(_localctx, 16, FilterParser.RULE_string_col_val_expression);
        try {
            this.enterOuterAlt(_localctx, 1);
            {
                this.state = 98;
                this.string_column();
                this.state = 99;
                this.string_operator();
                this.state = 100;
                this.atom();
            }
        }
        catch (re) {
            if (re instanceof RecognitionException) {
                _localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            }
            else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return _localctx;
    }
    // @RuleVersion(0)
    default_col_val_expression() {
        let _localctx = new Default_col_val_expressionContext(this._ctx, this.state);
        this.enterRule(_localctx, 18, FilterParser.RULE_default_col_val_expression);
        try {
            this.enterOuterAlt(_localctx, 1);
            {
                this.state = 102;
                this.column();
                this.state = 103;
                this.operator();
                this.state = 104;
                this.atom();
            }
        }
        catch (re) {
            if (re instanceof RecognitionException) {
                _localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            }
            else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return _localctx;
    }
    // @RuleVersion(0)
    atoms() {
        let _localctx = new AtomsContext(this._ctx, this.state);
        this.enterRule(_localctx, 20, FilterParser.RULE_atoms);
        let _la;
        try {
            this.enterOuterAlt(_localctx, 1);
            {
                this.state = 106;
                this.atom();
                this.state = 111;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                while (_la === FilterParser.COMMA) {
                    {
                        {
                            this.state = 107;
                            this.match(FilterParser.COMMA);
                            this.state = 108;
                            this.atom();
                        }
                    }
                    this.state = 113;
                    this._errHandler.sync(this);
                    _la = this._input.LA(1);
                }
            }
        }
        catch (re) {
            if (re instanceof RecognitionException) {
                _localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            }
            else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return _localctx;
    }
    // @RuleVersion(0)
    atom() {
        let _localctx = new AtomContext(this._ctx, this.state);
        this.enterRule(_localctx, 22, FilterParser.RULE_atom);
        let _la;
        try {
            this.enterOuterAlt(_localctx, 1);
            {
                this.state = 114;
                _la = this._input.LA(1);
                if (!((((_la) & ~0x1F) === 0 && ((1 << _la) & ((1 << FilterParser.TRUE) | (1 << FilterParser.FALSE) | (1 << FilterParser.INT) | (1 << FilterParser.FLOAT) | (1 << FilterParser.INT_ABBR) | (1 << FilterParser.FLOAT_ABBR) | (1 << FilterParser.STRING) | (1 << FilterParser.ID))) !== 0))) {
                    this._errHandler.recoverInline(this);
                }
                else {
                    if (this._input.LA(1) === Token.EOF) {
                        this.matchedEOF = true;
                    }
                    this._errHandler.reportMatch(this);
                    this.consume();
                }
            }
        }
        catch (re) {
            if (re instanceof RecognitionException) {
                _localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            }
            else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return _localctx;
    }
    // @RuleVersion(0)
    numeric_column() {
        let _localctx = new Numeric_columnContext(this._ctx, this.state);
        this.enterRule(_localctx, 24, FilterParser.RULE_numeric_column);
        try {
            this.enterOuterAlt(_localctx, 1);
            {
                this.state = 116;
                this.match(FilterParser.ID_NUMERIC);
            }
        }
        catch (re) {
            if (re instanceof RecognitionException) {
                _localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            }
            else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return _localctx;
    }
    // @RuleVersion(0)
    string_column() {
        let _localctx = new String_columnContext(this._ctx, this.state);
        this.enterRule(_localctx, 26, FilterParser.RULE_string_column);
        try {
            this.enterOuterAlt(_localctx, 1);
            {
                this.state = 118;
                this.match(FilterParser.ID_STRING);
            }
        }
        catch (re) {
            if (re instanceof RecognitionException) {
                _localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            }
            else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return _localctx;
    }
    // @RuleVersion(0)
    column() {
        let _localctx = new ColumnContext(this._ctx, this.state);
        this.enterRule(_localctx, 28, FilterParser.RULE_column);
        try {
            this.enterOuterAlt(_localctx, 1);
            {
                this.state = 120;
                this.match(FilterParser.ID);
            }
        }
        catch (re) {
            if (re instanceof RecognitionException) {
                _localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            }
            else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return _localctx;
    }
    // @RuleVersion(0)
    filtername() {
        let _localctx = new FilternameContext(this._ctx, this.state);
        this.enterRule(_localctx, 30, FilterParser.RULE_filtername);
        try {
            this.enterOuterAlt(_localctx, 1);
            {
                this.state = 122;
                this.match(FilterParser.ID);
            }
        }
        catch (re) {
            if (re instanceof RecognitionException) {
                _localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            }
            else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return _localctx;
    }
    // @RuleVersion(0)
    named_filter() {
        let _localctx = new Named_filterContext(this._ctx, this.state);
        this.enterRule(_localctx, 32, FilterParser.RULE_named_filter);
        try {
            this.enterOuterAlt(_localctx, 1);
            {
                this.state = 124;
                this.match(FilterParser.COLON);
                this.state = 125;
                this.match(FilterParser.ID);
            }
        }
        catch (re) {
            if (re instanceof RecognitionException) {
                _localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            }
            else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return _localctx;
    }
    // @RuleVersion(0)
    string_operator() {
        let _localctx = new String_operatorContext(this._ctx, this.state);
        this.enterRule(_localctx, 34, FilterParser.RULE_string_operator);
        try {
            this.state = 129;
            this._errHandler.sync(this);
            switch (this._input.LA(1)) {
                case FilterParser.CONTAINS:
                case FilterParser.STARTS:
                case FilterParser.ENDS:
                    this.enterOuterAlt(_localctx, 1);
                    {
                        this.state = 127;
                        this.substring_operator();
                    }
                    break;
                case FilterParser.EQ:
                case FilterParser.NEQ:
                    this.enterOuterAlt(_localctx, 2);
                    {
                        this.state = 128;
                        this.equality_operator();
                    }
                    break;
                default:
                    throw new NoViableAltException(this);
            }
        }
        catch (re) {
            if (re instanceof RecognitionException) {
                _localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            }
            else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return _localctx;
    }
    // @RuleVersion(0)
    numeric_operator() {
        let _localctx = new Numeric_operatorContext(this._ctx, this.state);
        this.enterRule(_localctx, 36, FilterParser.RULE_numeric_operator);
        try {
            this.state = 133;
            this._errHandler.sync(this);
            switch (this._input.LA(1)) {
                case FilterParser.LT:
                case FilterParser.GT:
                    this.enterOuterAlt(_localctx, 1);
                    {
                        this.state = 131;
                        this.comparison_operator();
                    }
                    break;
                case FilterParser.EQ:
                case FilterParser.NEQ:
                    this.enterOuterAlt(_localctx, 2);
                    {
                        this.state = 132;
                        this.equality_operator();
                    }
                    break;
                default:
                    throw new NoViableAltException(this);
            }
        }
        catch (re) {
            if (re instanceof RecognitionException) {
                _localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            }
            else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return _localctx;
    }
    // @RuleVersion(0)
    equality_operator() {
        let _localctx = new Equality_operatorContext(this._ctx, this.state);
        this.enterRule(_localctx, 38, FilterParser.RULE_equality_operator);
        let _la;
        try {
            this.enterOuterAlt(_localctx, 1);
            {
                this.state = 135;
                _la = this._input.LA(1);
                if (!(_la === FilterParser.EQ || _la === FilterParser.NEQ)) {
                    this._errHandler.recoverInline(this);
                }
                else {
                    if (this._input.LA(1) === Token.EOF) {
                        this.matchedEOF = true;
                    }
                    this._errHandler.reportMatch(this);
                    this.consume();
                }
            }
        }
        catch (re) {
            if (re instanceof RecognitionException) {
                _localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            }
            else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return _localctx;
    }
    // @RuleVersion(0)
    comparison_operator() {
        let _localctx = new Comparison_operatorContext(this._ctx, this.state);
        this.enterRule(_localctx, 40, FilterParser.RULE_comparison_operator);
        let _la;
        try {
            this.enterOuterAlt(_localctx, 1);
            {
                this.state = 137;
                _la = this._input.LA(1);
                if (!(_la === FilterParser.LT || _la === FilterParser.GT)) {
                    this._errHandler.recoverInline(this);
                }
                else {
                    if (this._input.LA(1) === Token.EOF) {
                        this.matchedEOF = true;
                    }
                    this._errHandler.reportMatch(this);
                    this.consume();
                }
            }
        }
        catch (re) {
            if (re instanceof RecognitionException) {
                _localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            }
            else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return _localctx;
    }
    // @RuleVersion(0)
    substring_operator() {
        let _localctx = new Substring_operatorContext(this._ctx, this.state);
        this.enterRule(_localctx, 42, FilterParser.RULE_substring_operator);
        let _la;
        try {
            this.enterOuterAlt(_localctx, 1);
            {
                this.state = 139;
                _la = this._input.LA(1);
                if (!((((_la) & ~0x1F) === 0 && ((1 << _la) & ((1 << FilterParser.CONTAINS) | (1 << FilterParser.STARTS) | (1 << FilterParser.ENDS))) !== 0))) {
                    this._errHandler.recoverInline(this);
                }
                else {
                    if (this._input.LA(1) === Token.EOF) {
                        this.matchedEOF = true;
                    }
                    this._errHandler.reportMatch(this);
                    this.consume();
                }
            }
        }
        catch (re) {
            if (re instanceof RecognitionException) {
                _localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            }
            else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return _localctx;
    }
    // @RuleVersion(0)
    operator() {
        let _localctx = new OperatorContext(this._ctx, this.state);
        this.enterRule(_localctx, 44, FilterParser.RULE_operator);
        let _la;
        try {
            this.enterOuterAlt(_localctx, 1);
            {
                this.state = 141;
                _la = this._input.LA(1);
                if (!((((_la) & ~0x1F) === 0 && ((1 << _la) & ((1 << FilterParser.LT) | (1 << FilterParser.GT) | (1 << FilterParser.EQ) | (1 << FilterParser.NEQ) | (1 << FilterParser.STARTS) | (1 << FilterParser.ENDS))) !== 0))) {
                    this._errHandler.recoverInline(this);
                }
                else {
                    if (this._input.LA(1) === Token.EOF) {
                        this.matchedEOF = true;
                    }
                    this._errHandler.reportMatch(this);
                    this.consume();
                }
            }
        }
        catch (re) {
            if (re instanceof RecognitionException) {
                _localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            }
            else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return _localctx;
    }
    static _serializedATN = "\x03\uC91D\uCABA\u058D\uAFBA\u4F53\u0607\uEA8B\uC241\x03\x1E\x92\x04\x02" +
        "\t\x02\x04\x03\t\x03\x04\x04\t\x04\x04\x05\t\x05\x04\x06\t\x06\x04\x07" +
        "\t\x07\x04\b\t\b\x04\t\t\t\x04\n\t\n\x04\v\t\v\x04\f\t\f\x04\r\t\r\x04" +
        "\x0E\t\x0E\x04\x0F\t\x0F\x04\x10\t\x10\x04\x11\t\x11\x04\x12\t\x12\x04" +
        "\x13\t\x13\x04\x14\t\x14\x04\x15\t\x15\x04\x16\t\x16\x04\x17\t\x17\x04" +
        "\x18\t\x18\x03\x02\x03\x02\x05\x023\n\x02\x03\x02\x03\x02\x03\x03\x03" +
        "\x03\x03\x03\x07\x03:\n\x03\f\x03\x0E\x03=\v\x03\x03\x04\x03\x04\x03\x04" +
        "\x07\x04B\n\x04\f\x04\x0E\x04E\v\x04\x03\x05\x03\x05\x03\x05\x03\x06\x03" +
        "\x06\x03\x06\x03\x06\x03\x06\x03\x06\x03\x06\x05\x06Q\n\x06\x03\x07\x03" +
        "\x07\x05\x07U\n\x07\x03\x07\x03\x07\x03\x07\x03\x07\x03\x07\x03\b\x03" +
        "\b\x03\b\x05\b_\n\b\x03\t\x03\t\x03\t\x03\t\x03\n\x03\n\x03\n\x03\n\x03" +
        "\v\x03\v\x03\v\x03\v\x03\f\x03\f\x03\f\x07\fp\n\f\f\f\x0E\fs\v\f\x03\r" +
        "\x03\r\x03\x0E\x03\x0E\x03\x0F\x03\x0F\x03\x10\x03\x10\x03\x11\x03\x11" +
        "\x03\x12\x03\x12\x03\x12\x03\x13\x03\x13\x05\x13\x84\n\x13\x03\x14\x03" +
        "\x14\x05\x14\x88\n\x14\x03\x15\x03\x15\x03\x16\x03\x16\x03\x17\x03\x17" +
        "\x03\x18\x03\x18\x03\x18\x02\x02\x02\x19\x02\x02\x04\x02\x06\x02\b\x02" +
        "\n\x02\f\x02\x0E\x02\x10\x02\x12\x02\x14\x02\x16\x02\x18\x02\x1A\x02\x1C" +
        "\x02\x1E\x02 \x02\"\x02$\x02&\x02(\x02*\x02,\x02.\x02\x02\x07\x05\x02" +
        "\x03\x04\x16\x1A\x1D\x1D\x03\x02\n\v\x03\x02\b\t\x03\x02\r\x0F\x04\x02" +
        "\b\v\x0E\x0F\x02\x86\x020\x03\x02\x02\x02\x046\x03\x02\x02\x02\x06>\x03" +
        "\x02\x02\x02\bF\x03\x02\x02\x02\nP\x03\x02\x02\x02\fT\x03\x02\x02\x02" +
        "\x0E^\x03\x02\x02\x02\x10`\x03\x02\x02\x02\x12d\x03\x02\x02\x02\x14h\x03" +
        "\x02\x02\x02\x16l\x03\x02\x02\x02\x18t\x03\x02\x02\x02\x1Av\x03\x02\x02" +
        "\x02\x1Cx\x03\x02\x02\x02\x1Ez\x03\x02\x02\x02 |\x03\x02\x02\x02\"~\x03" +
        "\x02\x02\x02$\x83\x03\x02\x02\x02&\x87\x03\x02\x02\x02(\x89\x03\x02\x02" +
        "\x02*\x8B\x03\x02\x02\x02,\x8D\x03\x02\x02\x02.\x8F\x03\x02\x02\x0202" +
        "\x05\x04\x03\x0213\x05\b\x05\x0221\x03\x02\x02\x0223\x03\x02\x02\x023" +
        "4\x03\x02\x02\x0245\x07\x02\x02\x035\x03\x03\x02\x02\x026;\x05\x06\x04" +
        "\x0278\x07\x06\x02\x028:\x05\x04\x03\x0297\x03\x02\x02\x02:=\x03\x02\x02" +
        "\x02;9\x03\x02\x02\x02;<\x03\x02\x02\x02<\x05\x03\x02\x02\x02=;\x03\x02" +
        "\x02\x02>C\x05\n\x06\x02?@\x07\x05\x02\x02@B\x05\n\x06\x02A?\x03\x02\x02" +
        "\x02BE\x03\x02\x02\x02CA\x03\x02\x02\x02CD\x03\x02\x02\x02D\x07\x03\x02" +
        "\x02\x02EC\x03\x02\x02\x02FG\x07\x07\x02\x02GH\x05 \x11\x02H\t\x03\x02" +
        "\x02\x02IQ\x05\x0E\b\x02JQ\x05\f\x07\x02KQ\x05\"\x12\x02LM\x07\x12\x02" +
        "\x02MN\x05\x04\x03\x02NO\x07\x13\x02\x02OQ\x03\x02\x02\x02PI\x03\x02\x02" +
        "\x02PJ\x03\x02\x02\x02PK\x03\x02\x02\x02PL\x03\x02\x02\x02Q\v\x03\x02" +
        "\x02\x02RU\x05\x1E\x10\x02SU\x05\x1C\x0F\x02TR\x03\x02\x02\x02TS\x03\x02" +
        "\x02\x02UV\x03\x02\x02\x02VW\x07\f\x02\x02WX\x07\x10\x02\x02XY\x05\x16" +
        "\f\x02YZ\x07\x11\x02\x02Z\r\x03\x02\x02\x02[_\x05\x10\t\x02\\_\x05\x12" +
        "\n\x02]_\x05\x14\v\x02^[\x03\x02\x02\x02^\\\x03\x02\x02\x02^]\x03\x02" +
        "\x02\x02_\x0F\x03\x02\x02\x02`a\x05\x1A\x0E\x02ab\x05&\x14\x02bc\x05\x18" +
        "\r\x02c\x11\x03\x02\x02\x02de\x05\x1C\x0F\x02ef\x05$\x13\x02fg\x05\x18" +
        "\r\x02g\x13\x03\x02\x02\x02hi\x05\x1E\x10\x02ij\x05.\x18\x02jk\x05\x18" +
        "\r\x02k\x15\x03\x02\x02\x02lq\x05\x18\r\x02mn\x07\x14\x02\x02np\x05\x18" +
        "\r\x02om\x03\x02\x02\x02ps\x03\x02\x02\x02qo\x03\x02\x02\x02qr\x03\x02" +
        "\x02\x02r\x17\x03\x02\x02\x02sq\x03\x02\x02\x02tu\t\x02\x02\x02u\x19\x03" +
        "\x02\x02\x02vw\x07\x1C\x02\x02w\x1B\x03\x02\x02\x02xy\x07\x1B\x02\x02" +
        "y\x1D\x03\x02\x02\x02z{\x07\x1D\x02\x02{\x1F\x03\x02\x02\x02|}\x07\x1D" +
        "\x02\x02}!\x03\x02\x02\x02~\x7F\x07\x15\x02\x02\x7F\x80\x07\x1D\x02\x02" +
        "\x80#\x03\x02\x02\x02\x81\x84\x05,\x17\x02\x82\x84\x05(\x15\x02\x83\x81" +
        "\x03\x02\x02\x02\x83\x82\x03\x02\x02\x02\x84%\x03\x02\x02\x02\x85\x88" +
        "\x05*\x16\x02\x86\x88\x05(\x15\x02\x87\x85\x03\x02\x02\x02\x87\x86\x03" +
        "\x02\x02\x02\x88\'\x03\x02\x02\x02\x89\x8A\t\x03\x02\x02\x8A)\x03\x02" +
        "\x02\x02\x8B\x8C\t\x04\x02\x02\x8C+\x03\x02\x02\x02\x8D\x8E\t\x05\x02" +
        "\x02\x8E-\x03\x02\x02\x02\x8F\x90\t\x06\x02\x02\x90/\x03\x02\x02\x02\v" +
        "2;CPT^q\x83\x87";
    static __ATN;
    static get _ATN() {
        if (!FilterParser.__ATN) {
            FilterParser.__ATN = new ATNDeserializer().deserialize(Utils.toCharArray(FilterParser._serializedATN));
        }
        return FilterParser.__ATN;
    }
}
export class ExpressionContext extends ParserRuleContext {
    or_expression() {
        return this.getRuleContext(0, Or_expressionContext);
    }
    EOF() { return this.getToken(FilterParser.EOF, 0); }
    as_clause() {
        return this.tryGetRuleContext(0, As_clauseContext);
    }
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    // @Override
    get ruleIndex() { return FilterParser.RULE_expression; }
    // @Override
    enterRule(listener) {
        if (listener.enterExpression) {
            listener.enterExpression(this);
        }
    }
    // @Override
    exitRule(listener) {
        if (listener.exitExpression) {
            listener.exitExpression(this);
        }
    }
    // @Override
    accept(visitor) {
        if (visitor.visitExpression) {
            return visitor.visitExpression(this);
        }
        else {
            return visitor.visitChildren(this);
        }
    }
}
export class Or_expressionContext extends ParserRuleContext {
    and_expression() {
        return this.getRuleContext(0, And_expressionContext);
    }
    OR(i) {
        if (i === undefined) {
            return this.getTokens(FilterParser.OR);
        }
        else {
            return this.getToken(FilterParser.OR, i);
        }
    }
    or_expression(i) {
        if (i === undefined) {
            return this.getRuleContexts(Or_expressionContext);
        }
        else {
            return this.getRuleContext(i, Or_expressionContext);
        }
    }
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    // @Override
    get ruleIndex() { return FilterParser.RULE_or_expression; }
    // @Override
    enterRule(listener) {
        if (listener.enterOr_expression) {
            listener.enterOr_expression(this);
        }
    }
    // @Override
    exitRule(listener) {
        if (listener.exitOr_expression) {
            listener.exitOr_expression(this);
        }
    }
    // @Override
    accept(visitor) {
        if (visitor.visitOr_expression) {
            return visitor.visitOr_expression(this);
        }
        else {
            return visitor.visitChildren(this);
        }
    }
}
export class And_expressionContext extends ParserRuleContext {
    term(i) {
        if (i === undefined) {
            return this.getRuleContexts(TermContext);
        }
        else {
            return this.getRuleContext(i, TermContext);
        }
    }
    AND(i) {
        if (i === undefined) {
            return this.getTokens(FilterParser.AND);
        }
        else {
            return this.getToken(FilterParser.AND, i);
        }
    }
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    // @Override
    get ruleIndex() { return FilterParser.RULE_and_expression; }
    // @Override
    enterRule(listener) {
        if (listener.enterAnd_expression) {
            listener.enterAnd_expression(this);
        }
    }
    // @Override
    exitRule(listener) {
        if (listener.exitAnd_expression) {
            listener.exitAnd_expression(this);
        }
    }
    // @Override
    accept(visitor) {
        if (visitor.visitAnd_expression) {
            return visitor.visitAnd_expression(this);
        }
        else {
            return visitor.visitChildren(this);
        }
    }
}
export class As_clauseContext extends ParserRuleContext {
    AS() { return this.getToken(FilterParser.AS, 0); }
    filtername() {
        return this.getRuleContext(0, FilternameContext);
    }
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    // @Override
    get ruleIndex() { return FilterParser.RULE_as_clause; }
    // @Override
    enterRule(listener) {
        if (listener.enterAs_clause) {
            listener.enterAs_clause(this);
        }
    }
    // @Override
    exitRule(listener) {
        if (listener.exitAs_clause) {
            listener.exitAs_clause(this);
        }
    }
    // @Override
    accept(visitor) {
        if (visitor.visitAs_clause) {
            return visitor.visitAs_clause(this);
        }
        else {
            return visitor.visitChildren(this);
        }
    }
}
export class TermContext extends ParserRuleContext {
    col_val_expression() {
        return this.tryGetRuleContext(0, Col_val_expressionContext);
    }
    col_set_expression() {
        return this.tryGetRuleContext(0, Col_set_expressionContext);
    }
    named_filter() {
        return this.tryGetRuleContext(0, Named_filterContext);
    }
    LPAREN() { return this.tryGetToken(FilterParser.LPAREN, 0); }
    or_expression() {
        return this.tryGetRuleContext(0, Or_expressionContext);
    }
    RPAREN() { return this.tryGetToken(FilterParser.RPAREN, 0); }
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    // @Override
    get ruleIndex() { return FilterParser.RULE_term; }
    // @Override
    enterRule(listener) {
        if (listener.enterTerm) {
            listener.enterTerm(this);
        }
    }
    // @Override
    exitRule(listener) {
        if (listener.exitTerm) {
            listener.exitTerm(this);
        }
    }
    // @Override
    accept(visitor) {
        if (visitor.visitTerm) {
            return visitor.visitTerm(this);
        }
        else {
            return visitor.visitChildren(this);
        }
    }
}
export class Col_set_expressionContext extends ParserRuleContext {
    IN() { return this.getToken(FilterParser.IN, 0); }
    LBRACK() { return this.getToken(FilterParser.LBRACK, 0); }
    atoms() {
        return this.getRuleContext(0, AtomsContext);
    }
    RBRACK() { return this.getToken(FilterParser.RBRACK, 0); }
    column() {
        return this.tryGetRuleContext(0, ColumnContext);
    }
    string_column() {
        return this.tryGetRuleContext(0, String_columnContext);
    }
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    // @Override
    get ruleIndex() { return FilterParser.RULE_col_set_expression; }
    // @Override
    enterRule(listener) {
        if (listener.enterCol_set_expression) {
            listener.enterCol_set_expression(this);
        }
    }
    // @Override
    exitRule(listener) {
        if (listener.exitCol_set_expression) {
            listener.exitCol_set_expression(this);
        }
    }
    // @Override
    accept(visitor) {
        if (visitor.visitCol_set_expression) {
            return visitor.visitCol_set_expression(this);
        }
        else {
            return visitor.visitChildren(this);
        }
    }
}
export class Col_val_expressionContext extends ParserRuleContext {
    numeric_col_val_expression() {
        return this.tryGetRuleContext(0, Numeric_col_val_expressionContext);
    }
    string_col_val_expression() {
        return this.tryGetRuleContext(0, String_col_val_expressionContext);
    }
    default_col_val_expression() {
        return this.tryGetRuleContext(0, Default_col_val_expressionContext);
    }
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    // @Override
    get ruleIndex() { return FilterParser.RULE_col_val_expression; }
    // @Override
    enterRule(listener) {
        if (listener.enterCol_val_expression) {
            listener.enterCol_val_expression(this);
        }
    }
    // @Override
    exitRule(listener) {
        if (listener.exitCol_val_expression) {
            listener.exitCol_val_expression(this);
        }
    }
    // @Override
    accept(visitor) {
        if (visitor.visitCol_val_expression) {
            return visitor.visitCol_val_expression(this);
        }
        else {
            return visitor.visitChildren(this);
        }
    }
}
export class Numeric_col_val_expressionContext extends ParserRuleContext {
    numeric_column() {
        return this.getRuleContext(0, Numeric_columnContext);
    }
    numeric_operator() {
        return this.getRuleContext(0, Numeric_operatorContext);
    }
    atom() {
        return this.getRuleContext(0, AtomContext);
    }
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    // @Override
    get ruleIndex() { return FilterParser.RULE_numeric_col_val_expression; }
    // @Override
    enterRule(listener) {
        if (listener.enterNumeric_col_val_expression) {
            listener.enterNumeric_col_val_expression(this);
        }
    }
    // @Override
    exitRule(listener) {
        if (listener.exitNumeric_col_val_expression) {
            listener.exitNumeric_col_val_expression(this);
        }
    }
    // @Override
    accept(visitor) {
        if (visitor.visitNumeric_col_val_expression) {
            return visitor.visitNumeric_col_val_expression(this);
        }
        else {
            return visitor.visitChildren(this);
        }
    }
}
export class String_col_val_expressionContext extends ParserRuleContext {
    string_column() {
        return this.getRuleContext(0, String_columnContext);
    }
    string_operator() {
        return this.getRuleContext(0, String_operatorContext);
    }
    atom() {
        return this.getRuleContext(0, AtomContext);
    }
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    // @Override
    get ruleIndex() { return FilterParser.RULE_string_col_val_expression; }
    // @Override
    enterRule(listener) {
        if (listener.enterString_col_val_expression) {
            listener.enterString_col_val_expression(this);
        }
    }
    // @Override
    exitRule(listener) {
        if (listener.exitString_col_val_expression) {
            listener.exitString_col_val_expression(this);
        }
    }
    // @Override
    accept(visitor) {
        if (visitor.visitString_col_val_expression) {
            return visitor.visitString_col_val_expression(this);
        }
        else {
            return visitor.visitChildren(this);
        }
    }
}
export class Default_col_val_expressionContext extends ParserRuleContext {
    column() {
        return this.getRuleContext(0, ColumnContext);
    }
    operator() {
        return this.getRuleContext(0, OperatorContext);
    }
    atom() {
        return this.getRuleContext(0, AtomContext);
    }
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    // @Override
    get ruleIndex() { return FilterParser.RULE_default_col_val_expression; }
    // @Override
    enterRule(listener) {
        if (listener.enterDefault_col_val_expression) {
            listener.enterDefault_col_val_expression(this);
        }
    }
    // @Override
    exitRule(listener) {
        if (listener.exitDefault_col_val_expression) {
            listener.exitDefault_col_val_expression(this);
        }
    }
    // @Override
    accept(visitor) {
        if (visitor.visitDefault_col_val_expression) {
            return visitor.visitDefault_col_val_expression(this);
        }
        else {
            return visitor.visitChildren(this);
        }
    }
}
export class AtomsContext extends ParserRuleContext {
    atom(i) {
        if (i === undefined) {
            return this.getRuleContexts(AtomContext);
        }
        else {
            return this.getRuleContext(i, AtomContext);
        }
    }
    COMMA(i) {
        if (i === undefined) {
            return this.getTokens(FilterParser.COMMA);
        }
        else {
            return this.getToken(FilterParser.COMMA, i);
        }
    }
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    // @Override
    get ruleIndex() { return FilterParser.RULE_atoms; }
    // @Override
    enterRule(listener) {
        if (listener.enterAtoms) {
            listener.enterAtoms(this);
        }
    }
    // @Override
    exitRule(listener) {
        if (listener.exitAtoms) {
            listener.exitAtoms(this);
        }
    }
    // @Override
    accept(visitor) {
        if (visitor.visitAtoms) {
            return visitor.visitAtoms(this);
        }
        else {
            return visitor.visitChildren(this);
        }
    }
}
export class AtomContext extends ParserRuleContext {
    ID() { return this.tryGetToken(FilterParser.ID, 0); }
    INT() { return this.tryGetToken(FilterParser.INT, 0); }
    FLOAT() { return this.tryGetToken(FilterParser.FLOAT, 0); }
    STRING() { return this.tryGetToken(FilterParser.STRING, 0); }
    TRUE() { return this.tryGetToken(FilterParser.TRUE, 0); }
    FALSE() { return this.tryGetToken(FilterParser.FALSE, 0); }
    INT_ABBR() { return this.tryGetToken(FilterParser.INT_ABBR, 0); }
    FLOAT_ABBR() { return this.tryGetToken(FilterParser.FLOAT_ABBR, 0); }
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    // @Override
    get ruleIndex() { return FilterParser.RULE_atom; }
    // @Override
    enterRule(listener) {
        if (listener.enterAtom) {
            listener.enterAtom(this);
        }
    }
    // @Override
    exitRule(listener) {
        if (listener.exitAtom) {
            listener.exitAtom(this);
        }
    }
    // @Override
    accept(visitor) {
        if (visitor.visitAtom) {
            return visitor.visitAtom(this);
        }
        else {
            return visitor.visitChildren(this);
        }
    }
}
export class Numeric_columnContext extends ParserRuleContext {
    ID_NUMERIC() { return this.getToken(FilterParser.ID_NUMERIC, 0); }
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    // @Override
    get ruleIndex() { return FilterParser.RULE_numeric_column; }
    // @Override
    enterRule(listener) {
        if (listener.enterNumeric_column) {
            listener.enterNumeric_column(this);
        }
    }
    // @Override
    exitRule(listener) {
        if (listener.exitNumeric_column) {
            listener.exitNumeric_column(this);
        }
    }
    // @Override
    accept(visitor) {
        if (visitor.visitNumeric_column) {
            return visitor.visitNumeric_column(this);
        }
        else {
            return visitor.visitChildren(this);
        }
    }
}
export class String_columnContext extends ParserRuleContext {
    ID_STRING() { return this.getToken(FilterParser.ID_STRING, 0); }
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    // @Override
    get ruleIndex() { return FilterParser.RULE_string_column; }
    // @Override
    enterRule(listener) {
        if (listener.enterString_column) {
            listener.enterString_column(this);
        }
    }
    // @Override
    exitRule(listener) {
        if (listener.exitString_column) {
            listener.exitString_column(this);
        }
    }
    // @Override
    accept(visitor) {
        if (visitor.visitString_column) {
            return visitor.visitString_column(this);
        }
        else {
            return visitor.visitChildren(this);
        }
    }
}
export class ColumnContext extends ParserRuleContext {
    ID() { return this.getToken(FilterParser.ID, 0); }
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    // @Override
    get ruleIndex() { return FilterParser.RULE_column; }
    // @Override
    enterRule(listener) {
        if (listener.enterColumn) {
            listener.enterColumn(this);
        }
    }
    // @Override
    exitRule(listener) {
        if (listener.exitColumn) {
            listener.exitColumn(this);
        }
    }
    // @Override
    accept(visitor) {
        if (visitor.visitColumn) {
            return visitor.visitColumn(this);
        }
        else {
            return visitor.visitChildren(this);
        }
    }
}
export class FilternameContext extends ParserRuleContext {
    ID() { return this.getToken(FilterParser.ID, 0); }
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    // @Override
    get ruleIndex() { return FilterParser.RULE_filtername; }
    // @Override
    enterRule(listener) {
        if (listener.enterFiltername) {
            listener.enterFiltername(this);
        }
    }
    // @Override
    exitRule(listener) {
        if (listener.exitFiltername) {
            listener.exitFiltername(this);
        }
    }
    // @Override
    accept(visitor) {
        if (visitor.visitFiltername) {
            return visitor.visitFiltername(this);
        }
        else {
            return visitor.visitChildren(this);
        }
    }
}
export class Named_filterContext extends ParserRuleContext {
    COLON() { return this.getToken(FilterParser.COLON, 0); }
    ID() { return this.getToken(FilterParser.ID, 0); }
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    // @Override
    get ruleIndex() { return FilterParser.RULE_named_filter; }
    // @Override
    enterRule(listener) {
        if (listener.enterNamed_filter) {
            listener.enterNamed_filter(this);
        }
    }
    // @Override
    exitRule(listener) {
        if (listener.exitNamed_filter) {
            listener.exitNamed_filter(this);
        }
    }
    // @Override
    accept(visitor) {
        if (visitor.visitNamed_filter) {
            return visitor.visitNamed_filter(this);
        }
        else {
            return visitor.visitChildren(this);
        }
    }
}
export class String_operatorContext extends ParserRuleContext {
    substring_operator() {
        return this.tryGetRuleContext(0, Substring_operatorContext);
    }
    equality_operator() {
        return this.tryGetRuleContext(0, Equality_operatorContext);
    }
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    // @Override
    get ruleIndex() { return FilterParser.RULE_string_operator; }
    // @Override
    enterRule(listener) {
        if (listener.enterString_operator) {
            listener.enterString_operator(this);
        }
    }
    // @Override
    exitRule(listener) {
        if (listener.exitString_operator) {
            listener.exitString_operator(this);
        }
    }
    // @Override
    accept(visitor) {
        if (visitor.visitString_operator) {
            return visitor.visitString_operator(this);
        }
        else {
            return visitor.visitChildren(this);
        }
    }
}
export class Numeric_operatorContext extends ParserRuleContext {
    comparison_operator() {
        return this.tryGetRuleContext(0, Comparison_operatorContext);
    }
    equality_operator() {
        return this.tryGetRuleContext(0, Equality_operatorContext);
    }
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    // @Override
    get ruleIndex() { return FilterParser.RULE_numeric_operator; }
    // @Override
    enterRule(listener) {
        if (listener.enterNumeric_operator) {
            listener.enterNumeric_operator(this);
        }
    }
    // @Override
    exitRule(listener) {
        if (listener.exitNumeric_operator) {
            listener.exitNumeric_operator(this);
        }
    }
    // @Override
    accept(visitor) {
        if (visitor.visitNumeric_operator) {
            return visitor.visitNumeric_operator(this);
        }
        else {
            return visitor.visitChildren(this);
        }
    }
}
export class Equality_operatorContext extends ParserRuleContext {
    EQ() { return this.tryGetToken(FilterParser.EQ, 0); }
    NEQ() { return this.tryGetToken(FilterParser.NEQ, 0); }
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    // @Override
    get ruleIndex() { return FilterParser.RULE_equality_operator; }
    // @Override
    enterRule(listener) {
        if (listener.enterEquality_operator) {
            listener.enterEquality_operator(this);
        }
    }
    // @Override
    exitRule(listener) {
        if (listener.exitEquality_operator) {
            listener.exitEquality_operator(this);
        }
    }
    // @Override
    accept(visitor) {
        if (visitor.visitEquality_operator) {
            return visitor.visitEquality_operator(this);
        }
        else {
            return visitor.visitChildren(this);
        }
    }
}
export class Comparison_operatorContext extends ParserRuleContext {
    LT() { return this.tryGetToken(FilterParser.LT, 0); }
    GT() { return this.tryGetToken(FilterParser.GT, 0); }
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    // @Override
    get ruleIndex() { return FilterParser.RULE_comparison_operator; }
    // @Override
    enterRule(listener) {
        if (listener.enterComparison_operator) {
            listener.enterComparison_operator(this);
        }
    }
    // @Override
    exitRule(listener) {
        if (listener.exitComparison_operator) {
            listener.exitComparison_operator(this);
        }
    }
    // @Override
    accept(visitor) {
        if (visitor.visitComparison_operator) {
            return visitor.visitComparison_operator(this);
        }
        else {
            return visitor.visitChildren(this);
        }
    }
}
export class Substring_operatorContext extends ParserRuleContext {
    STARTS() { return this.tryGetToken(FilterParser.STARTS, 0); }
    ENDS() { return this.tryGetToken(FilterParser.ENDS, 0); }
    CONTAINS() { return this.tryGetToken(FilterParser.CONTAINS, 0); }
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    // @Override
    get ruleIndex() { return FilterParser.RULE_substring_operator; }
    // @Override
    enterRule(listener) {
        if (listener.enterSubstring_operator) {
            listener.enterSubstring_operator(this);
        }
    }
    // @Override
    exitRule(listener) {
        if (listener.exitSubstring_operator) {
            listener.exitSubstring_operator(this);
        }
    }
    // @Override
    accept(visitor) {
        if (visitor.visitSubstring_operator) {
            return visitor.visitSubstring_operator(this);
        }
        else {
            return visitor.visitChildren(this);
        }
    }
}
export class OperatorContext extends ParserRuleContext {
    LT() { return this.tryGetToken(FilterParser.LT, 0); }
    GT() { return this.tryGetToken(FilterParser.GT, 0); }
    EQ() { return this.tryGetToken(FilterParser.EQ, 0); }
    NEQ() { return this.tryGetToken(FilterParser.NEQ, 0); }
    STARTS() { return this.tryGetToken(FilterParser.STARTS, 0); }
    ENDS() { return this.tryGetToken(FilterParser.ENDS, 0); }
    constructor(parent, invokingState) {
        super(parent, invokingState);
    }
    // @Override
    get ruleIndex() { return FilterParser.RULE_operator; }
    // @Override
    enterRule(listener) {
        if (listener.enterOperator) {
            listener.enterOperator(this);
        }
    }
    // @Override
    exitRule(listener) {
        if (listener.exitOperator) {
            listener.exitOperator(this);
        }
    }
    // @Override
    accept(visitor) {
        if (visitor.visitOperator) {
            return visitor.visitOperator(this);
        }
        else {
            return visitor.visitChildren(this);
        }
    }
}
