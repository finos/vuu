package org.finos.vuu.feature.ignite.filter

import org.finos.vuu.grammar.FilterBaseVisitor
import org.finos.vuu.grammar.FilterParser._
import scala.jdk.CollectionConverters._

class IgniteSqlFilterTreeVisitor extends FilterBaseVisitor[IgniteSqlFilterClause] {

  override def visitStart(ctx: StartContext): IgniteSqlFilterClause =
    visitOrExpression(ctx.orExpression())

  override def visitOrExpression(ctx: OrExpressionContext): IgniteSqlFilterClause =
    OrIgniteSqlFilterClause(ctx.andExpression().asScala.map(visit).toList)

  override def visitOperationEq(ctx: OperationEqContext): IgniteSqlFilterClause =
    EqIgniteSqlFilterClause(ctx.ID().getText, ctx.scalar().getText)

}
