package org.finos.vuu.feature.ignite.filter

import org.finos.vuu.core.filter.FilterTreeVisitor
import org.finos.vuu.grammar.FilterBaseVisitor
import org.finos.vuu.grammar.FilterParser._

import scala.jdk.CollectionConverters._

class IgniteSqlFilterTreeVisitor extends FilterBaseVisitor[IgniteSqlFilterClause] {

  override def visitStart(ctx: StartContext): IgniteSqlFilterClause =
    visitOrExpression(ctx.orExpression())

  override def visitOrExpression(ctx: OrExpressionContext): IgniteSqlFilterClause =
    OrIgniteSqlFilterClause(ctx.andExpression().asScala.map(visit).toList)

  override def visitAndExpression(ctx: AndExpressionContext): IgniteSqlFilterClause =
    AndIgniteSqlFilterClause(ctx.term().asScala.map(visit).toList)

  override def visitSubexpression(ctx: SubexpressionContext): IgniteSqlFilterClause =
    visitOrExpression(ctx.orExpression())

  override def visitOperationEq(ctx: OperationEqContext): IgniteSqlFilterClause =
    EqIgniteSqlFilterClause(ctx.ID().getText, ctx.scalar().getText)

  override def visitOperationNeq(ctx: OperationNeqContext): IgniteSqlFilterClause =
    NeqIgniteSqlFilterClause(ctx.ID().getText, ctx.scalar().getText)

  override def visitOperationGt(ctx: OperationGtContext): IgniteSqlFilterClause =
    RangeIgniteSqlFilterClause(RangeOp.GT)(ctx.ID().getText, ctx.NUMBER().getText)

  override def visitOperationGte(ctx: OperationGteContext): IgniteSqlFilterClause =
    RangeIgniteSqlFilterClause(RangeOp.GTE)(ctx.ID().getText, ctx.NUMBER().getText)

  override def visitOperationLt(ctx: OperationLtContext): IgniteSqlFilterClause =
    RangeIgniteSqlFilterClause(RangeOp.LT)(ctx.ID().getText, ctx.NUMBER().getText)

  override def visitOperationLte(ctx: OperationLteContext): IgniteSqlFilterClause =
    RangeIgniteSqlFilterClause(RangeOp.LTE)(ctx.ID().getText, ctx.NUMBER().getText)

  override def visitOperationStarts(ctx: OperationStartsContext): IgniteSqlFilterClause =
    StartsIgniteSqlFilterClause(ctx.ID().getText, ctx.STRING().getText)

  override def visitOperationEnds(ctx: OperationEndsContext): IgniteSqlFilterClause =
    EndsIgniteSqlFilterClause(ctx.ID().getText, ctx.STRING().getText)

  override def visitOperationIn(ctx: OperationInContext): IgniteSqlFilterClause = {
    InIgniteSqlFilterClause(ctx.ID().getText, FilterTreeVisitor.operationInValues(ctx))
  }
}
