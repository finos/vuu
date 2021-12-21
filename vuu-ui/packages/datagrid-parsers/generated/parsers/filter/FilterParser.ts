// Generated from ./src/grammars/Filter.g4 by ANTLR 4.9.0-SNAPSHOT


import { ATN } from "antlr4ts/atn/ATN";
import { ATNDeserializer } from "antlr4ts/atn/ATNDeserializer";
import { FailedPredicateException } from "antlr4ts/FailedPredicateException";
import { NotNull } from "antlr4ts/Decorators";
import { NoViableAltException } from "antlr4ts/NoViableAltException";
import { Override } from "antlr4ts/Decorators";
import { Parser } from "antlr4ts/Parser";
import { ParserRuleContext } from "antlr4ts/ParserRuleContext";
import { ParserATNSimulator } from "antlr4ts/atn/ParserATNSimulator";
import { ParseTreeListener } from "antlr4ts/tree/ParseTreeListener";
import { ParseTreeVisitor } from "antlr4ts/tree/ParseTreeVisitor";
import { RecognitionException } from "antlr4ts/RecognitionException";
import { RuleContext } from "antlr4ts/RuleContext";
//import { RuleVersion } from "antlr4ts/RuleVersion";
import { TerminalNode } from "antlr4ts/tree/TerminalNode";
import { Token } from "antlr4ts/Token";
import { TokenStream } from "antlr4ts/TokenStream";
import { Vocabulary } from "antlr4ts/Vocabulary";
import { VocabularyImpl } from "antlr4ts/VocabularyImpl";

import * as Utils from "antlr4ts/misc/Utils";

import { FilterListener } from "./FilterListener";
import { FilterVisitor } from "./FilterVisitor";


export class FilterParser extends Parser {
	public static readonly TRUE = 1;
	public static readonly FALSE = 2;
	public static readonly AND = 3;
	public static readonly OR = 4;
	public static readonly AS = 5;
	public static readonly LT = 6;
	public static readonly GT = 7;
	public static readonly EQ = 8;
	public static readonly NEQ = 9;
	public static readonly IN = 10;
	public static readonly CONTAINS = 11;
	public static readonly STARTS = 12;
	public static readonly ENDS = 13;
	public static readonly LBRACK = 14;
	public static readonly RBRACK = 15;
	public static readonly LPAREN = 16;
	public static readonly RPAREN = 17;
	public static readonly COMMA = 18;
	public static readonly COLON = 19;
	public static readonly INT = 20;
	public static readonly FLOAT = 21;
	public static readonly INT_ABBR = 22;
	public static readonly FLOAT_ABBR = 23;
	public static readonly STRING = 24;
	public static readonly ID_STRING = 25;
	public static readonly ID_NUMERIC = 26;
	public static readonly ID = 27;
	public static readonly WS = 28;
	public static readonly RULE_expression = 0;
	public static readonly RULE_or_expression = 1;
	public static readonly RULE_and_expression = 2;
	public static readonly RULE_as_clause = 3;
	public static readonly RULE_term = 4;
	public static readonly RULE_col_set_expression = 5;
	public static readonly RULE_col_val_expression = 6;
	public static readonly RULE_numeric_col_val_expression = 7;
	public static readonly RULE_string_col_val_expression = 8;
	public static readonly RULE_default_col_val_expression = 9;
	public static readonly RULE_atoms = 10;
	public static readonly RULE_atom = 11;
	public static readonly RULE_numeric_column = 12;
	public static readonly RULE_string_column = 13;
	public static readonly RULE_column = 14;
	public static readonly RULE_filtername = 15;
	public static readonly RULE_named_filter = 16;
	public static readonly RULE_string_operator = 17;
	public static readonly RULE_numeric_operator = 18;
	public static readonly RULE_equality_operator = 19;
	public static readonly RULE_comparison_operator = 20;
	public static readonly RULE_substring_operator = 21;
	public static readonly RULE_operator = 22;
	// tslint:disable:no-trailing-whitespace
	public static readonly ruleNames: string[] = [
		"expression", "or_expression", "and_expression", "as_clause", "term", 
		"col_set_expression", "col_val_expression", "numeric_col_val_expression", 
		"string_col_val_expression", "default_col_val_expression", "atoms", "atom", 
		"numeric_column", "string_column", "column", "filtername", "named_filter", 
		"string_operator", "numeric_operator", "equality_operator", "comparison_operator", 
		"substring_operator", "operator",
	];

