package org.finos.vuu.plugin.clickhouse.provider.filter

import org.finos.toolbox.time.TimeUtils.ofEpochNanosecond
import org.finos.vuu.core.table.DataType
import org.finos.vuu.core.table.datatype.Scale.{Eight, Four, Six, Two}
import org.finos.vuu.core.table.datatype.ScaledDecimal
import org.finos.vuu.grammar.FilterBaseVisitor
import org.finos.vuu.grammar.FilterParser.*
import org.finos.vuu.plugin.virtualized.api.VirtualizedSessionTableColumn

import java.time.Instant.ofEpochMilli
import scala.collection.mutable

case class ClickHouseFilterVisitor(remoteNameMapping: Map[String, VirtualizedSessionTableColumn],
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
    val remoteColumn = getRemoteColumn(ctx.ID().getText)
    stringBuilder.append(remoteColumn.remoteName).append(" = ")
    appendParam(remoteColumn, ctx.scalar().getText)
  }

  override def visitOperationNeq(ctx: OperationNeqContext): Unit = {
    val remoteColumn = getRemoteColumn(ctx.ID().getText)
    stringBuilder.append(remoteColumn.remoteName).append(" != ")
    appendParam(remoteColumn, ctx.scalar().getText)
  }

  override def visitOperationGt(ctx: OperationGtContext): Unit = {
    val remoteColumn = getRemoteColumn(ctx.ID().getText)
    stringBuilder.append(remoteColumn.remoteName).append(" > ")
    appendParam(remoteColumn, ctx.NUMBER().getText)
  }

  override def visitOperationGte(ctx: OperationGteContext): Unit = {
    val remoteColumn = getRemoteColumn(ctx.ID().getText)
    stringBuilder.append(remoteColumn.remoteName).append(" >= ")
    appendParam(remoteColumn, ctx.NUMBER().getText)
  }

  override def visitOperationLt(ctx: OperationLtContext): Unit = {
    val remoteColumn = getRemoteColumn(ctx.ID().getText)
    stringBuilder.append(remoteColumn.remoteName).append(" < ")
    appendParam(remoteColumn, ctx.NUMBER().getText)
  }

  override def visitOperationLte(ctx: OperationLteContext): Unit = {
    val remoteColumn = getRemoteColumn(ctx.ID().getText)
    stringBuilder.append(remoteColumn.remoteName).append(" <= ")
    appendParam(remoteColumn, ctx.NUMBER().getText)
  }

  override def visitOperationStarts(ctx: OperationStartsContext): Unit = {
    val remoteColumn = getRemoteColumn(ctx.ID().getText)
    like(remoteColumn.remoteName, ctx.STRING().getText, prefix = false, suffix = true)
  }

  override def visitOperationEnds(ctx: OperationEndsContext): Unit = {
    val remoteColumn = getRemoteColumn(ctx.ID().getText)
    like(remoteColumn.remoteName, ctx.STRING().getText, prefix = true, suffix = false)
  }

  override def visitOperationContains(ctx: OperationContainsContext): Unit = {
    val remoteColumn = getRemoteColumn(ctx.ID().getText)
    like(remoteColumn.remoteName, ctx.STRING().getText, prefix = true, suffix = true)
  }

  override def visitOperationIn(ctx: OperationInContext): Unit = {
    //TODO
  }

  // ------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------

  private def getRemoteColumn(id: String): VirtualizedSessionTableColumn = {
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
    //TODO
    if (suffix) stringBuilder.append('%')
    stringBuilder.append('\'')
  }

  private def appendParam(column: VirtualizedSessionTableColumn,
                          paramValue: String): Unit = {
    val paramName = s"p_${params.size}"

    stringBuilder.append("{")
    stringBuilder.append(paramName)
    stringBuilder.append(":")

    column.dataType match {
      case DataType.StringDataType =>
        params.put(paramName, paramValue)
        stringBuilder.append("String")
      case DataType.CharDataType =>
        params.put(paramName, String.valueOf(paramValue.charAt(0)))
        stringBuilder.append("String")
      case DataType.IntegerDataType =>
        params.put(paramName, paramValue.toInt)
        stringBuilder.append("Int32")
      case DataType.LongDataType =>
        params.put(paramName, paramValue.toLong)
        stringBuilder.append("Int64")
      case DataType.DoubleDataType =>
        params.put(paramName, paramValue.toDouble)
        stringBuilder.append("Float64")
      case DataType.BooleanDataType =>
        params.put(paramName, paramValue.toBoolean)
        stringBuilder.append("Bool")
      case DataType.EpochTimestampType =>
        params.put(paramName, ofEpochMilli(paramValue.toLong))
        stringBuilder.append("DateTime64")
      case DataType.EpochTimestampNanoType =>
        params.put(paramName, ofEpochNanosecond(paramValue.toLong))
        stringBuilder.append("DateTime64")
      case DataType.ScaledDecimal2Type =>
        params.put(paramName, ScaledDecimal(paramValue, Two).scaledValue)
        stringBuilder.append("Int64")
      case DataType.ScaledDecimal4Type =>
        params.put(paramName, ScaledDecimal(paramValue, Four).scaledValue)
        stringBuilder.append("Int64")
      case DataType.ScaledDecimal6Type =>
        params.put(paramName, ScaledDecimal(paramValue, Six).scaledValue)
        stringBuilder.append("Int64")
      case DataType.ScaledDecimal8Type =>
        params.put(paramName, ScaledDecimal(paramValue, Eight).scaledValue)
        stringBuilder.append("Int64")
      case _ =>
        throw new IllegalArgumentException(s"Unable to handle column dataType: '${column.dataType}'")
    }

    stringBuilder.append("}")
  }

}