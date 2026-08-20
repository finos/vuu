package org.finos.vuu.plugin.clickhouse.provider.filter

import org.finos.toolbox.time.TimeUtils.ofEpochNanosecond
import org.finos.vuu.core.table.DataType
import org.finos.vuu.core.table.datatype.Scale.{Eight, Four, Six, Two}
import org.finos.vuu.core.table.datatype.ScaledDecimal
import org.finos.vuu.grammar.FilterBaseVisitor
import org.finos.vuu.grammar.FilterParser.*
import org.finos.vuu.plugin.clickhouse.provider.filter.ClickHouseFilterVisitor.{MILLI_DATE_TIME_FORMATTER, NANO_DATE_TIME_FORMATTER}
import org.finos.vuu.plugin.virtualized.api.VirtualizedSessionTableColumn

import java.time.Instant.ofEpochMilli
import java.time.ZoneOffset
import java.time.format.DateTimeFormatter
import java.util
import scala.collection.mutable

object ClickHouseFilterVisitor {
  val MILLI_DATE_TIME_FORMATTER: DateTimeFormatter = DateTimeFormatter
    .ofPattern("yyyy-MM-dd HH:mm:ss.SSS")
    .withZone(ZoneOffset.UTC)

  val NANO_DATE_TIME_FORMATTER: DateTimeFormatter = DateTimeFormatter
    .ofPattern("yyyy-MM-dd HH:mm:ss.SSSSSSSSS")
    .withZone(ZoneOffset.UTC)
}

