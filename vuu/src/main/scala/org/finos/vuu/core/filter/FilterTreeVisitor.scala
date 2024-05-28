package org.finos.vuu.core.filter

import org.finos.vuu.grammar.FilterBaseVisitor
import org.finos.vuu.grammar.FilterParser._
import scala.jdk.CollectionConverters._

class FilterTreeVisitor extends FilterBaseVisitor[FilterClause] {
  override def visitStart(ctx: StartContext): FilterClause =
    visitOrExpression(ctx.orExpression())

  override def visitOrExpression(ctx: OrExpressionContext): FilterClause =
    OrClause(ctx.andExpression().asScala.map(visit).toList)

  override def visitAndExpression(ctx: AndExpressionContext): FilterClause =
    AndClause(ctx.term().asScala.map(visit).toList)

  override def visitSubexpression(ctx: SubexpressionContext): FilterClause =
    visitOrExpression(ctx.orExpression())

  override def visitOperationEq(ctx: OperationEqContext): FilterClause =
    EqualsClause(ctx.ID().getText, ctx.scalar().getText)

  override def visitOperationNeq(ctx: OperationNeqContext): FilterClause =
    NotClause(EqualsClause(ctx.ID().getText, ctx.scalar().getText ))

  override def visitOperationGt(ctx: OperationGtContext): FilterClause =
    GreaterThanClause(ctx.ID().getText, ctx.NUMBER().getText.toDouble)

  override def visitOperationGte(ctx: OperationGteContext): FilterClause = {
    val (field, value) = (ctx.ID().getText, ctx.NUMBER().getText)
    OrClause(List(GreaterThanClause(field, value.toDouble), EqualsClause(field, value)))
  }

  override def visitOperationLt(ctx: OperationLtContext): FilterClause =
    LessThanClause(ctx.ID().getText, ctx.NUMBER().getText.toDouble)

  override def visitOperationLte(ctx: OperationLteContext): FilterClause = {
    val (field, value) = (ctx.ID().getText, ctx.NUMBER().getText)
    OrClause(List(LessThanClause(field, value.toDouble), EqualsClause(field, value)))
  }

  override def visitOperationStarts(ctx: OperationStartsContext): FilterClause =
    StartsClause(ctx.ID().getText, ctx.STRING().getText)

  override def visitOperationEnds(ctx: OperationEndsContext): FilterClause =
    EndsClause(ctx.ID().getText, ctx.STRING().getText)

  override def visitOperationContains(ctx: OperationContainsContext): FilterClause =
    ContainsClause(ctx.ID().getText, ctx.STRING().getText)

  override def visitOperationIn(ctx: OperationInContext): FilterClause = {
    InClause(ctx.ID().getText, FilterTreeVisitor.operationInValues(ctx))
  }
}

object FilterTreeVisitor {
  def operationInValues(ctx: OperationInContext): List[String] = {
    val setElements = Option(ctx.set().NUMBER()) #:: Option(ctx.set().STRING()) #:: LazyList.empty
    setElements
      .flatten
      .flatMap(_.asScala)
      .map(_.getText)
      .toList
  }
}
