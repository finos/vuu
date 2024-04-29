package org.finos.vuu.feature.ignite

import org.finos.vuu.core.filter.FilterSpecParser
import org.finos.vuu.core.sort.ModelType.SortSpecInternal
import org.finos.vuu.feature.ignite.filter.{IgniteSqlFilterClause, IgniteSqlFilterTreeVisitor, SqlStringConverterContainer, SqlStringConverterContainerBuilder}
import org.finos.vuu.feature.ignite.sort.IgniteSqlSortBuilder
import org.finos.vuu.net.FilterSpec
import org.finos.vuu.util.schema.SchemaMapper

trait FilterAndSortSpecToSql {
  def filterToSql(filterSpec: FilterSpec): String
  def sortToSql(sortSpec: SortSpecInternal): String
}

object FilterAndSortSpecToSql {
  def apply(schemaMapper: SchemaMapper): FilterAndSortSpecToSql = {
    new FilterAndSortSpecToSqlImpl(schemaMapper, SqlStringConverterContainerBuilder().build())
  }

  def apply(schemaMapper: SchemaMapper, toSqlStringContainer: SqlStringConverterContainer): FilterAndSortSpecToSql = {
    new FilterAndSortSpecToSqlImpl(schemaMapper, toSqlStringContainer)
  }
}

private class FilterAndSortSpecToSqlImpl(private val schemaMapper: SchemaMapper,
                                        private val toSqlStringContainer: SqlStringConverterContainer) extends FilterAndSortSpecToSql {
  // @Todo convert IgniteSqlFilterTreeVisitor & IgniteSqlSortBuilder to objects?
  private val filterTreeVisitor = new IgniteSqlFilterTreeVisitor
  private val igniteSqlSortBuilder = new IgniteSqlSortBuilder

  override def filterToSql(filterSpec: FilterSpec): String = {
    if (filterSpec.filter == null || filterSpec.filter.isEmpty) {
      ""
    } else {
      val clause = FilterSpecParser.parse[IgniteSqlFilterClause](filterSpec.filter, filterTreeVisitor)
      clause.toSql(schemaMapper, toSqlStringContainer)
    }
  }

  override def sortToSql(sortSpec: SortSpecInternal): String = igniteSqlSortBuilder.toSql(sortSpec, schemaMapper)
}
