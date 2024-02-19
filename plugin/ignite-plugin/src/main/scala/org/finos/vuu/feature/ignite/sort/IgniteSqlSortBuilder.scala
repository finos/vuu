package org.finos.vuu.feature.ignite.sort

import org.finos.vuu.core.sort.ModelType.SortSpecInternal
import org.finos.vuu.core.sort.SortDirection
import org.finos.vuu.util.schema.SchemaMapper


//todo design discussions
//option 1: make Sort interface and parsingSort can produce right type of sort? - issue is ignite specific/ not just Virtual table vs in memory
//option 2: expose sort spec on VP like filter spec - issue is sort def is api contract with ui so should not be used internally on core logic
class IgniteSqlSortBuilder {
  private val AscendingSql = "ASC"
  private val DescendingSql = "DESC"
  def toSql(sortColumnsToDirections: SortSpecInternal, schemaMapper: SchemaMapper): String =
    sortColumnsToDirections
      .flatMap{case (columnName, direction) => toSortString(columnName, direction, schemaMapper)}
      .mkString(", ")

  private def toSortString(columnName: String,
                           sortDirection: SortDirection.TYPE,
                           schemaMapper: SchemaMapper): Option[String] = {
    schemaMapper.externalSchemaField(columnName) match {
      case Some(f) => Some(s"${f.name} ${toSQL(sortDirection)}")
      case None => None
    }
  }
  private def toSQL(direction: SortDirection.TYPE) =
    direction match {
      case SortDirection.Ascending => AscendingSql
      case SortDirection.Descending => DescendingSql
    }
}
