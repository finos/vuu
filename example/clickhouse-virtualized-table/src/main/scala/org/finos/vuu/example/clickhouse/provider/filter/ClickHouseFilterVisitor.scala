package org.finos.vuu.example.clickhouse.provider.filter

import org.finos.vuu.grammar.FilterBaseVisitor
import org.finos.vuu.grammar.FilterParser.*

import scala.jdk.CollectionConverters.*

class ClickHouseFilterVisitor extends FilterBaseVisitor[String] {
  override def visitStart(ctx: StartContext): String =
    visitOrExpression(ctx.orExpression())

  override def visitOrExpression(ctx: OrExpressionContext): String = {
    val children = ctx.andExpression().asScala.map(visit).filter(_.nonEmpty).toList
    if (children.isEmpty) ""
    else if (children.size == 1) children.head
    else "(" + children.mkString(" OR ") + ")"
  }

  override def visitAndExpression(ctx: AndExpressionContext): String = {
    val children = ctx.term().asScala.map(visit).filter(_.nonEmpty).toList
    if (children.isEmpty) ""
    else if (children.size == 1) children.head
    else "(" + children.mkString(" AND ") + ")"
  }

  override def visitSubexpression(ctx: SubexpressionContext): String =
    visitOrExpression(ctx.orExpression())

  override def visitOperationEq(ctx: OperationEqContext): String = {
    val id = ctx.ID().getText
    val value = escapeAndQuote(ctx.scalar())
    s"$id = $value"
  }

  override def visitOperationNeq(ctx: OperationNeqContext): String = {
    val id = ctx.ID().getText
    val value = escapeAndQuote(ctx.scalar())
    s"$id != $value"
  }

  override def visitOperationGt(ctx: OperationGtContext): String = {
    val id = ctx.ID().getText
    val value = ctx.NUMBER().getText
    s"$id > $value"
  }

  override def visitOperationGte(ctx: OperationGteContext): String = {
    val id = ctx.ID().getText
    val value = ctx.NUMBER().getText
    s"$id >= $value"
  }

  override def visitOperationLt(ctx: OperationLtContext): String = {
    val id = ctx.ID().getText
    val value = ctx.NUMBER().getText
    s"$id < $value"
  }

  override def visitOperationLte(ctx: OperationLteContext): String = {
    val id = ctx.ID().getText
    val value = ctx.NUMBER().getText
    s"$id <= $value"
  }

  override def visitOperationStarts(ctx: OperationStartsContext): String = {
    val id = ctx.ID().getText
    val literal = ctx.STRING().getText
    s"$id LIKE '${escape(literal)}%'"
  }

  override def visitOperationEnds(ctx: OperationEndsContext): String = {
    val id = ctx.ID().getText
    val literal = ctx.STRING().getText
    s"$id LIKE '%${escape(literal)}'"
  }

  override def visitOperationContains(ctx: OperationContainsContext): String = {
    val id = ctx.ID().getText
    val literal = ctx.STRING().getText
    s"$id LIKE '%${escape(literal)}%'"
  }

  override def visitOperationIn(ctx: OperationInContext): String = {
    val id = ctx.ID().getText
    val setCtx = ctx.set()
    if (setCtx.NUMBER() != null && !setCtx.NUMBER().isEmpty) {
      val values = setCtx.NUMBER().asScala.map(_.getText).mkString(", ")
      s"$id IN ($values)"
    } else if (setCtx.STRING() != null && !setCtx.STRING().isEmpty) {
      val values = setCtx.STRING().asScala.map(node => s"'${escape(node.getText)}'").mkString(", ")
      s"$id IN ($values)"
    } else {
      "1 = 0"
    }
  }

  private def escapeAndQuote(scalar: ScalarContext): String = {
    if (scalar.STRING() != null) {
      s"'${escape(scalar.STRING().getText)}'"
    } else {
      scalar.getText
    }
  }

  private def escape(s: String): String = {
    if (s == null) "" else s.replace("'", "''")
  }
}
