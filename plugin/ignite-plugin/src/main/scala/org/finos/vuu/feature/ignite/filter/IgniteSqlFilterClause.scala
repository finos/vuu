package org.finos.vuu.feature.ignite.filter

import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.feature.ignite.IgniteSqlQuery
import org.finos.vuu.feature.ignite.IgniteSqlQuery.QuerySeparator
import org.finos.vuu.feature.ignite.filter.EqIgniteSqlFilterClause.eqSqlQuery
import org.finos.vuu.feature.ignite.filter.FilterColumnValueParser.{ParsedResult, STRING_DATA_TYPE}
import org.finos.vuu.util.schema.{SchemaField, SchemaMapper}

trait IgniteSqlFilterClause {
  def toSql(schemaMapper: SchemaMapper): IgniteSqlQuery
}

case class OrIgniteSqlFilterClause(clauses:List[IgniteSqlFilterClause]) extends IgniteSqlFilterClause {
  override def toSql(schemaMapper: SchemaMapper): IgniteSqlQuery = {
    val queries = clauses.map(_.toSql(schemaMapper))
    joinNonEmptyQueries(queries, QuerySeparator.OR)
  }
}

case class AndIgniteSqlFilterClause(clauses:List[IgniteSqlFilterClause]) extends IgniteSqlFilterClause {
  override def toSql(schemaMapper: SchemaMapper): IgniteSqlQuery = {
    val queries = clauses.map(_.toSql(schemaMapper))
    joinNonEmptyQueries(queries, QuerySeparator.AND)
  }
}

case class EqIgniteSqlFilterClause(columnName: String, value: String) extends IgniteSqlFilterClause {
  override def toSql(schemaMapper: SchemaMapper): IgniteSqlQuery = {
    FilterColumnValueParser(schemaMapper).parse(columnName, value) match {
      case Right(ParsedResult(f, externalValue)) => eqSqlQuery(f.name, externalValue)
      case Left(errMsg) => logErrorAndReturnEmptySql(errMsg)
    }
  }
}

private object EqIgniteSqlFilterClause {
  def eqSqlQuery(field: String, value: Any): IgniteSqlQuery = IgniteSqlQuery(s"$field = ?", value)
}

case class NeqIgniteSqlFilterClause(columnName: String, value: String) extends IgniteSqlFilterClause {
  override def toSql(schemaMapper: SchemaMapper): IgniteSqlQuery = {
    FilterColumnValueParser(schemaMapper).parse(columnName, value) match {
      case Right(ParsedResult(f, externalValue)) => neqSql(f.name, externalValue)
      case Left(errMsg) => logErrorAndReturnEmptySql(errMsg)
    }
  }

  private def neqSql(field: String, value: Any) = IgniteSqlQuery(s"$field != ?", value)
}

case class RangeIgniteSqlFilterClause(op: RangeOp)(columnName: String, value: String) extends IgniteSqlFilterClause {
  override def toSql(schemaMapper: SchemaMapper): IgniteSqlQuery = {
    FilterColumnValueParser(schemaMapper).parse(columnName, value) match {
      case Right(ParsedResult(f, externalValue)) => rangeSql(f.name, externalValue)
      case Left(errMsg) => logErrorAndReturnEmptySql(errMsg)
    }
  }

  private def rangeSql(field: String, value: Any) = IgniteSqlQuery(s"$field ${op.value} ?", value)

  override def toString = s"RangeIgniteSqlFilterClause[$op]($columnName, $value)"
}

sealed abstract class RangeOp(val value: String)
object RangeOp {
  case object GT extends RangeOp(value = ">")
  case object GTE extends RangeOp(value = ">=")
  case object LT extends RangeOp(value = "<")
  case object LTE extends RangeOp(value = "<=")
}

case class RegexIgniteSqlFilterClause(op: RegexOp)(columnName: String, value: String) extends IgniteSqlFilterClause with StrictLogging {

  override def toSql(schemaMapper: SchemaMapper): IgniteSqlQuery =
    FilterColumnValueParser(schemaMapper).parse(columnName, value) match {
      case Right(ParsedResult(f, externalValue)) => regexSql(f, externalValue)
      case Left(errMsg) => logErrorAndReturnEmptySql(errMsg)
    }

  private def regexSql(f: SchemaField, value: Any): IgniteSqlQuery = f.dataType match {
    case STRING_DATA_TYPE =>
      val escapedValue = escapeSpecialChars(s"$value")
      IgniteSqlQuery(s"${f.name} LIKE ? ESCAPE '\\'", op.apply(escapedValue))
    case _ =>
      logErrorAndReturnEmptySql(s"`$op` clause unsupported for non-string field: `${f.name}` (type: ${f.dataType})")
  }

  private def escapeSpecialChars(value: String, escapeChar: String = "\\\\"): String = {
    val specialCharsRegex = s"(?<specialChars>[%_])|(?<escapeChar>$escapeChar)".r
    specialCharsRegex.replaceAllIn(value, m =>
      if (m.group("specialChars") != null) s"$escapeChar$m"
      else if (m.group("escapeChar") != null) escapeChar * 2
      else throw new Exception(s"An unexpected error occurred: escaping $m is not supported.")
    )
  }

  override def toString = s"RegexIgniteSqlFilterClause[$op]($columnName, $value)"
}

sealed abstract class RegexOp(val apply: String => String)
object RegexOp {
  case object Starts extends RegexOp(s => s"$s%")
  case object Ends extends RegexOp(s => s"%$s")
  case object Contains extends RegexOp(s => s"%$s%")
}

case class InIgniteSqlFilterClause(columnName: String, values: List[String]) extends IgniteSqlFilterClause with StrictLogging {
  override def toSql(schemaMapper: SchemaMapper): IgniteSqlQuery = {
    FilterColumnValueParser(schemaMapper).parse(columnName, values) match {
      case Right(ParsedResult(f, externalValues)) => inQuery(f.name, externalValues)
      case Left(errMsg) => logErrorAndReturnEmptySql(errMsg)
    }
  }

  private def inQuery(field: String, values: List[Any]): IgniteSqlQuery = {
    val eqQueries = values.map(eqSqlQuery(field, _))
    joinNonEmptyQueries(eqQueries, QuerySeparator.OR)
  }
}

private object joinNonEmptyQueries {
  def apply(queries: List[IgniteSqlQuery], sep: QuerySeparator): IgniteSqlQuery = {
    val joinedQuery = queries
      .reduceLeftOption((acc, query) => acc.appendQuery(query, sep))
      .getOrElse(IgniteSqlQuery.empty)

    if (queries.length > 1) joinedQuery.prependSql("(").appendSql(")") else joinedQuery
  }
}

private object logErrorAndReturnEmptySql extends StrictLogging {
  def apply(error: String): IgniteSqlQuery = {
    logger.error(error)
    IgniteSqlQuery.empty
  }
}
