// Generated from ./src/grammars/Filter.g4 by ANTLR 4.9.0-SNAPSHOT


import { ParseTreeVisitor } from "antlr4ts/tree/ParseTreeVisitor";

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
 * This interface defines a complete generic visitor for a parse tree produced
 * by `FilterParser`.
 *
 * @param <Result> The return type of the visit operation. Use `void` for
 * operations with no return type.
 */
export interface FilterVisitor<Result> extends ParseTreeVisitor<Result> {
	/**
	 * Visit a parse tree produced by `FilterParser.expression`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitExpression?: (ctx: ExpressionContext) => Result;

	/**
	 * Visit a parse tree produced by `FilterParser.or_expression`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitOr_expression?: (ctx: Or_expressionContext) => Result;

	/**
	 * Visit a parse tree produced by `FilterParser.and_expression`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitAnd_expression?: (ctx: And_expressionContext) => Result;

	/**
	 * Visit a parse tree produced by `FilterParser.as_clause`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitAs_clause?: (ctx: As_clauseContext) => Result;

	/**
	 * Visit a parse tree produced by `FilterParser.term`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitTerm?: (ctx: TermContext) => Result;

	/**
	 * Visit a parse tree produced by `FilterParser.col_set_expression`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitCol_set_expression?: (ctx: Col_set_expressionContext) => Result;

	/**
	 * Visit a parse tree produced by `FilterParser.col_val_expression`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitCol_val_expression?: (ctx: Col_val_expressionContext) => Result;

	/**
	 * Visit a parse tree produced by `FilterParser.numeric_col_val_expression`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitNumeric_col_val_expression?: (ctx: Numeric_col_val_expressionContext) => Result;

	/**
	 * Visit a parse tree produced by `FilterParser.string_col_val_expression`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitString_col_val_expression?: (ctx: String_col_val_expressionContext) => Result;

	/**
	 * Visit a parse tree produced by `FilterParser.default_col_val_expression`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitDefault_col_val_expression?: (ctx: Default_col_val_expressionContext) => Result;

	/**
	 * Visit a parse tree produced by `FilterParser.atoms`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitAtoms?: (ctx: AtomsContext) => Result;

	/**
	 * Visit a parse tree produced by `FilterParser.atom`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitAtom?: (ctx: AtomContext) => Result;

	/**
	 * Visit a parse tree produced by `FilterParser.numeric_column`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitNumeric_column?: (ctx: Numeric_columnContext) => Result;

	/**
	 * Visit a parse tree produced by `FilterParser.string_column`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitString_column?: (ctx: String_columnContext) => Result;

	/**
	 * Visit a parse tree produced by `FilterParser.column`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitColumn?: (ctx: ColumnContext) => Result;

	/**
	 * Visit a parse tree produced by `FilterParser.filtername`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitFiltername?: (ctx: FilternameContext) => Result;

	/**
	 * Visit a parse tree produced by `FilterParser.named_filter`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitNamed_filter?: (ctx: Named_filterContext) => Result;

	/**
	 * Visit a parse tree produced by `FilterParser.string_operator`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitString_operator?: (ctx: String_operatorContext) => Result;

	/**
	 * Visit a parse tree produced by `FilterParser.numeric_operator`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitNumeric_operator?: (ctx: Numeric_operatorContext) => Result;

	/**
	 * Visit a parse tree produced by `FilterParser.equality_operator`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitEquality_operator?: (ctx: Equality_operatorContext) => Result;

	/**
	 * Visit a parse tree produced by `FilterParser.comparison_operator`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitComparison_operator?: (ctx: Comparison_operatorContext) => Result;

	/**
	 * Visit a parse tree produced by `FilterParser.substring_operator`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitSubstring_operator?: (ctx: Substring_operatorContext) => Result;

	/**
	 * Visit a parse tree produced by `FilterParser.operator`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitOperator?: (ctx: OperatorContext) => Result;
}

