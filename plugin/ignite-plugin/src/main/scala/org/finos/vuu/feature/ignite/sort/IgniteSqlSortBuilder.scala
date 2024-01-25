package org.finos.vuu.feature.ignite.sort

import org.finos.vuu.core.sort.ModelType.SortSpecInternal
import org.finos.vuu.core.sort.SortDirection


//todo design discussions
//option 1: make Sort interface and parsingSort can produce right type of sort? - issue is ignite specific/ not just Virtual table vs in memory
//option 2: expose sort spec on VP like filter spec - issue is sort def is api contract with ui so should not be used internally on core logic
class IgniteSqlSortBuilder {
  private type MapToIgniteColumnName = String => Option[String]
  private val AscendingSql = "ASC"
  private val DescendingSql = "DESC"
  def toSql(sortColumnsToDirections: SortSpecInternal, columnMapper: MapToIgniteColumnName): String = {
    sortColumnsToDirections.map {
      case (tableColumnName, sortDirection) => {
        val igniteColumnName = columnMapper(tableColumnName) match {
          case Some(value) => value
          case None => "" //todo handle no mapping found
        }
        s"$igniteColumnName ${toSQL(sortDirection)}"
      }
    }
  }.mkString(", ")

  private def toSQL(direction: SortDirection.TYPE) =
    direction match {
      case SortDirection.Ascending => AscendingSql
      case SortDirection.Descending => DescendingSql
    }
  //todo introduce NoSort type



}
