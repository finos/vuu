package org.finos.vuu.feature.ignite.sort

import org.finos.vuu.core.sort.SortDirection
import org.finos.vuu.feature.ignite.IgniteSqlQuery
import org.finos.vuu.net.{SortDef, SortSpec}
import org.finos.vuu.util.schema.SchemaMapper


//todo design discussions
//option 1: make Sort interface and parsingSort can produce right type of sort? - issue is ignite specific/ not just Virtual table vs in memory
//option 2: expose sort spec on VP like filter spec - issue is sort def is api contract with ui so should not be used internally on core logic
class IgniteSqlSortBuilder {
  private val AscendingSql = "ASC"
  private val DescendingSql = "DESC"
  def toSql(sortColumnsToDirections: SortSpec, schemaMapper: SchemaMapper): IgniteSqlQuery = {
    val sql = sortColumnsToDirections.sortDefs
      .flatMap{f => toSortString(f, schemaMapper)}
      .mkString(", ")

    IgniteSqlQuery(sqlTemplate = sql)
  }

  private def toSortString(sortDef: SortDef,
                           schemaMapper: SchemaMapper): Option[String] = {
    schemaMapper.externalSchemaField(sortDef.column) match {
      case Some(f) => Some(s"${f.name} ${toSQL(sortDef.sortType)}")
      case None => None
    }
  }

  private def toSQL(direction: Char) =
    direction match {
      case SortDirection.Ascending.external  => AscendingSql
      case SortDirection.Descending.external => DescendingSql
    }

}
