package org.finos.vuu.plugin.clickhouse.provider.sort

import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.core.sort.SortDirection
import org.finos.vuu.net.SortSpec
import org.finos.vuu.plugin.virtualized.api.VirtualizedSessionTableColumn

import scala.util.{Failure, Success, Try}

object ClickHouseSortFactory extends StrictLogging {

  private val NO_SORT = ""

  def build(keyField: String, columns: List[VirtualizedSessionTableColumn], sortSpec: SortSpec): String = {
    if (sortSpec != null && sortSpec.sortDefs != null && sortSpec.sortDefs.nonEmpty) {
      parseSort(columns, sortSpec)
    } else {
      s"ORDER BY $keyField"
    }
  }

  private def parseSort(columns: List[VirtualizedSessionTableColumn], sortSpec: SortSpec): String = {
    val remoteMapping: Map[String, String] = columns.map(f => f.name -> f.remoteName).toMap

    Try(parseSortItems(remoteMapping, sortSpec)) match {
      case Success(sortItems) =>
        val orderBy = s"ORDER BY ${sortItems.mkString(", ")}"
        logger.debug(s"Parsed sort \"$orderBy\"")
        orderBy
      case Failure(err) =>
        logger.error(s"Could not parse sort $sortSpec", err)
        NO_SORT
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
