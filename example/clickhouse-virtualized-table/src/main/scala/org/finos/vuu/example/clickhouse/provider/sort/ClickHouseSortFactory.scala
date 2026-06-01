package org.finos.vuu.example.clickhouse.provider.sort

import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.api.TableDef
import org.finos.vuu.net.SortSpec

object ClickHouseSortFactory extends StrictLogging {

  private val NO_SORT = ""

  def build(sortSpec: SortSpec, tableDef: TableDef): String = {
    if (sortSpec != null && sortSpec.sortDefs != null && sortSpec.sortDefs.nonEmpty) {
      logger.debug(s"Applying sort $sortSpec")
      buildOrderBy(sortSpec, tableDef)
    } else {
      logger.debug("No sort spec was provided")
      NO_SORT
    }
  }

  private def buildOrderBy(sortSpec: SortSpec, tableDef: TableDef): String = {
    val sortItems = sortSpec.sortDefs.map { sd =>
      val direction = if (sd.sortType == 'D') "DESC" else "ASC"
      s"${sd.column} $direction"
    }
    s"ORDER BY ${sortItems.mkString(", ")}"
  }

}
