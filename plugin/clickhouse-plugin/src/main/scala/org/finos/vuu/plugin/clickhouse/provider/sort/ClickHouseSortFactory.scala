package org.finos.vuu.plugin.clickhouse.provider.sort

import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.core.sort.SortDirection
import org.finos.vuu.net.SortSpec
import org.finos.vuu.plugin.virtualized.api.VirtualizedSessionTableDef

import scala.util.{Failure, Success, Try}

class ClickHouseSortFactory(tableDef: VirtualizedSessionTableDef) extends StrictLogging {

  private val DEFAULT_SORT = s"${tableDef.getRemoteKeyField} ASC"

  def build(sortSpec: SortSpec): String = {
    if (sortSpec != null && sortSpec.sortDefs != null && sortSpec.sortDefs.nonEmpty) {
      parseSort(sortSpec)
    } else {
      logger.trace(s"No sort spec was provided. Defaulting to key field ${tableDef.keyField}")
      DEFAULT_SORT
    }
  }

  private def parseSort(sortSpec: SortSpec): String = {
    Try(parseSortItems(sortSpec)) match {
      case Success(sortItems) =>
        val primaryKeyInSort = sortSpec.sortDefs.exists(f => f.column == tableDef.keyField)
        val orderBy = if (primaryKeyInSort) {
          sortItems.mkString(", ")
        } else {
          s"${sortItems.mkString(", ")}, $DEFAULT_SORT"
        }
        logger.trace(s"Parsed sort \"$orderBy\"")
        orderBy
      case Failure(err) =>
        logger.error(s"Could not parse sort $sortSpec", err)
        DEFAULT_SORT
    }
  }

  private def parseSortItems(sortSpec: SortSpec): List[String] = {
    val remoteMapping = tableDef.getRemoteColumnMapping
    sortSpec.sortDefs.map { sd =>      
      val remoteColumn = remoteMapping.getOrElse(sd.column,
        throw new IllegalArgumentException(s"Mapping missing for sort column: '${sd.column}'"))
      val direction = if (sd.sortType == SortDirection.DESCENDING.external) "DESC" else "ASC"
      s"${remoteColumn.remoteName} $direction"
    }
  }

}
