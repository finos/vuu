package org.finos.vuu.plugin.clickhouse.provider.filter

import org.finos.vuu.grammar.FilterBaseVisitor
import org.finos.vuu.grammar.FilterParser.*

import scala.collection.mutable

case class ClickHouseFilterVisitor(remoteNameMapping: Map[String, String],
                                   stringBuilder: java.lang.StringBuilder,
                                   params: mutable.Map[String, Any]
                                  ) extends FilterBaseVisitor[Unit] {

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
    stringBuilder.append(getRemoteId(ctx.ID().getText)).append(" = ")
    appendScalar(ctx.scalar())
  }

  override def visitOperationNeq(ctx: OperationNeqContext): Unit = {
    stringBuilder.append(getRemoteId(ctx.ID().getText)).append(" != ")
    appendScalar(ctx.scalar())
  }

  override def visitOperationGt(ctx: OperationGtContext): Unit =
    stringBuilder.append(getRemoteId(ctx.ID().getText)).append(" > ").append(ctx.NUMBER().getText)

  override def visitOperationGte(ctx: OperationGteContext): Unit =
    stringBuilder.append(getRemoteId(ctx.ID().getText)).append(" >= ").append(ctx.NUMBER().getText)

  override def visitOperationLt(ctx: OperationLtContext): Unit =
    stringBuilder.append(getRemoteId(ctx.ID().getText)).append(" < ").append(ctx.NUMBER().getText)

  override def visitOperationLte(ctx: OperationLteContext): Unit =
    stringBuilder.append(getRemoteId(ctx.ID().getText)).append(" <= ").append(ctx.NUMBER().getText)

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
      stringBuilder.append(id).append(" IN (")
      val it = nums.iterator()
      if (it.hasNext) stringBuilder.append(it.next().getText)
      while (it.hasNext) {
        stringBuilder.append(", ").append(it.next().getText)
      }
      stringBuilder.append(")")
      return
    }

    val strings = setCtx.STRING()
    if (strings != null && !strings.isEmpty) {
      stringBuilder.append(id).append(" IN (")
      val it = strings.iterator()
      if (it.hasNext) {
        stringBuilder.append('\'')
        appendEscaped(it.next().getText)
        stringBuilder.append('\'')
      }
      while (it.hasNext) {
        stringBuilder.append(", '")
        appendEscaped(it.next().getText)
        stringBuilder.append('\'')
      }
      stringBuilder.append(")")
      return
    }

    stringBuilder.append("1 = 0")
  }

  // ------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------

  private def getRemoteId(id: String): String = {
    remoteNameMapping.getOrElse(id,
      throw new IllegalArgumentException(s"Mapping missing for filter column: '$id'"))
  }

  private def joinChildren(children: java.util.List[_ <: org.antlr.v4.runtime.tree.ParseTree], op: String): Unit = {
    val startLen = stringBuilder.length()
    val it = children.iterator()
    var writtenCount = 0

    while (it.hasNext) {
      val marker = stringBuilder.length()

      // Speculatively append the operator if this isn't the first confirmed element
      if (writtenCount > 0) {
        stringBuilder.append(op)
      }

      val childStart = stringBuilder.length()
      visit(it.next())

      if (stringBuilder.length() == childStart) {
        // The child didn't write anything (empty node), roll back the appended operator
        if (writtenCount > 0) {
          stringBuilder.setLength(marker)
        }
      } else {
        writtenCount += 1
      }
    }

    // Wrap in parentheses only if we combined multiple distinct valid criteria
    if (writtenCount > 1) {
      stringBuilder.insert(startLen, '(')
      stringBuilder.append(')')
    }
  }

  private def like(id: String, lit: String, prefix: Boolean, suffix: Boolean): Unit = {
    stringBuilder.append(id).append(" LIKE '")
    if (prefix) stringBuilder.append('%')
    appendEscaped(lit)
    if (suffix) stringBuilder.append('%')
    stringBuilder.append('\'')
  }

  private def appendScalar(scalar: ScalarContext): Unit = {
    val s = scalar.STRING()
    if (s != null) {
      stringBuilder.append('\'')
      appendEscaped(s.getText)
      stringBuilder.append('\'')
    } else {
      stringBuilder.append(scalar.getText)
    }
  }

  private def appendEscaped(s: String): Unit = {
    if (s != null) {
      var i = 0
      val len = s.length
      while (i < len) {
        val c = s.charAt(i)
        if (c == '\'') stringBuilder.append("''")
        else stringBuilder.append(c)
        i += 1
      }
    }
  }
}