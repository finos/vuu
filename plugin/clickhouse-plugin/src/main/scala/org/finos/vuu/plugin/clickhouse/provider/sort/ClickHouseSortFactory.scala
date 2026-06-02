package org.finos.vuu.plugin.clickhouse.provider.sort

import com.github.benmanes.caffeine.cache.Caffeine
import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.core.sort.SortDirection
import org.finos.vuu.net.SortSpec

object ClickHouseSortFactory extends StrictLogging {

  private val NO_SORT = ""
  private val sortCache = Caffeine.newBuilder()
    .maximumSize(1_000)
    .build[SortSpec, String]()

  def build(sortSpec: SortSpec): String = {
    if (sortSpec != null && sortSpec.sortDefs != null && sortSpec.sortDefs.nonEmpty) {
      sortCache.get(sortSpec, f => parseSort(f))
    } else {
      logger.trace("No sort spec was provided")
      NO_SORT
    }
  }

  private def parseSort(sortSpec: SortSpec): String = {
    val sortItems = sortSpec.sortDefs.map { sd =>
      val direction = if (sd.sortType == SortDirection.DESCENDING.external) "DESC" else "ASC"
      s"${sd.column} $direction"
    }
    val orderBy = s"ORDER BY ${sortItems.mkString(", ")}"
    logger.debug(s"Parsed sort \"$orderBy\"")
    orderBy
  }

}
