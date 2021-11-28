// Generated from ./src/grammars/Filter.g4 by ANTLR 4.9.0-SNAPSHOT


import { ParseTreeListener } from "antlr4ts/tree/ParseTreeListener";

import { ExpressionContext } from "./FilterParser";
import { Or_expressionContext } from "./FilterParser";
import { And_expressionContext } from "./FilterParser";
import { As_clauseContext } from "./FilterParser";
import { TermContext } from "./FilterParser";
import { Col_set_expressionContext } from "./FilterParser";
import { Col_val_expressionContext } from "./FilterParser";
import { Numeric_col_val_expressionContext } from "./FilterParser";
import { String_col_val_expressionContext } from "./FilterParser";
import { Default_col_val_expressionContext } from "./FilterParser";
import { AtomsContext } from "./FilterParser";
import { AtomContext } from "./FilterParser";
import { Numeric_columnContext } from "./FilterParser";
import { String_columnContext } from "./FilterParser";
import { ColumnContext } from "./FilterParser";
import { FilternameContext } from "./FilterParser";
import { Named_filterContext } from "./FilterParser";
import { String_operatorContext } from "./FilterParser";
import { Numeric_operatorContext } from "./FilterParser";
import { Equality_operatorContext } from "./FilterParser";
import { Comparison_operatorContext } from "./FilterParser";
import { Substring_operatorContext } from "./FilterParser";
import { OperatorContext } from "./FilterParser";


/**
 * This interface defines a complete listener for a parse tree produced by
 * `FilterParser`.
 */
export interface FilterListener extends ParseTreeListener {
	/**
	 * Enter a parse tree produced by `FilterParser.expression`.
	 * @param ctx the parse tree
	 */
	enterExpression?: (ctx: ExpressionContext) => void;
	/**
	 * Exit a parse tree produced by `FilterParser.expression`.
	 * @param ctx the parse tree
	 */
	exitExpression?: (ctx: ExpressionContext) => void;

	/**
	 * Enter a parse tree produced by `FilterParser.or_expression`.
	 * @param ctx the parse tree
	 */
	enterOr_expression?: (ctx: Or_expressionContext) => void;
	/**
	 * Exit a parse tree produced by `FilterParser.or_expression`.
	 * @param ctx the parse tree
	 */
	exitOr_expression?: (ctx: Or_expressionContext) => void;

	/**
	 * Enter a parse tree produced by `FilterParser.and_expression`.
	 * @param ctx the parse tree
	 */
	enterAnd_expression?: (ctx: And_expressionContext) => void;
	/**
	 * Exit a parse tree produced by `FilterParser.and_expression`.
	 * @param ctx the parse tree
	 */
	exitAnd_expression?: (ctx: And_expressionContext) => void;

	/**
	 * Enter a parse tree produced by `FilterParser.as_clause`.
	 * @param ctx the parse tree
	 */
	enterAs_clause?: (ctx: As_clauseContext) => void;
	/**
	 * Exit a parse tree produced by `FilterParser.as_clause`.
	 * @param ctx the parse tree
	 */
	exitAs_clause?: (ctx: As_clauseContext) => void;

	/**
	 * Enter a parse tree produced by `FilterParser.term`.
	 * @param ctx the parse tree
	 */
	enterTerm?: (ctx: TermContext) => void;
	/**
	 * Exit a parse tree produced by `FilterParser.term`.
	 * @param ctx the parse tree
	 */
	exitTerm?: (ctx: TermContext) => void;

	/**
	 * Enter a parse tree produced by `FilterParser.col_set_expression`.
	 * @param ctx the parse tree
	 */
	enterCol_set_expression?: (ctx: Col_set_expressionContext) => void;
	/**
	 * Exit a parse tree produced by `FilterParser.col_set_expression`.
	 * @param ctx the parse tree
	 */
	exitCol_set_expression?: (ctx: Col_set_expressionContext) => void;

	/**
	 * Enter a parse tree produced by `FilterParser.col_val_expression`.
	 * @param ctx the parse tree
	 */
	enterCol_val_expression?: (ctx: Col_val_expressionContext) => void;
	/**
	 * Exit a parse tree produced by `FilterParser.col_val_expression`.
	 * @param ctx the parse tree
	 */
	exitCol_val_expression?: (ctx: Col_val_expressionContext) => void;

	/**
	 * Enter a parse tree produced by `FilterParser.numeric_col_val_expression`.
	 * @param ctx the parse tree
	 */
	enterNumeric_col_val_expression?: (ctx: Numeric_col_val_expressionContext) => void;
	/**
	 * Exit a parse tree produced by `FilterParser.numeric_col_val_expression`.
	 * @param ctx the parse tree
	 */
	exitNumeric_col_val_expression?: (ctx: Numeric_col_val_expressionContext) => void;

	/**
	 * Enter a parse tree produced by `FilterParser.string_col_val_expression`.
	 * @param ctx the parse tree
	 */
	enterString_col_val_expression?: (ctx: String_col_val_expressionContext) => void;
	/**
	 * Exit a parse tree produced by `FilterParser.string_col_val_expression`.
	 * @param ctx the parse tree
	 */
	exitString_col_val_expression?: (ctx: String_col_val_expressionContext) => void;

