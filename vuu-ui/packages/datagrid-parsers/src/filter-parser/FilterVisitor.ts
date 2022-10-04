import { Token } from 'antlr4ts/Token';
import { AbstractParseTreeVisitor } from 'antlr4ts/tree/AbstractParseTreeVisitor';
import {
  And_expressionContext,
  As_clauseContext,
  AtomContext,
  AtomsContext,
  Col_set_expressionContext,
  Col_val_expressionContext,
  ColumnContext,
  ExpressionContext,
  FilternameContext,
  FilterParser,
  OperatorContext,
  Or_expressionContext,
  TermContext
} from '../../generated/parsers/filter/FilterParser';
import { TerminalNode } from 'antlr4ts/tree';

// This class defines a complete generic visitor for a parse tree produced by FilterParser.

export type ParsedFilter = [
  {
    column?: string;
    op: 'and' | 'or' | 'in' | '>' | '=' | 'starts' | '!=';
    value?: 'string';
    filters?: ParsedFilter[];
    label?: string;
    pos?: number;
    tokenPosition?: {
      column?: number;
      name?: number;
    };
  }
];

const EMPTY = [] as const;
type Empty = typeof EMPTY;

export default class FilterVisitor extends AbstractParseTreeVisitor<ParsedFilter> {
  defaultResult() {
    return [];
  }

  aggregateResult(aggregate, nextResult) {
    return aggregate.concat(nextResult);
  }

  // Visit a parse tree produced by FilterParser#expression.
  visitExpression(ctx: ExpressionContext) {
    const [expression, label] = this.visitChildren(ctx);
    // we don't need the braces, but until we change downstream code ...
    // const expression = this.visitChildren(ctx)?.map(withLiterals(ctx));

    if (label) {
      const {
        name,
        tokenPosition: { name: namePos }
      } = label;
      const { tokenPosition, ...rest } = expression;
      return [
        {
          ...rest,
          label: name,
          tokenPosition: {
            ...tokenPosition,
            name: namePos
          }
        }
      ];
    } else if (expression) {
      return [expression];
    } else {
      return [];
    }
  }

  // Visit a parse tree produced by FilterParser#or_expression.
  visitOr_expression(ctx: Or_expressionContext) {
    const [term1, op, term2] = this.visitChildren(ctx);
    if (term2) {
      return { op, filters: [term1, term2] };
    } else {
      return term1;
    }
  }

  // Visit a parse tree produced by FilterParser#and_expression.
  visitAnd_expression(ctx: And_expressionContext) {
    const [term1, op, term2] = this.visitChildren(ctx);
    if (term2) {
      return { op, filters: [term1, term2] };
    } else {
      return term1;
    }
  }

  // Visit a parse tree produced by FilterParser#term.
  visitTerm(ctx: TermContext) {
    return this.visitChildren(ctx);
  }

  visitAs_clause(ctx: As_clauseContext) {
    const [result] = this.visitChildren(ctx);
    if (result) {
      const { name, pos } = result;
      console.log({ name });
      return { name, tokenPosition: { name: pos } };
    } else {
      return EMPTY;
    }
  }

  visitFiltername(ctx: FilternameContext) {
    if (ctx.text === '<missing ID>') {
      return EMPTY;
    } else {
      return { name: ctx.text, pos: ctx.start.start };
    }
  }

  visitNamed_filter(ctx) {
    const [, name] = this.visitChildren(ctx);
    if (name) {
      return { name };
    } else {
      return EMPTY;
    }
  }

  /**
   * Visit a parse tree produced by `FilterParser.col_set_expression`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitCol_set_expression(ctx: Col_set_expressionContext) {
    const [{ column, pos }, op, ...values] = this.visitChildren(ctx);
    return { column, op, values, pos, tokenPosition: { column: pos } };
  }

  /**
   * Visit a parse tree produced by `FilterParser.col_val_expression`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitCol_val_expression(ctx: Col_val_expressionContext) {
    const [{ column, pos }, op, value] = this.visitChildren(ctx);
    // tokenPosition is used in UI to apply special treatment to specific token types, see ui-tokens.js
    return { column, op, value, tokenPosition: { column: pos } };
  }

  // Visit a parse tree produced by FilterParser#column.
  visitString_column(ctx) {
    return { column: ctx.text, pos: ctx.start.start };
  }
  visitNumeric_column(ctx) {
    return { column: ctx.text, pos: ctx.start.start };
  }
  visitColumn(ctx: ColumnContext) {
    return { column: ctx.text, pos: ctx.start.start };
  }

  visitAtoms(ctx: AtomsContext) {
    const results = this.visitChildren(ctx);
    return results.filter((r) => r !== ',');
  }

  visitAtom(ctx: AtomContext) {
    const [result] = this.visitChildren(ctx);
    return result;
  }

  visitOperator(ctx: OperatorContext) {
    return ctx.text;
  }

  // Note this only evet gets invoked for EOF
  visitTerminal(ctx: TerminalNode): string | Empty {
    switch (ctx.symbol.type) {
      case FilterParser.STRING:
        return ctx.text.slice(1, -1);
      case Token.EOF:
      case FilterParser.LBRACK:
      case FilterParser.RBRACK:
      case FilterParser.AS:
        return EMPTY;
      default:
        return ctx.text;
    }
  }
}
