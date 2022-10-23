// Generated from /Users/steve/github/venuu-io/vuu/vuu-ui/packages/datagrid-parsers/src/grammars/Filter.g4 by ANTLR 4.9.2
import org.antlr.v4.runtime.atn.*;
import org.antlr.v4.runtime.dfa.DFA;
import org.antlr.v4.runtime.*;
import org.antlr.v4.runtime.misc.*;
import org.antlr.v4.runtime.tree.*;
import java.util.List;
import java.util.Iterator;
import java.util.ArrayList;

@SuppressWarnings({"all", "warnings", "unchecked", "unused", "cast"})
public class FilterParser extends Parser {
	static { RuntimeMetaData.checkVersion("4.9.2", RuntimeMetaData.VERSION); }

	protected static final DFA[] _decisionToDFA;
	protected static final PredictionContextCache _sharedContextCache =
		new PredictionContextCache();
	public static final int
		TRUE=1, FALSE=2, AND=3, OR=4, AS=5, LT=6, GT=7, EQ=8, NEQ=9, IN=10, CONTAINS=11, 
		STARTS=12, ENDS=13, LBRACK=14, RBRACK=15, LPAREN=16, RPAREN=17, COMMA=18, 
		COLON=19, INT=20, FLOAT=21, INT_ABBR=22, FLOAT_ABBR=23, STRING=24, ID_STRING=25, 
		ID_NUMERIC=26, ID=27, WS=28;
	public static final int
		RULE_expression = 0, RULE_or_expression = 1, RULE_and_expression = 2, 
		RULE_as_clause = 3, RULE_term = 4, RULE_col_set_expression = 5, RULE_col_val_expression = 6, 
		RULE_numeric_col_val_expression = 7, RULE_string_col_val_expression = 8, 
		RULE_default_col_val_expression = 9, RULE_atoms = 10, RULE_atom = 11, 
		RULE_numeric_column = 12, RULE_string_column = 13, RULE_column = 14, RULE_filtername = 15, 
		RULE_named_filter = 16, RULE_string_operator = 17, RULE_numeric_operator = 18, 
		RULE_equality_operator = 19, RULE_comparison_operator = 20, RULE_substring_operator = 21, 
		RULE_operator = 22;
	private static String[] makeRuleNames() {
		return new String[] {
			"expression", "or_expression", "and_expression", "as_clause", "term", 
			"col_set_expression", "col_val_expression", "numeric_col_val_expression", 
			"string_col_val_expression", "default_col_val_expression", "atoms", "atom", 
			"numeric_column", "string_column", "column", "filtername", "named_filter", 
			"string_operator", "numeric_operator", "equality_operator", "comparison_operator", 
			"substring_operator", "operator"
		};
	}
	public static final String[] ruleNames = makeRuleNames();

	private static String[] makeLiteralNames() {
		return new String[] {
			null, "'true'", "'false'", "'and'", "'or'", "'as'", "'<'", "'>'", "'='", 
			"'!='", "'in'", "'contains'", "'starts'", "'ends'", "'['", "']'", "'('", 
			"')'", "','", "':'"
		};
	}
	private static final String[] _LITERAL_NAMES = makeLiteralNames();
	private static String[] makeSymbolicNames() {
		return new String[] {
			null, "TRUE", "FALSE", "AND", "OR", "AS", "LT", "GT", "EQ", "NEQ", "IN", 
			"CONTAINS", "STARTS", "ENDS", "LBRACK", "RBRACK", "LPAREN", "RPAREN", 
			"COMMA", "COLON", "INT", "FLOAT", "INT_ABBR", "FLOAT_ABBR", "STRING", 
			"ID_STRING", "ID_NUMERIC", "ID", "WS"
		};
	}
	private static final String[] _SYMBOLIC_NAMES = makeSymbolicNames();
	public static final Vocabulary VOCABULARY = new VocabularyImpl(_LITERAL_NAMES, _SYMBOLIC_NAMES);

