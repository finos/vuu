package org.finos.vuu.feature.ignite.filter

import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.core.table.DataType.{CharDataType, StringDataType}
import org.finos.vuu.feature.ignite.filter.IgniteSqlFilterClause.EMPTY_SQL
import org.finos.vuu.util.schema.SchemaMapper

private object IgniteSqlFilterClause {
  val EMPTY_SQL = ""
}

trait IgniteSqlFilterClause {
  def toSql(schemaMapper: SchemaMapper): String
}

case class OrIgniteSqlFilterClause(clauses:List[IgniteSqlFilterClause]) extends IgniteSqlFilterClause {
  override def toSql(schemaMapper: SchemaMapper): String = {
    val sql = clauses.map(c => c.toSql(schemaMapper)).filter(_ != EMPTY_SQL).mkString(" OR ")
    if (clauses.length > 1) s"($sql)" else sql
  }
}

case class AndIgniteSqlFilterClause(clauses:List[IgniteSqlFilterClause]) extends IgniteSqlFilterClause {
  override def toSql(schemaMapper: SchemaMapper): String = {
    val sql = clauses.map(c => c.toSql(schemaMapper)).filter(_ != EMPTY_SQL).mkString(" AND ")
    if (clauses.length > 1) s"($sql)" else sql
  }
}

case class EqIgniteSqlFilterClause(columnName: String, value: String) extends IgniteSqlFilterClause {
  override def toSql(schemaMapper: SchemaMapper): String =
    schemaMapper.externalSchemaField(columnName) match {
      case Some(f) => f.dataType match {
        case CharDataType | StringDataType => eqSql(f.name, quotedString(value))
        case _ => eqSql(f.name, value)
      }
      case None => logMappingErrorAndReturnEmptySql(columnName)
    }

  private def eqSql(field: String, processedVal: String): String = {
    s"$field = $processedVal"
  }
}

case class NeqIgniteSqlFilterClause(columnName: String, value: String) extends IgniteSqlFilterClause {
  override def toSql(schemaMapper: SchemaMapper): String =
    schemaMapper.externalSchemaField(columnName) match {
      case Some(field) => field.dataType match {
        case CharDataType | StringDataType => neqSql(field.name, quotedString(value))
        case _ => neqSql(field.name, value)
      }
      case None => logMappingErrorAndReturnEmptySql(columnName)
    }

  private def neqSql(field: String, processedVal: String): String = {
    s"$field != $processedVal"
  }
}

//todo why is number cast double? need to cast back to original type?
case class RangeIgniteSqlFilterClause(op: RangeOp)(columnName: String, value: Double) extends IgniteSqlFilterClause {
  override def toSql(schemaMapper: SchemaMapper): String =
    schemaMapper.externalSchemaField(columnName) match {
      case Some(f) => s"${f.name} ${op.value} $value"
      case None    => logMappingErrorAndReturnEmptySql(columnName)
    }
  override def toString = s"RangeIgniteSqlFilterClause[$op]($columnName, $value)"
}

case class StartsIgniteSqlFilterClause(columnName: String, value: String) extends IgniteSqlFilterClause with StrictLogging {
  override def toSql(schemaMapper: SchemaMapper): String = {
    schemaMapper.externalSchemaField(columnName) match {
      case Some(f) => f.dataType match {
        case StringDataType => s"${f.name} LIKE '$value%'"
        case _ => logErrorAndReturnEmptySql(s"`Starts` clause unsupported for non string column: `${f.name}` (${f.dataType})")
      }
      case None => logMappingErrorAndReturnEmptySql(columnName)
    }
  }
}

case class EndsIgniteSqlFilterClause(columnName: String, value: String) extends IgniteSqlFilterClause with StrictLogging {
  override def toSql(schemaMapper: SchemaMapper): String =
    schemaMapper.externalSchemaField(columnName) match {
      case Some(f) => f.dataType match {
        case StringDataType => s"${f.name} LIKE '%$value'"
        case _ => logErrorAndReturnEmptySql(s"`Ends` clause unsupported for non string column: `${f.name}` (${f.dataType})")
      }
      case None => logMappingErrorAndReturnEmptySql(columnName)
  }
}

case class InIgniteSqlFilterClause(columnName: String, values: List[String]) extends IgniteSqlFilterClause with StrictLogging {
  override def toSql(schemaMapper: SchemaMapper): String =
    schemaMapper.externalSchemaField(columnName) match {
      case Some(f) => f.dataType match {
        case CharDataType | StringDataType => inQuery(f.name, values.map(quotedString(_)))
        case _ => inQuery(f.name, values)
      }
      case None => logMappingErrorAndReturnEmptySql(columnName)
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

private object quotedString {
  def apply(s: String) = s"'$s'"
}

private object logMappingErrorAndReturnEmptySql {
  def apply(columnName: String): String =
    logErrorAndReturnEmptySql(s"Failed to find mapped external field for column `$columnName`")
}

private object logErrorAndReturnEmptySql extends StrictLogging {
  def apply(error: String): String = {
    logger.error(error)
    EMPTY_SQL
  }
}