	private static readonly _LITERAL_NAMES: Array<string | undefined> = [
		undefined, "'true'", "'false'", "'and'", "'or'", "'as'", "'<'", "'>'", 
		"'='", "'!='", "'in'", "'contains'", "'starts'", "'ends'", "'['", "']'", 
		"'('", "')'", "','", "':'",
	];
	private static readonly _SYMBOLIC_NAMES: Array<string | undefined> = [
		undefined, "TRUE", "FALSE", "AND", "OR", "AS", "LT", "GT", "EQ", "NEQ", 
		"IN", "CONTAINS", "STARTS", "ENDS", "LBRACK", "RBRACK", "LPAREN", "RPAREN", 
		"COMMA", "COLON", "INT", "FLOAT", "INT_ABBR", "FLOAT_ABBR", "STRING", 
		"ID_STRING", "ID_NUMERIC", "ID", "WS",
	];
	public static readonly VOCABULARY: Vocabulary = new VocabularyImpl(FilterParser._LITERAL_NAMES, FilterParser._SYMBOLIC_NAMES, []);

	// @Override
	// @NotNull
	public get vocabulary(): Vocabulary {
		return FilterParser.VOCABULARY;
	}
	// tslint:enable:no-trailing-whitespace

	// @Override
	public get grammarFileName(): string { return "Filter.g4"; }

	// @Override
	public get ruleNames(): string[] { return FilterParser.ruleNames; }

	// @Override
	public get serializedATN(): string { return FilterParser._serializedATN; }

	protected createFailedPredicateException(predicate?: string, message?: string): FailedPredicateException {
		return new FailedPredicateException(this, predicate, message);
	}

