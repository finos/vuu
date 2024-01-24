package org.finos.vuu.feature.ignite.sort

import org.finos.vuu.core.sort.SortDirection


//todo design discussions
//option 1: make Sort interface and parsingSort can produce right type of sort? - issue is ignite specific/ not just Virtual table vs in memory
//option 2: expose sort spec on VP like filter spec - issue is sort def is api contract with ui so should not be used internally on core logic
class IgniteSqlSortBuilder {

  private val AscendingSql = "ASC"
  private val DescendingSql = "DESC"
  def toSql(sortColumnsToDirections: Map[String, SortDirection.TYPE]): String = {
    sortColumnsToDirections.map {
      case (columnName, sortDirection) => s"$columnName ${toSQL(sortDirection)}"
    }
  }.mkString(", ")

  private def toSQL(direction: SortDirection.TYPE) =
    direction match {
      case SortDirection.Ascending => AscendingSql
      case SortDirection.Descending => DescendingSql
    }
  //todo introduce NoSort type



}
