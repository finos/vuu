package org.finos.vuu.plugin.clickhouse.provider.sort

import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.core.sort.SortDirection
import org.finos.vuu.net.SortSpec
import org.finos.vuu.plugin.virtualized.api.VirtualizedSessionTableDef

import scala.util.{Failure, Success, Try}

class ClickHouseSortFactory(tableDef: VirtualizedSessionTableDef) extends StrictLogging {

  def build(sortSpec: SortSpec): String = {
    if (sortSpec != null && sortSpec.sortDefs != null && sortSpec.sortDefs.nonEmpty) {
      parseSort(sortSpec)
    } else {
      logger.trace(s"No sort spec was provided. Defaulting to key field ${tableDef.keyField}")
      s"ORDER BY ${tableDef.getRemoteKeyField} ASC"
    }
  }

  private def parseSort(sortSpec: SortSpec): String = {
    val primaryKeyInSort: Boolean = sortSpec.sortDefs.exists(f => f.column == tableDef.keyField)

    Try(parseSortItems(sortSpec)) match {
      case Success(sortItems) =>
        val orderBy = if (primaryKeyInSort) {
          s"ORDER BY ${sortItems.mkString(", ")}"
        } else {
          s"ORDER BY ${sortItems.mkString(", ")}, ${tableDef.getRemoteKeyField} ASC"
        }
        logger.trace(s"Parsed sort \"$orderBy\"")
        orderBy
      case Failure(err) =>
        logger.error(s"Could not parse sort $sortSpec", err)
        s"ORDER BY ${tableDef.getRemoteKeyField} ASC"
    }
  }

  private def parseSortItems(sortSpec: SortSpec): List[String] = {
    val remoteMapping = tableDef.getRemoteColumnMapping
    sortSpec.sortDefs.map { sd =>
      val direction = if (sd.sortType == SortDirection.DESCENDING.external) "DESC" else "ASC"
      val remoteColumnName = remoteMapping.getOrElse(sd.column,
        throw new IllegalArgumentException(s"Mapping missing for sort column: '${sd.column}'"))
      s"$remoteColumnName $direction"
    }
  }

}
