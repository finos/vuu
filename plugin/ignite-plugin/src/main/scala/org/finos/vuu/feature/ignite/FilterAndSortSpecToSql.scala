package org.finos.vuu.feature.ignite

import org.finos.vuu.core.filter.FilterSpecParser
import org.finos.vuu.feature.ignite.filter.{IgniteSqlFilterClause, IgniteSqlFilterTreeVisitor}
import org.finos.vuu.feature.ignite.sort.IgniteSqlSortBuilder
import org.finos.vuu.net.{FilterSpec, SortSpec}
import org.finos.vuu.util.schema.SchemaMapper

trait FilterAndSortSpecToSql {
  def filterToSql(filterSpec: FilterSpec): IgniteSqlQuery
  def sortToSql(sortSpec: SortSpec): IgniteSqlQuery
}

object FilterAndSortSpecToSql {
  def apply(schemaMapper: SchemaMapper): FilterAndSortSpecToSql = new FilterAndSortSpecToSqlImpl(schemaMapper)
}

private class FilterAndSortSpecToSqlImpl(private val schemaMapper: SchemaMapper) extends FilterAndSortSpecToSql {
  // @Todo convert IgniteSqlFilterTreeVisitor & IgniteSqlSortBuilder to objects?
  private val filterTreeVisitor = new IgniteSqlFilterTreeVisitor
  private val igniteSqlSortBuilder = new IgniteSqlSortBuilder

  override def filterToSql(filterSpec: FilterSpec): IgniteSqlQuery = {
    if (filterSpec.filter == null || filterSpec.filter.isEmpty) {
      IgniteSqlQuery.empty
    } else {
      val clause = FilterSpecParser.parse[IgniteSqlFilterClause](filterSpec.filter, filterTreeVisitor)
      clause.toSql(schemaMapper)
    }
  }

  override def sortToSql(sortSpec: SortSpec): IgniteSqlQuery = {
    if (sortSpec == null || sortSpec.sortDefs == null || sortSpec.sortDefs.isEmpty) {
      IgniteSqlQuery.empty
    } else {
      igniteSqlSortBuilder.toSql(sortSpec, schemaMapper)
    } 
  }
}
