package org.finos.vuu.plugin.clickhouse.provider.filter

import org.finos.vuu.grammar.FilterBaseVisitor
import org.finos.vuu.grammar.FilterParser.*
import org.finos.vuu.plugin.virtualized.api.VirtualizedSessionTableColumn

class ClickHouseFilterVisitor(columns: List[VirtualizedSessionTableColumn]) extends FilterBaseVisitor[Unit] {

  private val sb = new java.lang.StringBuilder(256)
  private lazy val remoteMapping: Map[String, String] =
    columns.map(f => f.name -> f.remoteName).toMap

  def getBuffer: java.lang.StringBuilder = sb

  override def visitStart(ctx: StartContext): Unit = {
    visit(ctx.orExpression())
  }

  override def visitOrExpression(ctx: OrExpressionContext): Unit =
    joinChildren(ctx.andExpression(), " OR ")

  override def visitAndExpression(ctx: AndExpressionContext): Unit =
    joinChildren(ctx.term(), " AND ")

  override def visitSubexpression(ctx: SubexpressionContext): Unit =
    visit(ctx.orExpression())

  override def visitOperationEq(ctx: OperationEqContext): Unit = {
    sb.append(getRemoteId(ctx.ID().getText)).append(" = ")
    appendScalar(ctx.scalar())
  }

  override def visitOperationNeq(ctx: OperationNeqContext): Unit = {
    sb.append(getRemoteId(ctx.ID().getText)).append(" != ")
    appendScalar(ctx.scalar())
  }

  override def visitOperationGt(ctx: OperationGtContext): Unit =
    sb.append(getRemoteId(ctx.ID().getText)).append(" > ").append(ctx.NUMBER().getText)

  override def visitOperationGte(ctx: OperationGteContext): Unit =
    sb.append(getRemoteId(ctx.ID().getText)).append(" >= ").append(ctx.NUMBER().getText)

  override def visitOperationLt(ctx: OperationLtContext): Unit =
    sb.append(getRemoteId(ctx.ID().getText)).append(" < ").append(ctx.NUMBER().getText)

  override def visitOperationLte(ctx: OperationLteContext): Unit =
    sb.append(getRemoteId(ctx.ID().getText)).append(" <= ").append(ctx.NUMBER().getText)

  override def visitOperationStarts(ctx: OperationStartsContext): Unit =
    like(getRemoteId(ctx.ID().getText), ctx.STRING().getText, prefix = false, suffix = true)

  override def visitOperationEnds(ctx: OperationEndsContext): Unit =
    like(getRemoteId(ctx.ID().getText), ctx.STRING().getText, prefix = true, suffix = false)

  override def visitOperationContains(ctx: OperationContainsContext): Unit =
    like(getRemoteId(ctx.ID().getText), ctx.STRING().getText, prefix = true, suffix = true)

  override def visitOperationIn(ctx: OperationInContext): Unit = {
    val id = getRemoteId(ctx.ID().getText)
    val setCtx = ctx.set()

    val nums = setCtx.NUMBER()
    if (nums != null && !nums.isEmpty) {
      sb.append(id).append(" IN (")
      val it = nums.iterator()
      if (it.hasNext) sb.append(it.next().getText)
      while (it.hasNext) {
        sb.append(", ").append(it.next().getText)
      }
      sb.append(")")
      return
    }

    val strings = setCtx.STRING()
    if (strings != null && !strings.isEmpty) {
      sb.append(id).append(" IN (")
      val it = strings.iterator()
      if (it.hasNext) {
        sb.append('\'')
        appendEscaped(it.next().getText)
        sb.append('\'')
      }
      while (it.hasNext) {
        sb.append(", '")
        appendEscaped(it.next().getText)
        sb.append('\'')
      }
      sb.append(")")
      return
    }

    sb.append("1 = 0")
  }

  // ------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------

  private def getRemoteId(id: String): String = {
    remoteMapping.getOrElse(id,
      throw new IllegalArgumentException(s"Mapping missing for filter column: '$id'"))
  }

  private def joinChildren(children: java.util.List[_ <: org.antlr.v4.runtime.tree.ParseTree], op: String): Unit = {
    val startLen = sb.length()
    val it = children.iterator()
    var writtenCount = 0

    while (it.hasNext) {
      val marker = sb.length()

      // Speculatively append the operator if this isn't the first confirmed element
      if (writtenCount > 0) {
        sb.append(op)
      }

      val childStart = sb.length()
      visit(it.next())

      if (sb.length() == childStart) {
        // The child didn't write anything (empty node), roll back the appended operator
        if (writtenCount > 0) {
          sb.setLength(marker)
        }
      } else {
        writtenCount += 1
      }
    }

    // Wrap in parentheses only if we combined multiple distinct valid criteria
    if (writtenCount > 1) {
      sb.insert(startLen, '(')
      sb.append(')')
    }
  }

  private def like(id: String, lit: String, prefix: Boolean, suffix: Boolean): Unit = {
    sb.append(id).append(" LIKE '")
    if (prefix) sb.append('%')
    appendEscaped(lit)
    if (suffix) sb.append('%')
    sb.append('\'')
  }

  private def appendScalar(scalar: ScalarContext): Unit = {
    val s = scalar.STRING()
    if (s != null) {
      sb.append('\'')
      appendEscaped(s.getText)
      sb.append('\'')
    } else {
      sb.append(scalar.getText)
    }
  }

  private def appendEscaped(s: String): Unit = {
    if (s != null) {
      var i = 0
      val len = s.length
      while (i < len) {
        val c = s.charAt(i)
        if (c == '\'') sb.append("''")
        else sb.append(c)
        i += 1
      }
    }
  }
}