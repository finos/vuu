package org.finos.vuu.plugin.clickhouse.provider.filter

import org.finos.toolbox.time.TimeUtils.ofEpochNanosecond
import org.finos.vuu.core.table.DataType
import org.finos.vuu.core.table.datatype.Scale.{Eight, Four, Six, Two}
import org.finos.vuu.core.table.datatype.ScaledDecimal
import org.finos.vuu.grammar.FilterBaseVisitor
import org.finos.vuu.grammar.FilterParser.*
import org.finos.vuu.plugin.clickhouse.provider.filter.ClickHouseFilterVisitor.DATE_TIME_FORMATTER
import org.finos.vuu.plugin.virtualized.api.VirtualizedSessionTableColumn

import java.time.Instant.ofEpochMilli
import java.time.ZoneOffset
import java.time.format.DateTimeFormatter
import java.util
import scala.collection.mutable

object ClickHouseFilterVisitor {

  val DATE_TIME_FORMATTER: DateTimeFormatter = DateTimeFormatter
    .ofPattern("yyyy-MM-dd HH:mm:ss.SSSSSSSSS")
    .withZone(ZoneOffset.UTC)

}

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
    appendScalarParam(remoteColumn, ctx.scalar().getText)
  }

  override def visitOperationNeq(ctx: OperationNeqContext): Unit = {
    val remoteColumn = getRemoteColumn(ctx.ID().getText)
    stringBuilder.append(remoteColumn.remoteName).append(" != ")
    appendScalarParam(remoteColumn, ctx.scalar().getText)
  }

  override def visitOperationGt(ctx: OperationGtContext): Unit = {
    val remoteColumn = getRemoteColumn(ctx.ID().getText)
    stringBuilder.append(remoteColumn.remoteName).append(" > ")
    appendScalarParam(remoteColumn, ctx.NUMBER().getText)
  }

  override def visitOperationGte(ctx: OperationGteContext): Unit = {
    val remoteColumn = getRemoteColumn(ctx.ID().getText)
    stringBuilder.append(remoteColumn.remoteName).append(" >= ")
    appendScalarParam(remoteColumn, ctx.NUMBER().getText)
  }

  override def visitOperationLt(ctx: OperationLtContext): Unit = {
    val remoteColumn = getRemoteColumn(ctx.ID().getText)
    stringBuilder.append(remoteColumn.remoteName).append(" < ")
    appendScalarParam(remoteColumn, ctx.NUMBER().getText)
  }

  override def visitOperationLte(ctx: OperationLteContext): Unit = {
    val remoteColumn = getRemoteColumn(ctx.ID().getText)
    stringBuilder.append(remoteColumn.remoteName).append(" <= ")
    appendScalarParam(remoteColumn, ctx.NUMBER().getText)
  }

  override def visitOperationStarts(ctx: OperationStartsContext): Unit = {
    val remoteColumn = getRemoteColumn(ctx.ID().getText)
    stringBuilder.append("startsWith(").append(remoteColumn.remoteName).append(", ")
    appendScalarParam(remoteColumn, ctx.STRING().getText)
    stringBuilder.append(")")
  }

  override def visitOperationEnds(ctx: OperationEndsContext): Unit = {
    val remoteColumn = getRemoteColumn(ctx.ID().getText)
    stringBuilder.append("endsWith(").append(remoteColumn.remoteName).append(", ")
    appendScalarParam(remoteColumn, ctx.STRING().getText)
    stringBuilder.append(")")
  }

  override def visitOperationContains(ctx: OperationContainsContext): Unit = {
    val remoteColumn = getRemoteColumn(ctx.ID().getText)
    stringBuilder.append(remoteColumn.remoteName).append(" LIKE ")
    appendScalarParam(remoteColumn, s"%${ctx.STRING().getText}%")
  }

  override def visitOperationIn(ctx: OperationInContext): Unit = {
    val remoteColumn = getRemoteColumn(ctx.ID().getText)
    stringBuilder.append(remoteColumn.remoteName).append(" IN ")

    val stringTokens = ctx.set().STRING()
    val tokens = if (stringTokens != null && !stringTokens.isEmpty) {
      stringTokens
    } else {
      ctx.set().NUMBER()
    }

    val n = tokens.size()
    val params = new util.ArrayList[String](n)
    var i = 0
    while (i < n) {
      params.add(tokens.get(i).getText)
      i += 1
    }

    appendParamArray(remoteColumn, params)
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

  private def appendScalarParam(column: VirtualizedSessionTableColumn,
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

  private def appendParamArray(column: VirtualizedSessionTableColumn,
                               paramValues: java.util.List[String]): Unit = {
    val paramName = s"p_${params.size}"

    stringBuilder.append("{")
    stringBuilder.append(paramName)
    stringBuilder.append(":Array(")

    column.dataType match {
      case DataType.StringDataType =>
        params.put(paramName, paramValues.stream()
          .map(f => s"'$f'")
          .collect(java.util.stream.Collectors.toList()))
        stringBuilder.append("String")
      case DataType.CharDataType =>
        params.put(paramName, paramValues.stream()
          .map(f => s"'${f.charAt(0)}'")
          .collect(java.util.stream.Collectors.toList()))
        stringBuilder.append("String")
      case DataType.IntegerDataType =>
        params.put(paramName, paramValues.stream()
          .map(f => f.toInt)
          .collect(java.util.stream.Collectors.toList()))
        stringBuilder.append("Int32")
      case DataType.LongDataType =>
        params.put(paramName, paramValues.stream()
          .map(f => f.toLong)
          .collect(java.util.stream.Collectors.toList()))
        stringBuilder.append("Int64")
      case DataType.DoubleDataType =>
        params.put(paramName, paramValues.stream()
          .map(f => f.toDouble)
          .collect(java.util.stream.Collectors.toList()))
        stringBuilder.append("Float64")
      case DataType.BooleanDataType =>
        params.put(paramName, paramValues.stream()
          .map(f => f.toBoolean)
          .collect(java.util.stream.Collectors.toList()))
        stringBuilder.append("Bool")
      case DataType.EpochTimestampType =>
        params.put(paramName, paramValues.stream()
          .map(f => s"'${DATE_TIME_FORMATTER.format(ofEpochMilli(f.toLong))}'")
          .collect(java.util.stream.Collectors.toList()))
        stringBuilder.append("DateTime64")
      case DataType.EpochTimestampNanoType =>
        params.put(paramName, paramValues.stream()
          .map(f => s"'${DATE_TIME_FORMATTER.format(ofEpochNanosecond(f.toLong))}'")
          .collect(java.util.stream.Collectors.toList()))
        stringBuilder.append("DateTime64")
      case DataType.ScaledDecimal2Type =>
        params.put(paramName, paramValues.stream()
          .map(f => ScaledDecimal(f, Two).scaledValue)
          .collect(java.util.stream.Collectors.toList()))
        stringBuilder.append("Int64")
      case DataType.ScaledDecimal4Type =>
        params.put(paramName, paramValues.stream()
          .map(f => ScaledDecimal(f, Four).scaledValue)
          .collect(java.util.stream.Collectors.toList()))
        stringBuilder.append("Int64")
      case DataType.ScaledDecimal6Type =>
        params.put(paramName, paramValues.stream()
          .map(f => ScaledDecimal(f, Six).scaledValue)
          .collect(java.util.stream.Collectors.toList()))
        stringBuilder.append("Int64")
      case DataType.ScaledDecimal8Type =>
        params.put(paramName, paramValues.stream()
          .map(f => ScaledDecimal(f, Eight).scaledValue)
          .collect(java.util.stream.Collectors.toList()))
        stringBuilder.append("Int64")
      case _ =>
        throw new IllegalArgumentException(s"Unable to handle column dataType: '${column.dataType}'")
    }

    stringBuilder.append(")}")
  }

}