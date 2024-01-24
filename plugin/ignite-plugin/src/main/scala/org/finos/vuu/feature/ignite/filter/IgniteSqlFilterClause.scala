package org.finos.vuu.feature.ignite.filter

import org.finos.vuu.api.TableDef
import org.finos.vuu.core.table.DataType.StringDataType

trait IgniteSqlFilterClause {
  def toSql(tableDef: TableDef): String
}

case class OrIgniteSqlFilterClause(clauses:List[IgniteSqlFilterClause]) extends IgniteSqlFilterClause{
  override def toSql(tableDef: TableDef): String = {
    clauses.head.toSql(tableDef) //todo implement properly. just making it work as root clause for now
  }
}

case class AndIgniteSqlFilterClause(clauses:List[IgniteSqlFilterClause]) extends IgniteSqlFilterClause{
  override def toSql(tableDef: TableDef): String = {
    var sql: String = clauses.head.toSql(tableDef)
    clauses.tail.map(clause =>
      sql+= s" AND ${clause.toSql(tableDef)}"
    )
    sql
  }
}
case class EqIgniteSqlFilterClause(columnName: String, value: String) extends IgniteSqlFilterClause{
  override def toSql(tableDef: TableDef): String = {

    tableDef.columnForName(columnName).dataType match {
      case StringDataType => s"$columnName=\'$value\'"
      case _ => s"$columnName=$value"
    }
    //s"$columnName=\'$value\'"
  }
}

//todo why is number cast double? need to cast back to original type?
case class GreaterThanIgniteSqlFilterClause(columnName: String, value: Double) extends IgniteSqlFilterClause{
  override def toSql(tableDef: TableDef): String = s"$columnName > $value"
}