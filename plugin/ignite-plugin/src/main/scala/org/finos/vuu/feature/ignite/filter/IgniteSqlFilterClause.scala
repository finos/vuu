package org.finos.vuu.feature.ignite.filter

import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.api.TableDef
import org.finos.vuu.core.table.DataType.{CharDataType, StringDataType}
import org.finos.vuu.feature.ignite.filter.IgniteSqlFilterClause.EMPTY_SQL

private object IgniteSqlFilterClause {
  val EMPTY_SQL = ""
}

trait IgniteSqlFilterClause {
  def toSql(tableDef: TableDef): String
}

case class OrIgniteSqlFilterClause(clauses:List[IgniteSqlFilterClause]) extends IgniteSqlFilterClause {
  override def toSql(tableDef: TableDef): String = {
    val sql = clauses.map(c => c.toSql(tableDef)).mkString(" OR ")
    if (clauses.length > 1) s"($sql)" else sql
  }
}

case class AndIgniteSqlFilterClause(clauses:List[IgniteSqlFilterClause]) extends IgniteSqlFilterClause {
  override def toSql(tableDef: TableDef): String = {
    val sql = clauses.map(c => c.toSql(tableDef)).mkString(" AND ")
    if (clauses.length > 1) s"($sql)" else sql
  }
}

case class EqIgniteSqlFilterClause(columnName: String, value: String) extends IgniteSqlFilterClause {
  override def toSql(tableDef: TableDef): String = {
    val processedVal = tableDef.columnForName(columnName).dataType match {
      case CharDataType | StringDataType => quotedString(value)
      case _ => value
    }
    s"$columnName = $processedVal"
  }
}

case class NeqIgniteSqlFilterClause(columnName: String, value: String) extends IgniteSqlFilterClause {
  override def toSql(tableDef: TableDef): String = {
    val processedVal = tableDef.columnForName(columnName).dataType match {
      case CharDataType | StringDataType => quotedString(value)
      case _ => value
    }
    s"$columnName != $processedVal"
  }
}

//todo why is number cast double? need to cast back to original type?
case class GtIgniteSqlFilterClause(columnName: String, value: Double) extends IgniteSqlFilterClause {
  override def toSql(tableDef: TableDef): String = s"$columnName > $value"
}

case class LtIgniteSqlFilterClause(columnName: String, value: Double) extends IgniteSqlFilterClause {
  override def toSql(tableDef: TableDef): String = s"$columnName < $value"
}

case class StartsIgniteSqlFilterClause(columnName: String, value: String) extends IgniteSqlFilterClause with StrictLogging {
  override def toSql(tableDef: TableDef): String =
    tableDef.columnForName(columnName).dataType match {
      case StringDataType => s"$columnName LIKE '$value%'"
      case _ =>
        logger.error(s"`Starts` clause unsupported for non string column: `$columnName`")
        EMPTY_SQL
    }
}

case class EndsIgniteSqlFilterClause(columnName: String, value: String) extends IgniteSqlFilterClause with StrictLogging {
  override def toSql(tableDef: TableDef): String =
    tableDef.columnForName(columnName).dataType match {
      case StringDataType => s"$columnName LIKE '%$value'"
      case _ =>
        logger.error(s"`Ends` clause unsupported for non string column: `$columnName`")
        EMPTY_SQL
    }
}

case class InIgniteSqlFilterClause(columnName: String, values: List[String]) extends IgniteSqlFilterClause with StrictLogging {
  override def toSql(tableDef: TableDef): String = {
    val processedValues = tableDef.columnForName(columnName).dataType match {
      case CharDataType | StringDataType => values.map(quotedString(_))
      case _ => values
    }
    s"$columnName IN (${processedValues.mkString(",")})"
  }
}

private object quotedString {
  def apply(s: String) = s"'$s'"
}
