package org.finos.vuu.feature.ignite.filter

import org.finos.vuu.grammar.FilterBaseVisitor
import org.finos.vuu.grammar.FilterParser._
import scala.jdk.CollectionConverters._


class IgniteFilterTreeVisitor extends FilterBaseVisitor[IgniteFilterClause] {

  override def visitStart(ctx: StartContext): IgniteFilterClause =
    visitOrExpression(ctx.orExpression())

  override def visitOrExpression(ctx: OrExpressionContext): IgniteFilterClause =
    OrIgniteFilterClause(ctx.andExpression().asScala.map(visit).toList)

  override def visitOperationEq(ctx: OperationEqContext): IgniteFilterClause =
    EqIgniteFilterClause(ctx.ID().getText, ctx.scalar().getText)

}