	/**
	 * @deprecated Use {@link #VOCABULARY} instead.
	 */
	@Deprecated
	public static final String[] tokenNames;
	static {
		tokenNames = new String[_SYMBOLIC_NAMES.length];
		for (int i = 0; i < tokenNames.length; i++) {
			tokenNames[i] = VOCABULARY.getLiteralName(i);
			if (tokenNames[i] == null) {
				tokenNames[i] = VOCABULARY.getSymbolicName(i);
			}

			if (tokenNames[i] == null) {
				tokenNames[i] = "<INVALID>";
			}
		}
	}

	@Override
	@Deprecated
	public String[] getTokenNames() {
		return tokenNames;
	}

	@Override

	public Vocabulary getVocabulary() {
		return VOCABULARY;
	}

	@Override
	public String getGrammarFileName() { return "Filter.g4"; }

	@Override
	public String[] getRuleNames() { return ruleNames; }

	@Override
	public String getSerializedATN() { return _serializedATN; }

	@Override
	public ATN getATN() { return _ATN; }

	public FilterParser(TokenStream input) {
		super(input);
		_interp = new ParserATNSimulator(this,_ATN,_decisionToDFA,_sharedContextCache);
	}

	public static class ExpressionContext extends ParserRuleContext {
		public Or_expressionContext or_expression() {
			return getRuleContext(Or_expressionContext.class,0);
		}
		public TerminalNode EOF() { return getToken(FilterParser.EOF, 0); }
		public As_clauseContext as_clause() {
			return getRuleContext(As_clauseContext.class,0);
		}
		public ExpressionContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_expression; }
	}

	public final ExpressionContext expression() throws RecognitionException {
		ExpressionContext _localctx = new ExpressionContext(_ctx, getState());
		enterRule(_localctx, 0, RULE_expression);
		int _la;
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(46);
			or_expression();
			setState(48);
			_errHandler.sync(this);
			_la = _input.LA(1);
			if (_la==AS) {
				{
				setState(47);
				as_clause();
				}
			}

			setState(50);
			match(EOF);
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	public static class Or_expressionContext extends ParserRuleContext {
		public And_expressionContext and_expression() {
			return getRuleContext(And_expressionContext.class,0);
		}
		public List<TerminalNode> OR() { return getTokens(FilterParser.OR); }
		public TerminalNode OR(int i) {
			return getToken(FilterParser.OR, i);
		}
		public List<Or_expressionContext> or_expression() {
			return getRuleContexts(Or_expressionContext.class);
		}
		public Or_expressionContext or_expression(int i) {
			return getRuleContext(Or_expressionContext.class,i);
		}
		public Or_expressionContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_or_expression; }
	}

	public final Or_expressionContext or_expression() throws RecognitionException {
		Or_expressionContext _localctx = new Or_expressionContext(_ctx, getState());
		enterRule(_localctx, 2, RULE_or_expression);
		try {
			int _alt;
			enterOuterAlt(_localctx, 1);
			{
			setState(52);
			and_expression();
			setState(57);
			_errHandler.sync(this);
			_alt = getInterpreter().adaptivePredict(_input,1,_ctx);
			while ( _alt!=2 && _alt!=org.antlr.v4.runtime.atn.ATN.INVALID_ALT_NUMBER ) {
				if ( _alt==1 ) {
					{
					{
					setState(53);
					match(OR);
					setState(54);
					or_expression();
					}
					} 
				}
				setState(59);
				_errHandler.sync(this);
				_alt = getInterpreter().adaptivePredict(_input,1,_ctx);
			}
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	public static class And_expressionContext extends ParserRuleContext {
		public List<TermContext> term() {
			return getRuleContexts(TermContext.class);
		}
		public TermContext term(int i) {
			return getRuleContext(TermContext.class,i);
		}
		public List<TerminalNode> AND() { return getTokens(FilterParser.AND); }
		public TerminalNode AND(int i) {
			return getToken(FilterParser.AND, i);
		}
		public And_expressionContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_and_expression; }
	}

	public final And_expressionContext and_expression() throws RecognitionException {
		And_expressionContext _localctx = new And_expressionContext(_ctx, getState());
		enterRule(_localctx, 4, RULE_and_expression);
		int _la;
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(60);
			term();
			setState(65);
			_errHandler.sync(this);
			_la = _input.LA(1);
			while (_la==AND) {
				{
				{
				setState(61);
				match(AND);
				setState(62);
				term();
				}
				}
				setState(67);
				_errHandler.sync(this);
				_la = _input.LA(1);
			}
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	public static class As_clauseContext extends ParserRuleContext {
		public TerminalNode AS() { return getToken(FilterParser.AS, 0); }
		public FilternameContext filtername() {
			return getRuleContext(FilternameContext.class,0);
		}
		public As_clauseContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_as_clause; }
	}

	public final As_clauseContext as_clause() throws RecognitionException {
		As_clauseContext _localctx = new As_clauseContext(_ctx, getState());
		enterRule(_localctx, 6, RULE_as_clause);
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(68);
			match(AS);
			setState(69);
			filtername();
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	public static class TermContext extends ParserRuleContext {
		public Col_val_expressionContext col_val_expression() {
			return getRuleContext(Col_val_expressionContext.class,0);
		}
		public Col_set_expressionContext col_set_expression() {
			return getRuleContext(Col_set_expressionContext.class,0);
		}
		public Named_filterContext named_filter() {
			return getRuleContext(Named_filterContext.class,0);
		}
		public TerminalNode LPAREN() { return getToken(FilterParser.LPAREN, 0); }
		public Or_expressionContext or_expression() {
			return getRuleContext(Or_expressionContext.class,0);
		}
		public TerminalNode RPAREN() { return getToken(FilterParser.RPAREN, 0); }
		public TermContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_term; }
	}

	public final TermContext term() throws RecognitionException {
		TermContext _localctx = new TermContext(_ctx, getState());
		enterRule(_localctx, 8, RULE_term);
		try {
			setState(78);
			_errHandler.sync(this);
			switch ( getInterpreter().adaptivePredict(_input,3,_ctx) ) {
			case 1:
				enterOuterAlt(_localctx, 1);
				{
				setState(71);
				col_val_expression();
				}
				break;
			case 2:
				enterOuterAlt(_localctx, 2);
				{
				setState(72);
				col_set_expression();
				}
				break;
			case 3:
				enterOuterAlt(_localctx, 3);
				{
				setState(73);
				named_filter();
				}
				break;
			case 4:
				enterOuterAlt(_localctx, 4);
				{
				setState(74);
				match(LPAREN);
				setState(75);
				or_expression();
				setState(76);
				match(RPAREN);
				}
				break;
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	public static class Col_set_expressionContext extends ParserRuleContext {
		public TerminalNode IN() { return getToken(FilterParser.IN, 0); }
		public TerminalNode LBRACK() { return getToken(FilterParser.LBRACK, 0); }
		public AtomsContext atoms() {
			return getRuleContext(AtomsContext.class,0);
		}
		public TerminalNode RBRACK() { return getToken(FilterParser.RBRACK, 0); }
		public ColumnContext column() {
			return getRuleContext(ColumnContext.class,0);
		}
		public String_columnContext string_column() {
			return getRuleContext(String_columnContext.class,0);
		}
		public Col_set_expressionContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_col_set_expression; }
	}

	public final Col_set_expressionContext col_set_expression() throws RecognitionException {
		Col_set_expressionContext _localctx = new Col_set_expressionContext(_ctx, getState());
		enterRule(_localctx, 10, RULE_col_set_expression);
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(82);
			_errHandler.sync(this);
			switch (_input.LA(1)) {
			case ID:
				{
				setState(80);
				column();
				}
				break;
			case ID_STRING:
				{
				setState(81);
				string_column();
				}
				break;
			default:
				throw new NoViableAltException(this);
			}
			setState(84);
			match(IN);
			setState(85);
			match(LBRACK);
			setState(86);
			atoms();
			setState(87);
			match(RBRACK);
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	public static class Col_val_expressionContext extends ParserRuleContext {
		public Numeric_col_val_expressionContext numeric_col_val_expression() {
			return getRuleContext(Numeric_col_val_expressionContext.class,0);
		}
		public String_col_val_expressionContext string_col_val_expression() {
			return getRuleContext(String_col_val_expressionContext.class,0);
		}
		public Default_col_val_expressionContext default_col_val_expression() {
			return getRuleContext(Default_col_val_expressionContext.class,0);
		}
		public Col_val_expressionContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_col_val_expression; }
	}

	public final Col_val_expressionContext col_val_expression() throws RecognitionException {
		Col_val_expressionContext _localctx = new Col_val_expressionContext(_ctx, getState());
		enterRule(_localctx, 12, RULE_col_val_expression);
		try {
			setState(92);
			_errHandler.sync(this);
			switch (_input.LA(1)) {
			case ID_NUMERIC:
				enterOuterAlt(_localctx, 1);
				{
				setState(89);
				numeric_col_val_expression();
				}
				break;
			case ID_STRING:
				enterOuterAlt(_localctx, 2);
				{
				setState(90);
				string_col_val_expression();
				}
				break;
			case ID:
				enterOuterAlt(_localctx, 3);
				{
				setState(91);
				default_col_val_expression();
				}
				break;
			default:
				throw new NoViableAltException(this);
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	public static class Numeric_col_val_expressionContext extends ParserRuleContext {
		public Numeric_columnContext numeric_column() {
			return getRuleContext(Numeric_columnContext.class,0);
		}
		public Numeric_operatorContext numeric_operator() {
			return getRuleContext(Numeric_operatorContext.class,0);
		}
		public AtomContext atom() {
			return getRuleContext(AtomContext.class,0);
		}
		public Numeric_col_val_expressionContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_numeric_col_val_expression; }
	}

	public final Numeric_col_val_expressionContext numeric_col_val_expression() throws RecognitionException {
		Numeric_col_val_expressionContext _localctx = new Numeric_col_val_expressionContext(_ctx, getState());
		enterRule(_localctx, 14, RULE_numeric_col_val_expression);
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(94);
			numeric_column();
			setState(95);
			numeric_operator();
			setState(96);
			atom();
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	public static class String_col_val_expressionContext extends ParserRuleContext {
		public String_columnContext string_column() {
			return getRuleContext(String_columnContext.class,0);
		}
		public String_operatorContext string_operator() {
			return getRuleContext(String_operatorContext.class,0);
		}
		public AtomContext atom() {
			return getRuleContext(AtomContext.class,0);
		}
		public String_col_val_expressionContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_string_col_val_expression; }
	}

	public final String_col_val_expressionContext string_col_val_expression() throws RecognitionException {
		String_col_val_expressionContext _localctx = new String_col_val_expressionContext(_ctx, getState());
		enterRule(_localctx, 16, RULE_string_col_val_expression);
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(98);
			string_column();
			setState(99);
			string_operator();
			setState(100);
			atom();
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	public static class Default_col_val_expressionContext extends ParserRuleContext {
		public ColumnContext column() {
			return getRuleContext(ColumnContext.class,0);
		}
		public OperatorContext operator() {
			return getRuleContext(OperatorContext.class,0);
		}
		public AtomContext atom() {
			return getRuleContext(AtomContext.class,0);
		}
		public Default_col_val_expressionContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_default_col_val_expression; }
	}

	public final Default_col_val_expressionContext default_col_val_expression() throws RecognitionException {
		Default_col_val_expressionContext _localctx = new Default_col_val_expressionContext(_ctx, getState());
		enterRule(_localctx, 18, RULE_default_col_val_expression);
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(102);
			column();
			setState(103);
			operator();
			setState(104);
			atom();
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	public static class AtomsContext extends ParserRuleContext {
		public List<AtomContext> atom() {
			return getRuleContexts(AtomContext.class);
		}
		public AtomContext atom(int i) {
			return getRuleContext(AtomContext.class,i);
		}
		public List<TerminalNode> COMMA() { return getTokens(FilterParser.COMMA); }
		public TerminalNode COMMA(int i) {
			return getToken(FilterParser.COMMA, i);
		}
		public AtomsContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_atoms; }
	}

	public final AtomsContext atoms() throws RecognitionException {
		AtomsContext _localctx = new AtomsContext(_ctx, getState());
		enterRule(_localctx, 20, RULE_atoms);
		int _la;
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(106);
			atom();
			setState(111);
			_errHandler.sync(this);
			_la = _input.LA(1);
			while (_la==COMMA) {
				{
				{
				setState(107);
				match(COMMA);
				setState(108);
				atom();
				}
				}
				setState(113);
				_errHandler.sync(this);
				_la = _input.LA(1);
			}
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	public static class AtomContext extends ParserRuleContext {
		public TerminalNode ID() { return getToken(FilterParser.ID, 0); }
		public TerminalNode INT() { return getToken(FilterParser.INT, 0); }
		public TerminalNode FLOAT() { return getToken(FilterParser.FLOAT, 0); }
		public TerminalNode STRING() { return getToken(FilterParser.STRING, 0); }
		public TerminalNode TRUE() { return getToken(FilterParser.TRUE, 0); }
		public TerminalNode FALSE() { return getToken(FilterParser.FALSE, 0); }
		public TerminalNode INT_ABBR() { return getToken(FilterParser.INT_ABBR, 0); }
		public TerminalNode FLOAT_ABBR() { return getToken(FilterParser.FLOAT_ABBR, 0); }
		public AtomContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_atom; }
	}

	public final AtomContext atom() throws RecognitionException {
		AtomContext _localctx = new AtomContext(_ctx, getState());
		enterRule(_localctx, 22, RULE_atom);
		int _la;
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(114);
			_la = _input.LA(1);
			if ( !((((_la) & ~0x3f) == 0 && ((1L << _la) & ((1L << TRUE) | (1L << FALSE) | (1L << INT) | (1L << FLOAT) | (1L << INT_ABBR) | (1L << FLOAT_ABBR) | (1L << STRING) | (1L << ID))) != 0)) ) {
			_errHandler.recoverInline(this);
			}
			else {
				if ( _input.LA(1)==Token.EOF ) matchedEOF = true;
				_errHandler.reportMatch(this);
				consume();
			}
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	public static class Numeric_columnContext extends ParserRuleContext {
		public TerminalNode ID_NUMERIC() { return getToken(FilterParser.ID_NUMERIC, 0); }
		public Numeric_columnContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_numeric_column; }
	}

	public final Numeric_columnContext numeric_column() throws RecognitionException {
		Numeric_columnContext _localctx = new Numeric_columnContext(_ctx, getState());
		enterRule(_localctx, 24, RULE_numeric_column);
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(116);
			match(ID_NUMERIC);
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	public static class String_columnContext extends ParserRuleContext {
		public TerminalNode ID_STRING() { return getToken(FilterParser.ID_STRING, 0); }
		public String_columnContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_string_column; }
	}

	public final String_columnContext string_column() throws RecognitionException {
		String_columnContext _localctx = new String_columnContext(_ctx, getState());
		enterRule(_localctx, 26, RULE_string_column);
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(118);
			match(ID_STRING);
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	public static class ColumnContext extends ParserRuleContext {
		public TerminalNode ID() { return getToken(FilterParser.ID, 0); }
		public ColumnContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_column; }
	}

	public final ColumnContext column() throws RecognitionException {
		ColumnContext _localctx = new ColumnContext(_ctx, getState());
		enterRule(_localctx, 28, RULE_column);
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(120);
			match(ID);
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	public static class FilternameContext extends ParserRuleContext {
		public TerminalNode ID() { return getToken(FilterParser.ID, 0); }
		public FilternameContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_filtername; }
	}

	public final FilternameContext filtername() throws RecognitionException {
		FilternameContext _localctx = new FilternameContext(_ctx, getState());
		enterRule(_localctx, 30, RULE_filtername);
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(122);
			match(ID);
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	public static class Named_filterContext extends ParserRuleContext {
		public TerminalNode COLON() { return getToken(FilterParser.COLON, 0); }
		public TerminalNode ID() { return getToken(FilterParser.ID, 0); }
		public Named_filterContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_named_filter; }
	}

	public final Named_filterContext named_filter() throws RecognitionException {
		Named_filterContext _localctx = new Named_filterContext(_ctx, getState());
		enterRule(_localctx, 32, RULE_named_filter);
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(124);
			match(COLON);
			setState(125);
			match(ID);
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	public static class String_operatorContext extends ParserRuleContext {
		public Substring_operatorContext substring_operator() {
			return getRuleContext(Substring_operatorContext.class,0);
		}
		public Equality_operatorContext equality_operator() {
			return getRuleContext(Equality_operatorContext.class,0);
		}
		public String_operatorContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_string_operator; }
	}

	public final String_operatorContext string_operator() throws RecognitionException {
		String_operatorContext _localctx = new String_operatorContext(_ctx, getState());
		enterRule(_localctx, 34, RULE_string_operator);
		try {
			setState(129);
			_errHandler.sync(this);
			switch (_input.LA(1)) {
			case CONTAINS:
			case STARTS:
			case ENDS:
				enterOuterAlt(_localctx, 1);
				{
				setState(127);
				substring_operator();
				}
				break;
			case EQ:
			case NEQ:
				enterOuterAlt(_localctx, 2);
				{
				setState(128);
				equality_operator();
				}
				break;
			default:
				throw new NoViableAltException(this);
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	public static class Numeric_operatorContext extends ParserRuleContext {
		public Comparison_operatorContext comparison_operator() {
			return getRuleContext(Comparison_operatorContext.class,0);
		}
		public Equality_operatorContext equality_operator() {
			return getRuleContext(Equality_operatorContext.class,0);
		}
		public Numeric_operatorContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_numeric_operator; }
	}

	public final Numeric_operatorContext numeric_operator() throws RecognitionException {
		Numeric_operatorContext _localctx = new Numeric_operatorContext(_ctx, getState());
		enterRule(_localctx, 36, RULE_numeric_operator);
		try {
			setState(133);
			_errHandler.sync(this);
			switch (_input.LA(1)) {
			case LT:
			case GT:
				enterOuterAlt(_localctx, 1);
				{
				setState(131);
				comparison_operator();
				}
				break;
			case EQ:
			case NEQ:
				enterOuterAlt(_localctx, 2);
				{
				setState(132);
				equality_operator();
				}
				break;
			default:
				throw new NoViableAltException(this);
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	public static class Equality_operatorContext extends ParserRuleContext {
		public TerminalNode EQ() { return getToken(FilterParser.EQ, 0); }
		public TerminalNode NEQ() { return getToken(FilterParser.NEQ, 0); }
		public Equality_operatorContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_equality_operator; }
	}

	public final Equality_operatorContext equality_operator() throws RecognitionException {
		Equality_operatorContext _localctx = new Equality_operatorContext(_ctx, getState());
		enterRule(_localctx, 38, RULE_equality_operator);
		int _la;
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(135);
			_la = _input.LA(1);
			if ( !(_la==EQ || _la==NEQ) ) {
			_errHandler.recoverInline(this);
			}
			else {
				if ( _input.LA(1)==Token.EOF ) matchedEOF = true;
				_errHandler.reportMatch(this);
				consume();
			}
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	public static class Comparison_operatorContext extends ParserRuleContext {
		public TerminalNode LT() { return getToken(FilterParser.LT, 0); }
		public TerminalNode GT() { return getToken(FilterParser.GT, 0); }
		public Comparison_operatorContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_comparison_operator; }
	}

	public final Comparison_operatorContext comparison_operator() throws RecognitionException {
		Comparison_operatorContext _localctx = new Comparison_operatorContext(_ctx, getState());
		enterRule(_localctx, 40, RULE_comparison_operator);
		int _la;
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(137);
			_la = _input.LA(1);
			if ( !(_la==LT || _la==GT) ) {
			_errHandler.recoverInline(this);
			}
			else {
				if ( _input.LA(1)==Token.EOF ) matchedEOF = true;
				_errHandler.reportMatch(this);
				consume();
			}
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	public static class Substring_operatorContext extends ParserRuleContext {
		public TerminalNode STARTS() { return getToken(FilterParser.STARTS, 0); }
		public TerminalNode ENDS() { return getToken(FilterParser.ENDS, 0); }
		public TerminalNode CONTAINS() { return getToken(FilterParser.CONTAINS, 0); }
		public Substring_operatorContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_substring_operator; }
	}

	public final Substring_operatorContext substring_operator() throws RecognitionException {
		Substring_operatorContext _localctx = new Substring_operatorContext(_ctx, getState());
		enterRule(_localctx, 42, RULE_substring_operator);
		int _la;
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(139);
			_la = _input.LA(1);
			if ( !((((_la) & ~0x3f) == 0 && ((1L << _la) & ((1L << CONTAINS) | (1L << STARTS) | (1L << ENDS))) != 0)) ) {
			_errHandler.recoverInline(this);
			}
			else {
				if ( _input.LA(1)==Token.EOF ) matchedEOF = true;
				_errHandler.reportMatch(this);
				consume();
			}
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	public static class OperatorContext extends ParserRuleContext {
		public TerminalNode LT() { return getToken(FilterParser.LT, 0); }
		public TerminalNode GT() { return getToken(FilterParser.GT, 0); }
		public TerminalNode EQ() { return getToken(FilterParser.EQ, 0); }
		public TerminalNode NEQ() { return getToken(FilterParser.NEQ, 0); }
		public TerminalNode STARTS() { return getToken(FilterParser.STARTS, 0); }
		public TerminalNode ENDS() { return getToken(FilterParser.ENDS, 0); }
		public OperatorContext(ParserRuleContext parent, int invokingState) {
			super(parent, invokingState);
		}
		@Override public int getRuleIndex() { return RULE_operator; }
	}

	public final OperatorContext operator() throws RecognitionException {
		OperatorContext _localctx = new OperatorContext(_ctx, getState());
		enterRule(_localctx, 44, RULE_operator);
		int _la;
		try {
			enterOuterAlt(_localctx, 1);
			{
			setState(141);
			_la = _input.LA(1);
			if ( !((((_la) & ~0x3f) == 0 && ((1L << _la) & ((1L << LT) | (1L << GT) | (1L << EQ) | (1L << NEQ) | (1L << STARTS) | (1L << ENDS))) != 0)) ) {
			_errHandler.recoverInline(this);
			}
			else {
				if ( _input.LA(1)==Token.EOF ) matchedEOF = true;
				_errHandler.reportMatch(this);
				consume();
			}
			}
		}
		catch (RecognitionException re) {
			_localctx.exception = re;
			_errHandler.reportError(this, re);
			_errHandler.recover(this, re);
		}
		finally {
			exitRule();
		}
		return _localctx;
	}

	public static final String _serializedATN =
		"\3\u608b\ua72a\u8133\ub9ed\u417c\u3be7\u7786\u5964\3\36\u0092\4\2\t\2"+
		"\4\3\t\3\4\4\t\4\4\5\t\5\4\6\t\6\4\7\t\7\4\b\t\b\4\t\t\t\4\n\t\n\4\13"+
		"\t\13\4\f\t\f\4\r\t\r\4\16\t\16\4\17\t\17\4\20\t\20\4\21\t\21\4\22\t\22"+
		"\4\23\t\23\4\24\t\24\4\25\t\25\4\26\t\26\4\27\t\27\4\30\t\30\3\2\3\2\5"+
		"\2\63\n\2\3\2\3\2\3\3\3\3\3\3\7\3:\n\3\f\3\16\3=\13\3\3\4\3\4\3\4\7\4"+
		"B\n\4\f\4\16\4E\13\4\3\5\3\5\3\5\3\6\3\6\3\6\3\6\3\6\3\6\3\6\5\6Q\n\6"+
		"\3\7\3\7\5\7U\n\7\3\7\3\7\3\7\3\7\3\7\3\b\3\b\3\b\5\b_\n\b\3\t\3\t\3\t"+
		"\3\t\3\n\3\n\3\n\3\n\3\13\3\13\3\13\3\13\3\f\3\f\3\f\7\fp\n\f\f\f\16\f"+
		"s\13\f\3\r\3\r\3\16\3\16\3\17\3\17\3\20\3\20\3\21\3\21\3\22\3\22\3\22"+
		"\3\23\3\23\5\23\u0084\n\23\3\24\3\24\5\24\u0088\n\24\3\25\3\25\3\26\3"+
		"\26\3\27\3\27\3\30\3\30\3\30\2\2\31\2\4\6\b\n\f\16\20\22\24\26\30\32\34"+
		"\36 \"$&(*,.\2\7\5\2\3\4\26\32\35\35\3\2\n\13\3\2\b\t\3\2\r\17\4\2\b\13"+
		"\16\17\2\u0086\2\60\3\2\2\2\4\66\3\2\2\2\6>\3\2\2\2\bF\3\2\2\2\nP\3\2"+
		"\2\2\fT\3\2\2\2\16^\3\2\2\2\20`\3\2\2\2\22d\3\2\2\2\24h\3\2\2\2\26l\3"+
		"\2\2\2\30t\3\2\2\2\32v\3\2\2\2\34x\3\2\2\2\36z\3\2\2\2 |\3\2\2\2\"~\3"+
		"\2\2\2$\u0083\3\2\2\2&\u0087\3\2\2\2(\u0089\3\2\2\2*\u008b\3\2\2\2,\u008d"+
		"\3\2\2\2.\u008f\3\2\2\2\60\62\5\4\3\2\61\63\5\b\5\2\62\61\3\2\2\2\62\63"+
		"\3\2\2\2\63\64\3\2\2\2\64\65\7\2\2\3\65\3\3\2\2\2\66;\5\6\4\2\678\7\6"+
		"\2\28:\5\4\3\29\67\3\2\2\2:=\3\2\2\2;9\3\2\2\2;<\3\2\2\2<\5\3\2\2\2=;"+
		"\3\2\2\2>C\5\n\6\2?@\7\5\2\2@B\5\n\6\2A?\3\2\2\2BE\3\2\2\2CA\3\2\2\2C"+
		"D\3\2\2\2D\7\3\2\2\2EC\3\2\2\2FG\7\7\2\2GH\5 \21\2H\t\3\2\2\2IQ\5\16\b"+
		"\2JQ\5\f\7\2KQ\5\"\22\2LM\7\22\2\2MN\5\4\3\2NO\7\23\2\2OQ\3\2\2\2PI\3"+
		"\2\2\2PJ\3\2\2\2PK\3\2\2\2PL\3\2\2\2Q\13\3\2\2\2RU\5\36\20\2SU\5\34\17"+
		"\2TR\3\2\2\2TS\3\2\2\2UV\3\2\2\2VW\7\f\2\2WX\7\20\2\2XY\5\26\f\2YZ\7\21"+
		"\2\2Z\r\3\2\2\2[_\5\20\t\2\\_\5\22\n\2]_\5\24\13\2^[\3\2\2\2^\\\3\2\2"+
		"\2^]\3\2\2\2_\17\3\2\2\2`a\5\32\16\2ab\5&\24\2bc\5\30\r\2c\21\3\2\2\2"+
		"de\5\34\17\2ef\5$\23\2fg\5\30\r\2g\23\3\2\2\2hi\5\36\20\2ij\5.\30\2jk"+
		"\5\30\r\2k\25\3\2\2\2lq\5\30\r\2mn\7\24\2\2np\5\30\r\2om\3\2\2\2ps\3\2"+
		"\2\2qo\3\2\2\2qr\3\2\2\2r\27\3\2\2\2sq\3\2\2\2tu\t\2\2\2u\31\3\2\2\2v"+
		"w\7\34\2\2w\33\3\2\2\2xy\7\33\2\2y\35\3\2\2\2z{\7\35\2\2{\37\3\2\2\2|"+
		"}\7\35\2\2}!\3\2\2\2~\177\7\25\2\2\177\u0080\7\35\2\2\u0080#\3\2\2\2\u0081"+
		"\u0084\5,\27\2\u0082\u0084\5(\25\2\u0083\u0081\3\2\2\2\u0083\u0082\3\2"+
		"\2\2\u0084%\3\2\2\2\u0085\u0088\5*\26\2\u0086\u0088\5(\25\2\u0087\u0085"+
		"\3\2\2\2\u0087\u0086\3\2\2\2\u0088\'\3\2\2\2\u0089\u008a\t\3\2\2\u008a"+
		")\3\2\2\2\u008b\u008c\t\4\2\2\u008c+\3\2\2\2\u008d\u008e\t\5\2\2\u008e"+
		"-\3\2\2\2\u008f\u0090\t\6\2\2\u0090/\3\2\2\2\13\62;CPT^q\u0083\u0087";
	public static final ATN _ATN =
		new ATNDeserializer().deserialize(_serializedATN.toCharArray());
	static {
		_decisionToDFA = new DFA[_ATN.getNumberOfDecisions()];
		for (int i = 0; i < _ATN.getNumberOfDecisions(); i++) {
			_decisionToDFA[i] = new DFA(_ATN.getDecisionState(i), i);
		}
	}
}