package org.finos.vuu.plugin.clickhouse.provider.sort

import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.core.sort.SortDirection
import org.finos.vuu.net.SortSpec
import org.finos.vuu.plugin.virtualized.api.{VirtualizedSessionTableColumn, VirtualizedSessionTableDef}

import scala.util.{Failure, Success, Try}

object ClickHouseSortFactory extends StrictLogging {

  def build(tableDef: VirtualizedSessionTableDef, columns: List[VirtualizedSessionTableColumn], sortSpec: SortSpec): String = {
    if (sortSpec != null && sortSpec.sortDefs != null && sortSpec.sortDefs.nonEmpty) {
      parseSort(tableDef, columns, sortSpec)
    } else {
      logger.trace(s"No sort spec was provided. Defaulting to key field ${tableDef.keyField}")
      s"ORDER BY ${tableDef.getRemoteKeyField} ASC"
    }
  }

  private def parseSort(tableDef: VirtualizedSessionTableDef,
                        columns: List[VirtualizedSessionTableColumn], sortSpec: SortSpec): String = {
    val remoteMapping: Map[String, String] = columns.map(f => f.name -> f.remoteName).toMap
    val primaryKeyInSort: Boolean = sortSpec.sortDefs.exists(f => f.column == tableDef.keyField)

    Try(parseSortItems(remoteMapping, sortSpec)) match {
      case Success(sortItems) =>
        val orderBy = if (primaryKeyInSort) {
          s"ORDER BY ${sortItems.mkString(", ")}"
        } else {
          s"ORDER BY ${sortItems.mkString(", ")}, ${tableDef.getRemoteKeyField} ASC"
        }
        logger.debug(s"Parsed sort \"$orderBy\"")
        orderBy
      case Failure(err) =>
        logger.error(s"Could not parse sort $sortSpec", err)
        s"ORDER BY ${tableDef.getRemoteKeyField} ASC"
    }
  }

  private def parseSortItems(remoteMapping: Map[String, String], sortSpec: SortSpec): List[String] = {
    sortSpec.sortDefs.map { sd =>
      val direction = if (sd.sortType == SortDirection.DESCENDING.external) "DESC" else "ASC"
      val remoteColumnName = remoteMapping.getOrElse(sd.column,
        throw new IllegalArgumentException(s"Mapping missing for sort column: '${sd.column}'"))
      s"$remoteColumnName $direction"
    }
  }

}
