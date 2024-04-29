package org.finos.vuu.feature.ignite.filter

import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.feature.ignite.filter.IgniteSqlFilterClause.EMPTY_SQL
import org.finos.vuu.feature.ignite.filter.FilterColumnValueParser.{ParsedResult, STRING_DATA_TYPE}
import org.finos.vuu.util.schema.{SchemaField, SchemaMapper}
import org.finos.vuu.util.types.TypeUtils

private object IgniteSqlFilterClause {
  val EMPTY_SQL = ""
}

trait IgniteSqlFilterClause {
  def toSql(schemaMapper: SchemaMapper, toStringContainer: ToSqlStringContainer): String
}

case class OrIgniteSqlFilterClause(clauses:List[IgniteSqlFilterClause]) extends IgniteSqlFilterClause {
  override def toSql(schemaMapper: SchemaMapper, toStringContainer: ToSqlStringContainer): String = {
    val sql = clauses.map(c => c.toSql(schemaMapper, toStringContainer)).filter(_ != EMPTY_SQL).mkString(" OR ")
    if (clauses.length > 1) s"($sql)" else sql
  }
}

case class AndIgniteSqlFilterClause(clauses:List[IgniteSqlFilterClause]) extends IgniteSqlFilterClause {
  override def toSql(schemaMapper: SchemaMapper, toStringContainer: ToSqlStringContainer): String = {
    val sql = clauses.map(c => c.toSql(schemaMapper, toStringContainer)).filter(_ != EMPTY_SQL).mkString(" AND ")
    if (clauses.length > 1) s"($sql)" else sql
  }
}

case class EqIgniteSqlFilterClause(columnName: String, value: String) extends IgniteSqlFilterClause {
  override def toSql(schemaMapper: SchemaMapper, toStringContainer: ToSqlStringContainer): String = {
    def toString = getStringConverter(toStringContainer)

    FilterColumnValueParser(schemaMapper).parse(columnName, value) match {
      case Right(ParsedResult(f, externalValue)) => eqSql(f.name, toString(externalValue, f.dataType))
      case Left(errMsg) => logErrorAndReturnEmptySql(errMsg)
    }
  }

  private def eqSql(field: String, processedVal: String): String = {
    s"$field = $processedVal"
  }
}

case class NeqIgniteSqlFilterClause(columnName: String, value: String) extends IgniteSqlFilterClause {
  override def toSql(schemaMapper: SchemaMapper, toStringContainer: ToSqlStringContainer): String = {
    def toString = getStringConverter(toStringContainer)

    FilterColumnValueParser(schemaMapper).parse(columnName, value) match {
      case Right(ParsedResult(f, externalValue)) => neqSql(f.name, toString(externalValue, f.dataType))
      case Left(errMsg) => logErrorAndReturnEmptySql(errMsg)
    }
  }

  private def neqSql(field: String, processedVal: String): String = {
    s"$field != $processedVal"
  }
}

case class RangeIgniteSqlFilterClause(op: RangeOp)(columnName: String, value: String) extends IgniteSqlFilterClause {
  override def toSql(schemaMapper: SchemaMapper, toStringContainer: ToSqlStringContainer): String = {
    def toString = getStringConverter(toStringContainer)

    FilterColumnValueParser(schemaMapper).parse(columnName, value) match {
      case Right(ParsedResult(f, externalValue)) => rangeSql(f.name, toString(externalValue, f.dataType))
      case Left(errMsg) => logErrorAndReturnEmptySql(errMsg)
    }
  }

  private def rangeSql(field: String, processedVal: String): String = s"$field ${op.value} $processedVal"
  override def toString = s"RangeIgniteSqlFilterClause[$op]($columnName, $value)"
}

case class StartsIgniteSqlFilterClause(columnName: String, value: String) extends IgniteSqlFilterClause with StrictLogging {
  override def toSql(schemaMapper: SchemaMapper, toStringContainer: ToSqlStringContainer): String = {
    def toString = getStringConverter(toStringContainer)

    FilterColumnValueParser(schemaMapper).parse(columnName, value) match {
      case Right(ParsedResult(f, externalValue)) => startsSql(f, toString(externalValue, f.dataType))
      case Left(errMsg) => logErrorAndReturnEmptySql(errMsg)
    }
  }

  private def startsSql(f: SchemaField, value: String): String = f.dataType match {
    case STRING_DATA_TYPE => s"${f.name} LIKE ${value.stripSuffix("'")}%'"
    case _ => logErrorAndReturnEmptySql(s"`Starts` clause unsupported for non string column: `${f.name}` (${f.dataType})")
  }
}

case class EndsIgniteSqlFilterClause(columnName: String, value: String) extends IgniteSqlFilterClause with StrictLogging {
  override def toSql(schemaMapper: SchemaMapper, toStringContainer: ToSqlStringContainer): String = {
    def toString = getStringConverter(toStringContainer)

    FilterColumnValueParser(schemaMapper).parse(columnName, value) match {
      case Right(ParsedResult(f, externalValue)) => endsSql(f, toString(externalValue, f.dataType))
      case Left(errMsg) => logErrorAndReturnEmptySql(errMsg)
    }
  }

  private def endsSql(f: SchemaField, value: String): String = f.dataType match {
    case STRING_DATA_TYPE => s"${f.name} LIKE '%${value.stripPrefix("'")}"
    case _ => logErrorAndReturnEmptySql(s"`Ends` clause unsupported for non string column: `${f.name}` (${f.dataType})")
  }
}

case class InIgniteSqlFilterClause(columnName: String, values: List[String]) extends IgniteSqlFilterClause with StrictLogging {
  override def toSql(schemaMapper: SchemaMapper, toStringContainer: ToSqlStringContainer): String = {
    def toString = getStringConverter(toStringContainer)

    FilterColumnValueParser(schemaMapper).parse(columnName, values) match {
      case Right(ParsedResult(f, externalValues)) => inQuery(f.name, externalValues.map(toString(_, f.dataType)))
      case Left(errMsg) => logErrorAndReturnEmptySql(errMsg)
    }
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


private object getStringConverter {
  def apply(toStringContainer: ToSqlStringContainer): (Any, Class[_]) => String = (value, dataType) =>
      if (TypeUtils.areTypesEqual(dataType, STRING_DATA_TYPE)) {
        quotedString(defaultToString(value))
      } else {
        toStringContainer
          .toString(value, dataType.asInstanceOf[Class[Any]])
          .getOrElse(addQuotesIfRequired(defaultToString(value), dataType))
      }

    private def defaultToString(value: Any): String = Option(value).map(_.toString).orNull
}

private object quotedString {
  def apply(s: String) = s"'$s'"
}

private object addQuotesIfRequired {
  def apply(v: String, dataType: Class[_]): String = if (requireQuotes(dataType)) quotedString(v) else v

  private def requireQuotes(dt: Class[_]): Boolean = dataTypesRequiringQuotes.contains(dt)

  private val dataTypesRequiringQuotes: Set[Class[_]] = Set(
    classOf[String],
    classOf[Char],
    classOf[java.lang.Character],
    classOf[java.sql.Date],
  )
}

private object logErrorAndReturnEmptySql extends StrictLogging {
  def apply(error: String): String = {
    logger.error(error)
    EMPTY_SQL
  }
}
