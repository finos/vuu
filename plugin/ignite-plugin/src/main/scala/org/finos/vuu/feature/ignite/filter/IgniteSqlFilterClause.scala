package org.finos.vuu.feature.ignite.filter

import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.feature.ignite.filter.IgniteSqlFilterClause.EMPTY_SQL
import org.finos.vuu.feature.ignite.filter.SqlFilterColumnValueParser.{ParsedResult, STRING_DATA_TYPE}
import org.finos.vuu.util.schema.{SchemaField, SchemaMapper}

private object IgniteSqlFilterClause {
  val EMPTY_SQL = ""
}

trait IgniteSqlFilterClause {
  def toSql(schemaMapper: SchemaMapper, toStringContainer: SqlStringConverterContainer): String
}

case class OrIgniteSqlFilterClause(clauses:List[IgniteSqlFilterClause]) extends IgniteSqlFilterClause {
  override def toSql(schemaMapper: SchemaMapper, toStringContainer: SqlStringConverterContainer): String = {
    val sql = clauses.map(c => c.toSql(schemaMapper, toStringContainer)).filter(_ != EMPTY_SQL).mkString(" OR ")
    if (clauses.length > 1) s"($sql)" else sql
  }
}

case class AndIgniteSqlFilterClause(clauses:List[IgniteSqlFilterClause]) extends IgniteSqlFilterClause {
  override def toSql(schemaMapper: SchemaMapper, toStringContainer: SqlStringConverterContainer): String = {
    val sql = clauses.map(c => c.toSql(schemaMapper, toStringContainer)).filter(_ != EMPTY_SQL).mkString(" AND ")
    if (clauses.length > 1) s"($sql)" else sql
  }
}

case class EqIgniteSqlFilterClause(columnName: String, value: String) extends IgniteSqlFilterClause {
  override def toSql(schemaMapper: SchemaMapper, toStringContainer: SqlStringConverterContainer): String =
    SqlFilterColumnValueParser(schemaMapper, toStringContainer).parseColumnValue(columnName, value) match {
      case Right(ParsedResult(f, parsedValue)) => eqSql(f.name, parsedValue)
      case Left(errMsg) => logErrorAndReturnEmptySql(errMsg)
    }

  private def eqSql(field: String, processedVal: String): String = {
    s"$field = $processedVal"
  }
}

case class NeqIgniteSqlFilterClause(columnName: String, value: String) extends IgniteSqlFilterClause {
  override def toSql(schemaMapper: SchemaMapper, toStringContainer: SqlStringConverterContainer): String =
    SqlFilterColumnValueParser(schemaMapper, toStringContainer).parseColumnValue(columnName, value) match {
      case Right(ParsedResult(f, parsedValue)) => neqSql(f.name, parsedValue)
      case Left(errMsg) => logErrorAndReturnEmptySql(errMsg)
    }

  private def neqSql(field: String, processedVal: String): String = {
    s"$field != $processedVal"
  }
}

case class RangeIgniteSqlFilterClause(op: RangeOp)(columnName: String, value: String) extends IgniteSqlFilterClause {
  override def toSql(schemaMapper: SchemaMapper, toStringContainer: SqlStringConverterContainer): String =
    SqlFilterColumnValueParser(schemaMapper, toStringContainer).parseColumnValue(columnName, value) match {
      case Right(ParsedResult(f, parsedValue)) => rangeSql(f.name, parsedValue)
      case Left(errMsg) => logErrorAndReturnEmptySql(errMsg)
    }

  private def rangeSql(field: String, processedVal: String): String = s"$field ${op.value} $processedVal"
  override def toString = s"RangeIgniteSqlFilterClause[$op]($columnName, $value)"
}

case class StartsIgniteSqlFilterClause(columnName: String, value: String) extends IgniteSqlFilterClause with StrictLogging {
  override def toSql(schemaMapper: SchemaMapper, toStringContainer: SqlStringConverterContainer): String = {
    SqlFilterColumnValueParser(schemaMapper, toStringContainer).parseColumnValue(columnName, value) match {
      case Right(ParsedResult(f, parsedValue)) => startsSql(f, parsedValue)
      case Left(errMsg) => logErrorAndReturnEmptySql(errMsg)
    }
  }

  private def startsSql(f: SchemaField, value: String): String = f.dataType match {
    case STRING_DATA_TYPE => s"${f.name} LIKE ${value.stripSuffix("'")}%'"
    case _ => logErrorAndReturnEmptySql(s"`Starts` clause unsupported for non string column: `${f.name}` (${f.dataType})")
  }
}

case class EndsIgniteSqlFilterClause(columnName: String, value: String) extends IgniteSqlFilterClause with StrictLogging {
  override def toSql(schemaMapper: SchemaMapper, toStringContainer: SqlStringConverterContainer): String = {
    SqlFilterColumnValueParser(schemaMapper, toStringContainer).parseColumnValue(columnName, value) match {
      case Right(ParsedResult(f, parsedValue)) => endsSql(f, parsedValue)
      case Left(errMsg) => logErrorAndReturnEmptySql(errMsg)
    }
  }

  private def endsSql(f: SchemaField, value: String): String = f.dataType match {
    case STRING_DATA_TYPE => s"${f.name} LIKE '%${value.stripPrefix("'")}"
    case _ => logErrorAndReturnEmptySql(s"`Ends` clause unsupported for non string column: `${f.name}` (${f.dataType})")
  }
}

case class InIgniteSqlFilterClause(columnName: String, values: List[String]) extends IgniteSqlFilterClause with StrictLogging {
  override def toSql(schemaMapper: SchemaMapper, toStringContainer: SqlStringConverterContainer): String =
    SqlFilterColumnValueParser(schemaMapper, toStringContainer).parseColumnValues(columnName, values) match {
      case Right(ParsedResult(f, parsedValues)) => inQuery(f.name, parsedValues)
      case Left(errMsg) => logErrorAndReturnEmptySql(errMsg)
    }

  private def inQuery(field: String, processedValues: List[String]) = {
    s"$field IN (${processedValues.mkString(",")})"
  }
}

sealed abstract class RangeOp(val value: String)
object RangeOp {
  final case object GT extends RangeOp(value = ">")
  final case object GTE extends RangeOp(value = ">=")
  final case object LT extends RangeOp(value = "<")
  final case object LTE extends RangeOp(value = "<=")
}

private object logErrorAndReturnEmptySql extends StrictLogging {
  def apply(error: String): String = {
    logger.error(error)
    EMPTY_SQL
  }
}
