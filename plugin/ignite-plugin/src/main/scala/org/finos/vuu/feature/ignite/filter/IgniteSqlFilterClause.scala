package org.finos.vuu.feature.ignite.filter

trait IgniteSqlFilterClause {
  def toSql(): String
}

case class OrIgniteSqlFilterClause(clauses:List[IgniteSqlFilterClause]) extends IgniteSqlFilterClause{
  override def toSql(): String = {
    clauses.head.toSql() //todo implement properly. just making it work as root clause for now
  }
}

case class AndIgniteSqlFilterClause(clauses:List[IgniteSqlFilterClause]) extends IgniteSqlFilterClause{
  override def toSql(): String = {
    var sql: String = clauses.head.toSql()
    clauses.tail.map(clause =>
      sql+= s" AND ${clause.toSql()}"
    )
    sql
  }
}
case class EqIgniteSqlFilterClause(columnName: String, value: String) extends IgniteSqlFilterClause{
  override def toSql(): String = {
    val valueAsColumnType = value //todo look this up from ignite entity field type

    valueAsColumnType match {
      case s: String => s"$columnName=\'$s\'"
      case other => s"$columnName=$other"
    }
  }
}

//todo why is number cast double? need to cast back to original type?
case class GreaterThanIgniteSqlFilterClause(columnName: String, value: Double) extends IgniteSqlFilterClause{
  override def toSql(): String = s"$columnName > $value"
}