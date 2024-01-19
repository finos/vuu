package org.finos.vuu.feature.ignite.filter

import org.finos.vuu.grammar.FilterBaseVisitor
import org.finos.vuu.grammar.FilterParser._
import scala.jdk.CollectionConverters._


class IgniteIndexFilterTreeVisitor extends FilterBaseVisitor[IgniteIndexFilterClause] {

  override def visitStart(ctx: StartContext): IgniteIndexFilterClause =
    visitOrExpression(ctx.orExpression())

  override def visitOrExpression(ctx: OrExpressionContext): IgniteIndexFilterClause =
    OrIgniteIndexFilterClause(ctx.andExpression().asScala.map(visit).toList)

  override def visitOperationEq(ctx: OperationEqContext): IgniteIndexFilterClause =
    EqIgniteIndexFilterClause(ctx.ID().getText, ctx.scalar().getText)

}