	constructor(input: TokenStream) {
		super(input);
		this._interp = new ParserATNSimulator(FilterParser._ATN, this);
	}
	// @RuleVersion(0)
	public expression(): ExpressionContext {
		let _localctx: ExpressionContext = new ExpressionContext(this._ctx, this.state);
		this.enterRule(_localctx, 0, FilterParser.RULE_expression);
		let _la: number;
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
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public or_expression(): Or_expressionContext {
		let _localctx: Or_expressionContext = new Or_expressionContext(this._ctx, this.state);
		this.enterRule(_localctx, 2, FilterParser.RULE_or_expression);
		try {
			let _alt: number;
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
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public and_expression(): And_expressionContext {
		let _localctx: And_expressionContext = new And_expressionContext(this._ctx, this.state);
		this.enterRule(_localctx, 4, FilterParser.RULE_and_expression);
		let _la: number;
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
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public as_clause(): As_clauseContext {
		let _localctx: As_clauseContext = new As_clauseContext(this._ctx, this.state);
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
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public term(): TermContext {
		let _localctx: TermContext = new TermContext(this._ctx, this.state);
		this.enterRule(_localctx, 8, FilterParser.RULE_term);
		try {
			this.state = 78;
			this._errHandler.sync(this);
			switch ( this.interpreter.adaptivePredict(this._input, 3, this._ctx) ) {
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
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public col_set_expression(): Col_set_expressionContext {
		let _localctx: Col_set_expressionContext = new Col_set_expressionContext(this._ctx, this.state);
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
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public col_val_expression(): Col_val_expressionContext {
		let _localctx: Col_val_expressionContext = new Col_val_expressionContext(this._ctx, this.state);
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
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public numeric_col_val_expression(): Numeric_col_val_expressionContext {
		let _localctx: Numeric_col_val_expressionContext = new Numeric_col_val_expressionContext(this._ctx, this.state);
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
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public string_col_val_expression(): String_col_val_expressionContext {
		let _localctx: String_col_val_expressionContext = new String_col_val_expressionContext(this._ctx, this.state);
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
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public default_col_val_expression(): Default_col_val_expressionContext {
		let _localctx: Default_col_val_expressionContext = new Default_col_val_expressionContext(this._ctx, this.state);
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
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public atoms(): AtomsContext {
		let _localctx: AtomsContext = new AtomsContext(this._ctx, this.state);
		this.enterRule(_localctx, 20, FilterParser.RULE_atoms);
		let _la: number;
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
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public atom(): AtomContext {
		let _localctx: AtomContext = new AtomContext(this._ctx, this.state);
		this.enterRule(_localctx, 22, FilterParser.RULE_atom);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 114;
			_la = this._input.LA(1);
			if (!((((_la) & ~0x1F) === 0 && ((1 << _la) & ((1 << FilterParser.TRUE) | (1 << FilterParser.FALSE) | (1 << FilterParser.INT) | (1 << FilterParser.FLOAT) | (1 << FilterParser.INT_ABBR) | (1 << FilterParser.FLOAT_ABBR) | (1 << FilterParser.STRING) | (1 << FilterParser.ID))) !== 0))) {
			this._errHandler.recoverInline(this);
			} else {
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
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public numeric_column(): Numeric_columnContext {
		let _localctx: Numeric_columnContext = new Numeric_columnContext(this._ctx, this.state);
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
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public string_column(): String_columnContext {
		let _localctx: String_columnContext = new String_columnContext(this._ctx, this.state);
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
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public column(): ColumnContext {
		let _localctx: ColumnContext = new ColumnContext(this._ctx, this.state);
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
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public filtername(): FilternameContext {
		let _localctx: FilternameContext = new FilternameContext(this._ctx, this.state);
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
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public named_filter(): Named_filterContext {
		let _localctx: Named_filterContext = new Named_filterContext(this._ctx, this.state);
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
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public string_operator(): String_operatorContext {
		let _localctx: String_operatorContext = new String_operatorContext(this._ctx, this.state);
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
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public numeric_operator(): Numeric_operatorContext {
		let _localctx: Numeric_operatorContext = new Numeric_operatorContext(this._ctx, this.state);
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
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public equality_operator(): Equality_operatorContext {
		let _localctx: Equality_operatorContext = new Equality_operatorContext(this._ctx, this.state);
		this.enterRule(_localctx, 38, FilterParser.RULE_equality_operator);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 135;
			_la = this._input.LA(1);
			if (!(_la === FilterParser.EQ || _la === FilterParser.NEQ)) {
			this._errHandler.recoverInline(this);
			} else {
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
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public comparison_operator(): Comparison_operatorContext {
		let _localctx: Comparison_operatorContext = new Comparison_operatorContext(this._ctx, this.state);
		this.enterRule(_localctx, 40, FilterParser.RULE_comparison_operator);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 137;
			_la = this._input.LA(1);
			if (!(_la === FilterParser.LT || _la === FilterParser.GT)) {
			this._errHandler.recoverInline(this);
			} else {
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
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public substring_operator(): Substring_operatorContext {
		let _localctx: Substring_operatorContext = new Substring_operatorContext(this._ctx, this.state);
		this.enterRule(_localctx, 42, FilterParser.RULE_substring_operator);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 139;
			_la = this._input.LA(1);
			if (!((((_la) & ~0x1F) === 0 && ((1 << _la) & ((1 << FilterParser.CONTAINS) | (1 << FilterParser.STARTS) | (1 << FilterParser.ENDS))) !== 0))) {
			this._errHandler.recoverInline(this);
			} else {
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
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public operator(): OperatorContext {
		let _localctx: OperatorContext = new OperatorContext(this._ctx, this.state);
		this.enterRule(_localctx, 44, FilterParser.RULE_operator);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 141;
			_la = this._input.LA(1);
			if (!((((_la) & ~0x1F) === 0 && ((1 << _la) & ((1 << FilterParser.LT) | (1 << FilterParser.GT) | (1 << FilterParser.EQ) | (1 << FilterParser.NEQ) | (1 << FilterParser.STARTS) | (1 << FilterParser.ENDS))) !== 0))) {
			this._errHandler.recoverInline(this);
			} else {
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
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}

	public static readonly _serializedATN: string =
		"\x03\uC91D\uCABA\u058D\uAFBA\u4F53\u0607\uEA8B\uC241\x03\x1E\x92\x04\x02" +
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
	public static __ATN: ATN;
	public static get _ATN(): ATN {
		if (!FilterParser.__ATN) {
			FilterParser.__ATN = new ATNDeserializer().deserialize(Utils.toCharArray(FilterParser._serializedATN));
		}

		return FilterParser.__ATN;
	}

}

export class ExpressionContext extends ParserRuleContext {
	public or_expression(): Or_expressionContext {
		return this.getRuleContext(0, Or_expressionContext);
	}
	public EOF(): TerminalNode { return this.getToken(FilterParser.EOF, 0); }
	public as_clause(): As_clauseContext | undefined {
		return this.tryGetRuleContext(0, As_clauseContext);
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return FilterParser.RULE_expression; }
	// @Override
	public enterRule(listener: FilterListener): void {
		if (listener.enterExpression) {
			listener.enterExpression(this);
		}
	}
	// @Override
	public exitRule(listener: FilterListener): void {
		if (listener.exitExpression) {
			listener.exitExpression(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FilterVisitor<Result>): Result {
		if (visitor.visitExpression) {
			return visitor.visitExpression(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class Or_expressionContext extends ParserRuleContext {
	public and_expression(): And_expressionContext {
		return this.getRuleContext(0, And_expressionContext);
	}
	public OR(): TerminalNode[];
	public OR(i: number): TerminalNode;
	public OR(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(FilterParser.OR);
		} else {
			return this.getToken(FilterParser.OR, i);
		}
	}
	public or_expression(): Or_expressionContext[];
	public or_expression(i: number): Or_expressionContext;
	public or_expression(i?: number): Or_expressionContext | Or_expressionContext[] {
		if (i === undefined) {
			return this.getRuleContexts(Or_expressionContext);
		} else {
			return this.getRuleContext(i, Or_expressionContext);
		}
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return FilterParser.RULE_or_expression; }
	// @Override
	public enterRule(listener: FilterListener): void {
		if (listener.enterOr_expression) {
			listener.enterOr_expression(this);
		}
	}
	// @Override
	public exitRule(listener: FilterListener): void {
		if (listener.exitOr_expression) {
			listener.exitOr_expression(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FilterVisitor<Result>): Result {
		if (visitor.visitOr_expression) {
			return visitor.visitOr_expression(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class And_expressionContext extends ParserRuleContext {
	public term(): TermContext[];
	public term(i: number): TermContext;
	public term(i?: number): TermContext | TermContext[] {
		if (i === undefined) {
			return this.getRuleContexts(TermContext);
		} else {
			return this.getRuleContext(i, TermContext);
		}
	}
	public AND(): TerminalNode[];
	public AND(i: number): TerminalNode;
	public AND(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(FilterParser.AND);
		} else {
			return this.getToken(FilterParser.AND, i);
		}
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return FilterParser.RULE_and_expression; }
	// @Override
	public enterRule(listener: FilterListener): void {
		if (listener.enterAnd_expression) {
			listener.enterAnd_expression(this);
		}
	}
	// @Override
	public exitRule(listener: FilterListener): void {
		if (listener.exitAnd_expression) {
			listener.exitAnd_expression(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FilterVisitor<Result>): Result {
		if (visitor.visitAnd_expression) {
			return visitor.visitAnd_expression(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class As_clauseContext extends ParserRuleContext {
	public AS(): TerminalNode { return this.getToken(FilterParser.AS, 0); }
	public filtername(): FilternameContext {
		return this.getRuleContext(0, FilternameContext);
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return FilterParser.RULE_as_clause; }
	// @Override
	public enterRule(listener: FilterListener): void {
		if (listener.enterAs_clause) {
			listener.enterAs_clause(this);
		}
	}
	// @Override
	public exitRule(listener: FilterListener): void {
		if (listener.exitAs_clause) {
			listener.exitAs_clause(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FilterVisitor<Result>): Result {
		if (visitor.visitAs_clause) {
			return visitor.visitAs_clause(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class TermContext extends ParserRuleContext {
	public col_val_expression(): Col_val_expressionContext | undefined {
		return this.tryGetRuleContext(0, Col_val_expressionContext);
	}
	public col_set_expression(): Col_set_expressionContext | undefined {
		return this.tryGetRuleContext(0, Col_set_expressionContext);
	}
	public named_filter(): Named_filterContext | undefined {
		return this.tryGetRuleContext(0, Named_filterContext);
	}
	public LPAREN(): TerminalNode | undefined { return this.tryGetToken(FilterParser.LPAREN, 0); }
	public or_expression(): Or_expressionContext | undefined {
		return this.tryGetRuleContext(0, Or_expressionContext);
	}
	public RPAREN(): TerminalNode | undefined { return this.tryGetToken(FilterParser.RPAREN, 0); }
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return FilterParser.RULE_term; }
	// @Override
	public enterRule(listener: FilterListener): void {
		if (listener.enterTerm) {
			listener.enterTerm(this);
		}
	}
	// @Override
	public exitRule(listener: FilterListener): void {
		if (listener.exitTerm) {
			listener.exitTerm(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FilterVisitor<Result>): Result {
		if (visitor.visitTerm) {
			return visitor.visitTerm(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class Col_set_expressionContext extends ParserRuleContext {
	public IN(): TerminalNode { return this.getToken(FilterParser.IN, 0); }
	public LBRACK(): TerminalNode { return this.getToken(FilterParser.LBRACK, 0); }
	public atoms(): AtomsContext {
		return this.getRuleContext(0, AtomsContext);
	}
	public RBRACK(): TerminalNode { return this.getToken(FilterParser.RBRACK, 0); }
	public column(): ColumnContext | undefined {
		return this.tryGetRuleContext(0, ColumnContext);
	}
	public string_column(): String_columnContext | undefined {
		return this.tryGetRuleContext(0, String_columnContext);
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return FilterParser.RULE_col_set_expression; }
	// @Override
	public enterRule(listener: FilterListener): void {
		if (listener.enterCol_set_expression) {
			listener.enterCol_set_expression(this);
		}
	}
	// @Override
	public exitRule(listener: FilterListener): void {
		if (listener.exitCol_set_expression) {
			listener.exitCol_set_expression(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FilterVisitor<Result>): Result {
		if (visitor.visitCol_set_expression) {
			return visitor.visitCol_set_expression(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class Col_val_expressionContext extends ParserRuleContext {
	public numeric_col_val_expression(): Numeric_col_val_expressionContext | undefined {
		return this.tryGetRuleContext(0, Numeric_col_val_expressionContext);
	}
	public string_col_val_expression(): String_col_val_expressionContext | undefined {
		return this.tryGetRuleContext(0, String_col_val_expressionContext);
	}
	public default_col_val_expression(): Default_col_val_expressionContext | undefined {
		return this.tryGetRuleContext(0, Default_col_val_expressionContext);
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return FilterParser.RULE_col_val_expression; }
	// @Override
	public enterRule(listener: FilterListener): void {
		if (listener.enterCol_val_expression) {
			listener.enterCol_val_expression(this);
		}
	}
	// @Override
	public exitRule(listener: FilterListener): void {
		if (listener.exitCol_val_expression) {
			listener.exitCol_val_expression(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FilterVisitor<Result>): Result {
		if (visitor.visitCol_val_expression) {
			return visitor.visitCol_val_expression(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class Numeric_col_val_expressionContext extends ParserRuleContext {
	public numeric_column(): Numeric_columnContext {
		return this.getRuleContext(0, Numeric_columnContext);
	}
	public numeric_operator(): Numeric_operatorContext {
		return this.getRuleContext(0, Numeric_operatorContext);
	}
	public atom(): AtomContext {
		return this.getRuleContext(0, AtomContext);
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return FilterParser.RULE_numeric_col_val_expression; }
	// @Override
	public enterRule(listener: FilterListener): void {
		if (listener.enterNumeric_col_val_expression) {
			listener.enterNumeric_col_val_expression(this);
		}
	}
	// @Override
	public exitRule(listener: FilterListener): void {
		if (listener.exitNumeric_col_val_expression) {
			listener.exitNumeric_col_val_expression(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FilterVisitor<Result>): Result {
		if (visitor.visitNumeric_col_val_expression) {
			return visitor.visitNumeric_col_val_expression(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class String_col_val_expressionContext extends ParserRuleContext {
	public string_column(): String_columnContext {
		return this.getRuleContext(0, String_columnContext);
	}
	public string_operator(): String_operatorContext {
		return this.getRuleContext(0, String_operatorContext);
	}
	public atom(): AtomContext {
		return this.getRuleContext(0, AtomContext);
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return FilterParser.RULE_string_col_val_expression; }
	// @Override
	public enterRule(listener: FilterListener): void {
		if (listener.enterString_col_val_expression) {
			listener.enterString_col_val_expression(this);
		}
	}
	// @Override
	public exitRule(listener: FilterListener): void {
		if (listener.exitString_col_val_expression) {
			listener.exitString_col_val_expression(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FilterVisitor<Result>): Result {
		if (visitor.visitString_col_val_expression) {
			return visitor.visitString_col_val_expression(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class Default_col_val_expressionContext extends ParserRuleContext {
	public column(): ColumnContext {
		return this.getRuleContext(0, ColumnContext);
	}
	public operator(): OperatorContext {
		return this.getRuleContext(0, OperatorContext);
	}
	public atom(): AtomContext {
		return this.getRuleContext(0, AtomContext);
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return FilterParser.RULE_default_col_val_expression; }
	// @Override
	public enterRule(listener: FilterListener): void {
		if (listener.enterDefault_col_val_expression) {
			listener.enterDefault_col_val_expression(this);
		}
	}
	// @Override
	public exitRule(listener: FilterListener): void {
		if (listener.exitDefault_col_val_expression) {
			listener.exitDefault_col_val_expression(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FilterVisitor<Result>): Result {
		if (visitor.visitDefault_col_val_expression) {
			return visitor.visitDefault_col_val_expression(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class AtomsContext extends ParserRuleContext {
	public atom(): AtomContext[];
	public atom(i: number): AtomContext;
	public atom(i?: number): AtomContext | AtomContext[] {
		if (i === undefined) {
			return this.getRuleContexts(AtomContext);
		} else {
			return this.getRuleContext(i, AtomContext);
		}
	}
	public COMMA(): TerminalNode[];
	public COMMA(i: number): TerminalNode;
	public COMMA(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(FilterParser.COMMA);
		} else {
			return this.getToken(FilterParser.COMMA, i);
		}
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return FilterParser.RULE_atoms; }
	// @Override
	public enterRule(listener: FilterListener): void {
		if (listener.enterAtoms) {
			listener.enterAtoms(this);
		}
	}
	// @Override
	public exitRule(listener: FilterListener): void {
		if (listener.exitAtoms) {
			listener.exitAtoms(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FilterVisitor<Result>): Result {
		if (visitor.visitAtoms) {
			return visitor.visitAtoms(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class AtomContext extends ParserRuleContext {
	public ID(): TerminalNode | undefined { return this.tryGetToken(FilterParser.ID, 0); }
	public INT(): TerminalNode | undefined { return this.tryGetToken(FilterParser.INT, 0); }
	public FLOAT(): TerminalNode | undefined { return this.tryGetToken(FilterParser.FLOAT, 0); }
	public STRING(): TerminalNode | undefined { return this.tryGetToken(FilterParser.STRING, 0); }
	public TRUE(): TerminalNode | undefined { return this.tryGetToken(FilterParser.TRUE, 0); }
	public FALSE(): TerminalNode | undefined { return this.tryGetToken(FilterParser.FALSE, 0); }
	public INT_ABBR(): TerminalNode | undefined { return this.tryGetToken(FilterParser.INT_ABBR, 0); }
	public FLOAT_ABBR(): TerminalNode | undefined { return this.tryGetToken(FilterParser.FLOAT_ABBR, 0); }
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return FilterParser.RULE_atom; }
	// @Override
	public enterRule(listener: FilterListener): void {
		if (listener.enterAtom) {
			listener.enterAtom(this);
		}
	}
	// @Override
	public exitRule(listener: FilterListener): void {
		if (listener.exitAtom) {
			listener.exitAtom(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FilterVisitor<Result>): Result {
		if (visitor.visitAtom) {
			return visitor.visitAtom(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class Numeric_columnContext extends ParserRuleContext {
	public ID_NUMERIC(): TerminalNode { return this.getToken(FilterParser.ID_NUMERIC, 0); }
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return FilterParser.RULE_numeric_column; }
	// @Override
	public enterRule(listener: FilterListener): void {
		if (listener.enterNumeric_column) {
			listener.enterNumeric_column(this);
		}
	}
	// @Override
	public exitRule(listener: FilterListener): void {
		if (listener.exitNumeric_column) {
			listener.exitNumeric_column(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FilterVisitor<Result>): Result {
		if (visitor.visitNumeric_column) {
			return visitor.visitNumeric_column(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class String_columnContext extends ParserRuleContext {
	public ID_STRING(): TerminalNode { return this.getToken(FilterParser.ID_STRING, 0); }
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return FilterParser.RULE_string_column; }
	// @Override
	public enterRule(listener: FilterListener): void {
		if (listener.enterString_column) {
			listener.enterString_column(this);
		}
	}
	// @Override
	public exitRule(listener: FilterListener): void {
		if (listener.exitString_column) {
			listener.exitString_column(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FilterVisitor<Result>): Result {
		if (visitor.visitString_column) {
			return visitor.visitString_column(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class ColumnContext extends ParserRuleContext {
	public ID(): TerminalNode { return this.getToken(FilterParser.ID, 0); }
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return FilterParser.RULE_column; }
	// @Override
	public enterRule(listener: FilterListener): void {
		if (listener.enterColumn) {
			listener.enterColumn(this);
		}
	}
	// @Override
	public exitRule(listener: FilterListener): void {
		if (listener.exitColumn) {
			listener.exitColumn(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FilterVisitor<Result>): Result {
		if (visitor.visitColumn) {
			return visitor.visitColumn(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class FilternameContext extends ParserRuleContext {
	public ID(): TerminalNode { return this.getToken(FilterParser.ID, 0); }
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return FilterParser.RULE_filtername; }
	// @Override
	public enterRule(listener: FilterListener): void {
		if (listener.enterFiltername) {
			listener.enterFiltername(this);
		}
	}
	// @Override
	public exitRule(listener: FilterListener): void {
		if (listener.exitFiltername) {
			listener.exitFiltername(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FilterVisitor<Result>): Result {
		if (visitor.visitFiltername) {
			return visitor.visitFiltername(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class Named_filterContext extends ParserRuleContext {
	public COLON(): TerminalNode { return this.getToken(FilterParser.COLON, 0); }
	public ID(): TerminalNode { return this.getToken(FilterParser.ID, 0); }
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return FilterParser.RULE_named_filter; }
	// @Override
	public enterRule(listener: FilterListener): void {
		if (listener.enterNamed_filter) {
			listener.enterNamed_filter(this);
		}
	}
	// @Override
	public exitRule(listener: FilterListener): void {
		if (listener.exitNamed_filter) {
			listener.exitNamed_filter(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FilterVisitor<Result>): Result {
		if (visitor.visitNamed_filter) {
			return visitor.visitNamed_filter(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class String_operatorContext extends ParserRuleContext {
	public substring_operator(): Substring_operatorContext | undefined {
		return this.tryGetRuleContext(0, Substring_operatorContext);
	}
	public equality_operator(): Equality_operatorContext | undefined {
		return this.tryGetRuleContext(0, Equality_operatorContext);
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return FilterParser.RULE_string_operator; }
	// @Override
	public enterRule(listener: FilterListener): void {
		if (listener.enterString_operator) {
			listener.enterString_operator(this);
		}
	}
	// @Override
	public exitRule(listener: FilterListener): void {
		if (listener.exitString_operator) {
			listener.exitString_operator(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FilterVisitor<Result>): Result {
		if (visitor.visitString_operator) {
			return visitor.visitString_operator(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class Numeric_operatorContext extends ParserRuleContext {
	public comparison_operator(): Comparison_operatorContext | undefined {
		return this.tryGetRuleContext(0, Comparison_operatorContext);
	}
	public equality_operator(): Equality_operatorContext | undefined {
		return this.tryGetRuleContext(0, Equality_operatorContext);
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return FilterParser.RULE_numeric_operator; }
	// @Override
	public enterRule(listener: FilterListener): void {
		if (listener.enterNumeric_operator) {
			listener.enterNumeric_operator(this);
		}
	}
	// @Override
	public exitRule(listener: FilterListener): void {
		if (listener.exitNumeric_operator) {
			listener.exitNumeric_operator(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FilterVisitor<Result>): Result {
		if (visitor.visitNumeric_operator) {
			return visitor.visitNumeric_operator(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class Equality_operatorContext extends ParserRuleContext {
	public EQ(): TerminalNode | undefined { return this.tryGetToken(FilterParser.EQ, 0); }
	public NEQ(): TerminalNode | undefined { return this.tryGetToken(FilterParser.NEQ, 0); }
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return FilterParser.RULE_equality_operator; }
	// @Override
	public enterRule(listener: FilterListener): void {
		if (listener.enterEquality_operator) {
			listener.enterEquality_operator(this);
		}
	}
	// @Override
	public exitRule(listener: FilterListener): void {
		if (listener.exitEquality_operator) {
			listener.exitEquality_operator(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FilterVisitor<Result>): Result {
		if (visitor.visitEquality_operator) {
			return visitor.visitEquality_operator(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class Comparison_operatorContext extends ParserRuleContext {
	public LT(): TerminalNode | undefined { return this.tryGetToken(FilterParser.LT, 0); }
	public GT(): TerminalNode | undefined { return this.tryGetToken(FilterParser.GT, 0); }
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return FilterParser.RULE_comparison_operator; }
	// @Override
	public enterRule(listener: FilterListener): void {
		if (listener.enterComparison_operator) {
			listener.enterComparison_operator(this);
		}
	}
	// @Override
	public exitRule(listener: FilterListener): void {
		if (listener.exitComparison_operator) {
			listener.exitComparison_operator(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FilterVisitor<Result>): Result {
		if (visitor.visitComparison_operator) {
			return visitor.visitComparison_operator(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class Substring_operatorContext extends ParserRuleContext {
	public STARTS(): TerminalNode | undefined { return this.tryGetToken(FilterParser.STARTS, 0); }
	public ENDS(): TerminalNode | undefined { return this.tryGetToken(FilterParser.ENDS, 0); }
	public CONTAINS(): TerminalNode | undefined { return this.tryGetToken(FilterParser.CONTAINS, 0); }
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return FilterParser.RULE_substring_operator; }
	// @Override
	public enterRule(listener: FilterListener): void {
		if (listener.enterSubstring_operator) {
			listener.enterSubstring_operator(this);
		}
	}
	// @Override
	public exitRule(listener: FilterListener): void {
		if (listener.exitSubstring_operator) {
			listener.exitSubstring_operator(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FilterVisitor<Result>): Result {
		if (visitor.visitSubstring_operator) {
			return visitor.visitSubstring_operator(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class OperatorContext extends ParserRuleContext {
	public LT(): TerminalNode | undefined { return this.tryGetToken(FilterParser.LT, 0); }
	public GT(): TerminalNode | undefined { return this.tryGetToken(FilterParser.GT, 0); }
	public EQ(): TerminalNode | undefined { return this.tryGetToken(FilterParser.EQ, 0); }
	public NEQ(): TerminalNode | undefined { return this.tryGetToken(FilterParser.NEQ, 0); }
	public STARTS(): TerminalNode | undefined { return this.tryGetToken(FilterParser.STARTS, 0); }
	public ENDS(): TerminalNode | undefined { return this.tryGetToken(FilterParser.ENDS, 0); }
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return FilterParser.RULE_operator; }
	// @Override
	public enterRule(listener: FilterListener): void {
		if (listener.enterOperator) {
			listener.enterOperator(this);
		}
	}
	// @Override
	public exitRule(listener: FilterListener): void {
		if (listener.exitOperator) {
			listener.exitOperator(this);
		}
	}
	// @Override
	public accept<Result>(visitor: FilterVisitor<Result>): Result {
		if (visitor.visitOperator) {
			return visitor.visitOperator(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


