package org.finos.vuu.feature.ignite.filter

import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.feature.ignite.IgniteSqlQuery
import org.finos.vuu.feature.ignite.filter.EqIgniteSqlFilterClause.eqSqlQuery
import org.finos.vuu.feature.ignite.filter.FilterColumnValueParser.{ParsedResult, STRING_DATA_TYPE}
import org.finos.vuu.feature.ignite.IgniteSqlQuery.QuerySeparator
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
  final case object GT extends RangeOp(value = ">")
  final case object GTE extends RangeOp(value = ">=")
  final case object LT extends RangeOp(value = "<")
  final case object LTE extends RangeOp(value = "<=")
}

case class RegexIgniteSqlFilterClause(op: RegexOp)(columnName: String, value: String) extends IgniteSqlFilterClause with StrictLogging {
  private final val ESCAPE_CHAR = "\\"

  override def toSql(schemaMapper: SchemaMapper): IgniteSqlQuery =
    FilterColumnValueParser(schemaMapper).parse(columnName, value) match {
      case Right(ParsedResult(f, externalValue)) => regexSql(f, externalValue)
      case Left(errMsg) => logErrorAndReturnEmptySql(errMsg)
    }

  private def regexSql(f: SchemaField, value: Any): IgniteSqlQuery = f.dataType match {
    case STRING_DATA_TYPE =>
      val escapedValue = escapeSpecialChars(s"$value")
      IgniteSqlQuery(s"${f.name} LIKE ? ESCAPE ?", op.apply(escapedValue), ESCAPE_CHAR)
    case _ =>
      logErrorAndReturnEmptySql(s"`$op` clause unsupported for non-string field: `${f.name}` (type: ${f.dataType})")
  }

  private def escapeSpecialChars(value: String): String = {
    val specialCharsRegex = "([%_])|(\\\\)".r
    specialCharsRegex.replaceAllIn(value, m =>
      if (m.group(1) != null) s"${ESCAPE_CHAR * 2}$m" else s"${ESCAPE_CHAR * 3}$m"
    )
  }

  override def toString = s"RegexIgniteSqlFilterClause[$op]($columnName, $value)"
}

sealed abstract class RegexOp(val apply: String => String)
object RegexOp {
  final case object Starts extends RegexOp("%s%%".format(_))
  final case object Ends extends RegexOp("%%%s".format(_))
  final case object Contains extends RegexOp("%%%s%%".format(_))
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
