package org.finos.vuu.feature.ignite.sort

import org.finos.vuu.core.sort.SortDirection
import org.finos.vuu.feature.ignite.IgniteSqlQuery
import org.finos.vuu.net.SortSpec
import org.finos.vuu.util.schema.SchemaMapper


//todo design discussions
//option 1: make Sort interface and parsingSort can produce right type of sort? - issue is ignite specific/ not just Virtual table vs in memory
//option 2: expose sort spec on VP like filter spec - issue is sort def is api contract with ui so should not be used internally on core logic
class IgniteSqlSortBuilder {
  private val AscendingSql = "ASC"
  private val DescendingSql = "DESC"
  def toSql(sortColumnsToDirections: SortSpec, schemaMapper: SchemaMapper): IgniteSqlQuery = {
    val sql = sortColumnsToDirections.sortDefs
      .map(f => (f.column, SortDirection.fromExternal(f.sortType)))
      .flatMap{case (columnName, direction) => toSortString(columnName, direction, schemaMapper)}
      .mkString(", ")

    IgniteSqlQuery(sqlTemplate = sql)
  }

  private def toSortString(columnName: String,
                           sortDirection: SortDirection,
                           schemaMapper: SchemaMapper): Option[String] = {
    schemaMapper.externalSchemaField(columnName) match {
      case Some(f) => Some(s"${f.name} ${toSQL(sortDirection)}")
      case None => None
    }
  }

  private def toSQL(direction: SortDirection) =
    direction match {
      case SortDirection.Ascending  => AscendingSql
      case SortDirection.Descending => DescendingSql
    }

}
