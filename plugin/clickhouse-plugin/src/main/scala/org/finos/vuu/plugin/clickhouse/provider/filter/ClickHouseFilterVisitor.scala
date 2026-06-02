package org.finos.vuu.plugin.clickhouse.provider.filter

import org.finos.vuu.grammar.FilterBaseVisitor
import org.finos.vuu.grammar.FilterParser.*

class ClickHouseFilterVisitor extends FilterBaseVisitor[String] {

  override def visitStart(ctx: StartContext): String =
    visit(ctx.orExpression())

  override def visitOrExpression(ctx: OrExpressionContext): String =
    joinChildren(ctx.andExpression(), " OR ")

  override def visitAndExpression(ctx: AndExpressionContext): String =
    joinChildren(ctx.term(), " AND ")

  override def visitSubexpression(ctx: SubexpressionContext): String =
    visit(ctx.orExpression())

  override def visitOperationEq(ctx: OperationEqContext): String = {
    val sb = new java.lang.StringBuilder(32)
    sb.append(ctx.ID().getText)
      .append(" = ")
      .append(escapeAndQuote(ctx.scalar()))
    sb.toString
  }

  override def visitOperationNeq(ctx: OperationNeqContext): String = {
    val sb = new java.lang.StringBuilder(32)
    sb.append(ctx.ID().getText)
      .append(" != ")
      .append(escapeAndQuote(ctx.scalar()))
    sb.toString
  }

  override def visitOperationGt(ctx: OperationGtContext): String =
    simpleBinary(ctx.ID().getText, " > ", ctx.NUMBER().getText)

  override def visitOperationGte(ctx: OperationGteContext): String =
    simpleBinary(ctx.ID().getText, " >= ", ctx.NUMBER().getText)

  override def visitOperationLt(ctx: OperationLtContext): String =
    simpleBinary(ctx.ID().getText, " < ", ctx.NUMBER().getText)

  override def visitOperationLte(ctx: OperationLteContext): String =
    simpleBinary(ctx.ID().getText, " <= ", ctx.NUMBER().getText)

  override def visitOperationStarts(ctx: OperationStartsContext): String =
    like(ctx.ID().getText, escape(ctx.STRING().getText), prefix = false, suffix = true)

  override def visitOperationEnds(ctx: OperationEndsContext): String =
    like(ctx.ID().getText, escape(ctx.STRING().getText), prefix = true, suffix = false)

  override def visitOperationContains(ctx: OperationContainsContext): String =
    like(ctx.ID().getText, escape(ctx.STRING().getText), prefix = true, suffix = true)

  override def visitOperationIn(ctx: OperationInContext): String = {
    val id = ctx.ID().getText
    val setCtx = ctx.set()

    val nums = setCtx.NUMBER()
    if (nums != null && !nums.isEmpty) {
      val sb = new java.lang.StringBuilder(32)
      sb.append(id).append(" IN (")
      val it = nums.iterator()
      if (it.hasNext) sb.append(it.next().getText)
      while (it.hasNext) {
        sb.append(", ").append(it.next().getText)
      }
      sb.append(")")
      return sb.toString
    }

    val strs = setCtx.STRING()
    if (strs != null && !strs.isEmpty) {
      val sb = new java.lang.StringBuilder(32)
      sb.append(id).append(" IN (")
      val it = strs.iterator()
      if (it.hasNext) sb.append('\'').append(escape(it.next().getText)).append('\'')
      while (it.hasNext) {
        sb.append(", '").append(escape(it.next().getText)).append('\'')
      }
      sb.append(")")
      return sb.toString
    }

    "1 = 0"
  }

  // ------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------

  private def joinChildren[T](children: java.util.List[_ <: org.antlr.v4.runtime.tree.ParseTree], op: String): String = {
    val it = children.iterator()
    var first: String = null

    // collect first non-empty
    while (it.hasNext && (first eq null)) {
      val v = visit(it.next())
      if (v.nonEmpty) first = v
    }

    if (first eq null) return ""

    // if only one child, return it
    if (!it.hasNext) return first

    val sb = new java.lang.StringBuilder(first.length + 16)
    sb.append('(').append(first)

    while (it.hasNext) {
      val v = visit(it.next())
      if (v.nonEmpty) {
        sb.append(op).append(v)
      }
    }

    sb.append(')')
    sb.toString
  }

  private def simpleBinary(id: String, op: String, value: String): String = {
    val sb = new java.lang.StringBuilder(id.length + op.length + value.length + 2)
    sb.append(id).append(op).append(value)
    sb.toString
  }

  private def like(id: String, lit: String, prefix: Boolean, suffix: Boolean): String = {
    val sb = new java.lang.StringBuilder(32)
    sb.append(id).append(" LIKE '")
    if (prefix) sb.append('%')
    sb.append(lit)
    if (suffix) sb.append('%')
    sb.append('\'')
    sb.toString
  }

  private def escapeAndQuote(scalar: ScalarContext): String = {
    val s = scalar.STRING()
    if (s != null) {
      val lit = escape(s.getText)
      val sb = new java.lang.StringBuilder(lit.length + 2)
      sb.append('\'').append(lit).append('\'')
      sb.toString
    } else {
      scalar.getText
    }
  }

  private def escape(s: String): String =
    if (s == null) "" else s.replace("'", "''")
}
