package org.finos.vuu.plugin.clickhouse.provider.filter

import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.core.filter.FilterSpecParser
import org.finos.vuu.net.FilterSpec
import org.finos.vuu.plugin.virtualized.api.VirtualizedSessionTableDef
import org.finos.vuu.viewport.ViewPort

import scala.util.{Failure, Success, Try}

object ClickHouseFilterFactory {
  private val NoFilter = ""
  private val NoResults = "WHERE 1 = 0"
  private val WherePrefix = "WHERE "
}

class ClickHouseFilterFactory(tableDef: VirtualizedSessionTableDef) extends StrictLogging {
  import ClickHouseFilterFactory.*

  private val remoteMapping: Map[String, String] = tableDef
    .getRemoteColumns.map(f => f.name -> f.remoteName)
    .toMap

  def build(viewPort: ViewPort): String = {
    val userSpec = viewPort.filterSpec
    val permissionSpec = tableDef.getRemotePermissionFilterSpecFunction.apply(viewPort)

    val userFilterStr = safeFilterString(userSpec)
    val permFilterStr = safeFilterString(permissionSpec)

    if (userFilterStr.isEmpty && permFilterStr.isEmpty) {
      NoFilter
    } else {
      val combined =
        if (userFilterStr.nonEmpty && permFilterStr.nonEmpty) {
          s"($permFilterStr) and ($userFilterStr)"
        } else if (userFilterStr.nonEmpty) {
          userFilterStr
        } else {
          permFilterStr
        }

      parseFilter(combined)
    }
  }

  private def parseFilter(filterSpec: String): String = {
    if (filterSpec.isBlank) {
      logger.trace("Filter spec is blank, returning no filter")
      return NoFilter
    }

    val filterVisitor = new ClickHouseFilterVisitor(remoteMapping)

    Try(FilterSpecParser.parse(filterSpec, filterVisitor)) match {
      case Success(_) =>
        val buffer = filterVisitor.getBuffer
        if (buffer == null || buffer.length == 0) {
          logger.trace("Parsed filter was empty")
          NoFilter
        } else {
          val whereClause = s"$WherePrefix${buffer.toString}"
          logger.trace(s"Parsed filter: $whereClause")
          whereClause
        }

      case Failure(err) =>
        logger.error(s"Could not parse filter: $filterSpec", err)
        NoResults
    }
  }

  private def safeFilterString(spec: FilterSpec): String = {
    if (spec == null || spec.filter == null || spec.filter.isBlank) ""
    else spec.filter
  }

}
