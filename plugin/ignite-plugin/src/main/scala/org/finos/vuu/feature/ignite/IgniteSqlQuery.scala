package org.finos.vuu.feature.ignite

import org.apache.ignite.cache.query.SqlFieldsQuery
import org.finos.vuu.feature.ignite.IgniteSqlQuery.QuerySeparator

object IgniteSqlQuery {
  def apply(sqlTemplate: String): IgniteSqlQuery = new IgniteSqlQuery(sqlTemplate, List.empty)
  def apply(sqlTemplate: String, args: Any*) = new IgniteSqlQuery(sqlTemplate, args.toList)
  def empty: IgniteSqlQuery = IgniteSqlQuery("")

  sealed abstract class QuerySeparator(val value: String)
  object QuerySeparator {
    case object AND extends QuerySeparator(value = " AND ")
    case object OR extends QuerySeparator(value = " OR ")
    case object SPACE extends QuerySeparator(value = " ")
    case object EMPTY extends QuerySeparator(value = "")
  }
}

case class IgniteSqlQuery(sqlTemplate: String, args: List[Any]) {

  def appendSql(sqlTemplate: String, sep: QuerySeparator = QuerySeparator.EMPTY): IgniteSqlQuery = {
    val newTemplate = if (sqlTemplate.isEmpty) this.sqlTemplate else Array(this.sqlTemplate, sqlTemplate).mkString(sep.value)
    this.copy(sqlTemplate = newTemplate)
  }

  def prependSql(sqlTemplate: String, sep: QuerySeparator = QuerySeparator.EMPTY): IgniteSqlQuery = {
    val newTemplate = if (sqlTemplate.isEmpty) this.sqlTemplate else Array(sqlTemplate, this.sqlTemplate).mkString(sep.value)
    this.copy(sqlTemplate = newTemplate)
  }

  def appendArgs(args: List[Any]): IgniteSqlQuery = {
    this.copy(args = this.args ++ args)
  }

  def appendQuery(query: IgniteSqlQuery, sep: QuerySeparator = QuerySeparator.EMPTY): IgniteSqlQuery = {
    this.appendSql(query.sqlTemplate, sep).appendArgs(query.args)
  }

  def isEmpty: Boolean = this.sqlTemplate.isEmpty && this.args.isEmpty

  def buildFieldsQuery(): SqlFieldsQuery = new SqlFieldsQuery(sqlTemplate).setArgs(args.toArray: _*)
}