case class ClickHouseFilterVisitor(
                                    remoteNameMapping: Map[String, VirtualizedSessionTableColumn],
                                    stringBuilder: java.lang.StringBuilder,
                                    params: mutable.Map[String, Any]
                                  ) extends FilterBaseVisitor[Unit] {

  override def visitStart(ctx: StartContext): Unit =
    visit(ctx.orExpression())

  override def visitOrExpression(ctx: OrExpressionContext): Unit =
    joinChildren(ctx.andExpression(), " OR ")

  override def visitAndExpression(ctx: AndExpressionContext): Unit =
    joinChildren(ctx.term(), " AND ")

  override def visitSubexpression(ctx: SubexpressionContext): Unit =
    visit(ctx.orExpression())

  override def visitOperationEq(ctx: OperationEqContext): Unit =
    visitBinary(ctx.ID().getText, " = ", ctx.scalar().getText)

  override def visitOperationNeq(ctx: OperationNeqContext): Unit =
    visitBinary(ctx.ID().getText, " != ", ctx.scalar().getText)

  override def visitOperationGt(ctx: OperationGtContext): Unit =
    visitBinary(ctx.ID().getText, " > ", ctx.NUMBER().getText)

  override def visitOperationGte(ctx: OperationGteContext): Unit =
    visitBinary(ctx.ID().getText, " >= ", ctx.NUMBER().getText)

  override def visitOperationLt(ctx: OperationLtContext): Unit =
    visitBinary(ctx.ID().getText, " < ", ctx.NUMBER().getText)

  override def visitOperationLte(ctx: OperationLteContext): Unit =
    visitBinary(ctx.ID().getText, " <= ", ctx.NUMBER().getText)

  override def visitOperationStarts(ctx: OperationStartsContext): Unit = {
    val remoteColumn = getRemoteColumn(ctx.ID().getText)
    stringBuilder.append("startsWith(").append(remoteColumn.remoteName).append(", ")
    appendScalarParam(remoteColumn, ctx.STRING().getText)
    stringBuilder.append(')')
  }

  override def visitOperationEnds(ctx: OperationEndsContext): Unit = {
    val remoteColumn = getRemoteColumn(ctx.ID().getText)
    stringBuilder.append("endsWith(").append(remoteColumn.remoteName).append(", ")
    appendScalarParam(remoteColumn, ctx.STRING().getText)
    stringBuilder.append(')')
  }

  override def visitOperationContains(ctx: OperationContainsContext): Unit = {
    val remoteColumn = getRemoteColumn(ctx.ID().getText)
    stringBuilder.append(remoteColumn.remoteName).append(" LIKE ")
    val rawText = ctx.STRING().getText
    val containsVal = new java.lang.StringBuilder(rawText.length + 2).append('%').append(rawText).append('%').toString
    appendScalarParam(remoteColumn, containsVal)
  }

  override def visitOperationIn(ctx: OperationInContext): Unit = {
    val remoteColumn = getRemoteColumn(ctx.ID().getText)
    stringBuilder.append(remoteColumn.remoteName).append(" IN ")

    val setCtx = ctx.set()
    val stringTokens = setCtx.STRING()
    val tokens = if (stringTokens != null && !stringTokens.isEmpty) stringTokens else setCtx.NUMBER()

    val n = tokens.size()
    val paramValues = new util.ArrayList[Any](n)
    var i = 0
    while (i < n) {
      paramValues.add(parseArrayElement(remoteColumn.dataType, tokens.get(i).getText))
      i += 1
    }

    val paramName = s"p_${params.size}"
    params.put(paramName, paramValues)

    stringBuilder
      .append("{")
      .append(paramName)
      .append(":Array(")
      .append(getClickHouseType(remoteColumn.dataType))
      .append(")}")
  }

  // ------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------

  private inline def visitBinary(id: String, op: String, value: String): Unit = {
    val remoteColumn = getRemoteColumn(id)
    stringBuilder.append(remoteColumn.remoteName).append(op)
    appendScalarParam(remoteColumn, value)
  }

  private inline def getRemoteColumn(id: String): VirtualizedSessionTableColumn =
    remoteNameMapping.getOrElse(id,
      throw new IllegalArgumentException(s"Mapping missing for filter column: '$id'"))

  private def joinChildren(children: java.util.List[? <: org.antlr.v4.runtime.tree.ParseTree], op: String): Unit = {
    val startLen = stringBuilder.length()
    val it = children.iterator()
    var writtenCount = 0

    while (it.hasNext) {
      val marker = stringBuilder.length()
      if (writtenCount > 0) stringBuilder.append(op)

      val childStart = stringBuilder.length()
      visit(it.next())

      if (stringBuilder.length() == childStart) {
        if (writtenCount > 0) stringBuilder.setLength(marker)
      } else {
        writtenCount += 1
      }
    }

    if (writtenCount > 1) {
      stringBuilder.insert(startLen, '(')
      stringBuilder.append(')')
    }
  }

  private def appendScalarParam(column: VirtualizedSessionTableColumn, paramValue: String): Unit = {
    val paramName = s"p_${params.size}"
    params.put(paramName, parseScalarValue(column.dataType, paramValue))

    stringBuilder
      .append('{')
      .append(paramName)
      .append(':')
      .append(getClickHouseType(column.dataType))
      .append('}')
  }

  private def getClickHouseType(dataType: Class[?]): String = dataType match {
    case DataType.StringDataType | DataType.CharDataType => "String"
    case DataType.IntegerDataType => "Int32"
    case DataType.LongDataType |
         DataType.ScaledDecimal2Type | DataType.ScaledDecimal4Type |
         DataType.ScaledDecimal6Type | DataType.ScaledDecimal8Type => "Int64"
    case DataType.DoubleDataType => "Float64"
    case DataType.BooleanDataType => "Bool"
    case DataType.EpochTimestampType |
         DataType.EpochTimestampNanoType => "DateTime64"
    case _ => throw new IllegalArgumentException(s"Unable to handle column dataType: '$dataType'")
  }

  private def parseScalarValue(dataType: Class[?], value: String): Any = dataType match {
    case DataType.StringDataType => value
    case DataType.CharDataType => java.lang.String.valueOf(value.charAt(0))
    case DataType.IntegerDataType => value.toInt
    case DataType.LongDataType => value.toLong
    case DataType.DoubleDataType => value.toDouble
    case DataType.BooleanDataType => value.toBoolean
    case DataType.EpochTimestampType => ofEpochMilli(value.toLong)
    case DataType.EpochTimestampNanoType => ofEpochNanosecond(value.toLong)
    case DataType.ScaledDecimal2Type => ScaledDecimal(value, Two).scaledValue
    case DataType.ScaledDecimal4Type => ScaledDecimal(value, Four).scaledValue
    case DataType.ScaledDecimal6Type => ScaledDecimal(value, Six).scaledValue
    case DataType.ScaledDecimal8Type => ScaledDecimal(value, Eight).scaledValue
    case _ => throw new IllegalArgumentException(s"Unable to handle column dataType: '$dataType'")
  }

  private def parseArrayElement(dataType: Class[?], value: String): Any = dataType match {
    case DataType.StringDataType => s"'$value'"
    case DataType.CharDataType => s"'${value.charAt(0)}'"
    case DataType.IntegerDataType => value.toInt
    case DataType.LongDataType => value.toLong
    case DataType.DoubleDataType => value.toDouble
    case DataType.BooleanDataType => value.toBoolean
    case DataType.EpochTimestampType => s"'${MILLI_DATE_TIME_FORMATTER.format(ofEpochMilli(value.toLong))}'"
    case DataType.EpochTimestampNanoType => s"'${NANO_DATE_TIME_FORMATTER.format(ofEpochNanosecond(value.toLong))}'"
    case DataType.ScaledDecimal2Type => ScaledDecimal(value, Two).scaledValue
    case DataType.ScaledDecimal4Type => ScaledDecimal(value, Four).scaledValue
    case DataType.ScaledDecimal6Type => ScaledDecimal(value, Six).scaledValue
    case DataType.ScaledDecimal8Type => ScaledDecimal(value, Eight).scaledValue
    case _ => throw new IllegalArgumentException(s"Unable to handle column dataType: '$dataType'")
  }
}