	/**
	 * Enter a parse tree produced by `FilterParser.default_col_val_expression`.
	 * @param ctx the parse tree
	 */
	enterDefault_col_val_expression?: (ctx: Default_col_val_expressionContext) => void;
	/**
	 * Exit a parse tree produced by `FilterParser.default_col_val_expression`.
	 * @param ctx the parse tree
	 */
	exitDefault_col_val_expression?: (ctx: Default_col_val_expressionContext) => void;

	/**
	 * Enter a parse tree produced by `FilterParser.atoms`.
	 * @param ctx the parse tree
	 */
	enterAtoms?: (ctx: AtomsContext) => void;
	/**
	 * Exit a parse tree produced by `FilterParser.atoms`.
	 * @param ctx the parse tree
	 */
	exitAtoms?: (ctx: AtomsContext) => void;

	/**
	 * Enter a parse tree produced by `FilterParser.atom`.
	 * @param ctx the parse tree
	 */
	enterAtom?: (ctx: AtomContext) => void;
	/**
	 * Exit a parse tree produced by `FilterParser.atom`.
	 * @param ctx the parse tree
	 */
	exitAtom?: (ctx: AtomContext) => void;

	/**
	 * Enter a parse tree produced by `FilterParser.numeric_column`.
	 * @param ctx the parse tree
	 */
	enterNumeric_column?: (ctx: Numeric_columnContext) => void;
	/**
	 * Exit a parse tree produced by `FilterParser.numeric_column`.
	 * @param ctx the parse tree
	 */
	exitNumeric_column?: (ctx: Numeric_columnContext) => void;

	/**
	 * Enter a parse tree produced by `FilterParser.string_column`.
	 * @param ctx the parse tree
	 */
	enterString_column?: (ctx: String_columnContext) => void;
	/**
	 * Exit a parse tree produced by `FilterParser.string_column`.
	 * @param ctx the parse tree
	 */
	exitString_column?: (ctx: String_columnContext) => void;

	/**
	 * Enter a parse tree produced by `FilterParser.column`.
	 * @param ctx the parse tree
	 */
	enterColumn?: (ctx: ColumnContext) => void;
	/**
	 * Exit a parse tree produced by `FilterParser.column`.
	 * @param ctx the parse tree
	 */
	exitColumn?: (ctx: ColumnContext) => void;

	/**
	 * Enter a parse tree produced by `FilterParser.filtername`.
	 * @param ctx the parse tree
	 */
	enterFiltername?: (ctx: FilternameContext) => void;
	/**
	 * Exit a parse tree produced by `FilterParser.filtername`.
	 * @param ctx the parse tree
	 */
	exitFiltername?: (ctx: FilternameContext) => void;

	/**
	 * Enter a parse tree produced by `FilterParser.named_filter`.
	 * @param ctx the parse tree
	 */
	enterNamed_filter?: (ctx: Named_filterContext) => void;
	/**
	 * Exit a parse tree produced by `FilterParser.named_filter`.
	 * @param ctx the parse tree
	 */
	exitNamed_filter?: (ctx: Named_filterContext) => void;

	/**
	 * Enter a parse tree produced by `FilterParser.string_operator`.
	 * @param ctx the parse tree
	 */
	enterString_operator?: (ctx: String_operatorContext) => void;
	/**
	 * Exit a parse tree produced by `FilterParser.string_operator`.
	 * @param ctx the parse tree
	 */
	exitString_operator?: (ctx: String_operatorContext) => void;

	/**
	 * Enter a parse tree produced by `FilterParser.numeric_operator`.
	 * @param ctx the parse tree
	 */
	enterNumeric_operator?: (ctx: Numeric_operatorContext) => void;
	/**
	 * Exit a parse tree produced by `FilterParser.numeric_operator`.
	 * @param ctx the parse tree
	 */
	exitNumeric_operator?: (ctx: Numeric_operatorContext) => void;

	/**
	 * Enter a parse tree produced by `FilterParser.equality_operator`.
	 * @param ctx the parse tree
	 */
	enterEquality_operator?: (ctx: Equality_operatorContext) => void;
	/**
	 * Exit a parse tree produced by `FilterParser.equality_operator`.
	 * @param ctx the parse tree
	 */
	exitEquality_operator?: (ctx: Equality_operatorContext) => void;

	/**
	 * Enter a parse tree produced by `FilterParser.comparison_operator`.
	 * @param ctx the parse tree
	 */
	enterComparison_operator?: (ctx: Comparison_operatorContext) => void;
	/**
	 * Exit a parse tree produced by `FilterParser.comparison_operator`.
	 * @param ctx the parse tree
	 */
	exitComparison_operator?: (ctx: Comparison_operatorContext) => void;

	/**
	 * Enter a parse tree produced by `FilterParser.substring_operator`.
	 * @param ctx the parse tree
	 */
	enterSubstring_operator?: (ctx: Substring_operatorContext) => void;
	/**
	 * Exit a parse tree produced by `FilterParser.substring_operator`.
	 * @param ctx the parse tree
	 */
	exitSubstring_operator?: (ctx: Substring_operatorContext) => void;

	/**
	 * Enter a parse tree produced by `FilterParser.operator`.
	 * @param ctx the parse tree
	 */
	enterOperator?: (ctx: OperatorContext) => void;
	/**
	 * Exit a parse tree produced by `FilterParser.operator`.
	 * @param ctx the parse tree
	 */
	exitOperator?: (ctx: OperatorContext) => void;
}

