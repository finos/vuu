package org.finos.vuu.plugin.clickhouse.provider.filter

import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.core.filter.FilterSpecParser
import org.finos.vuu.net.FilterSpec
import org.finos.vuu.plugin.virtualized.api.VirtualizedSessionTableDef

import scala.collection.mutable
import scala.util.{Failure, Success, Try}

class ClickHouseFilterFactory(tableDef: VirtualizedSessionTableDef) extends StrictLogging {

  def build(filterSpec: FilterSpec): ClauseWithParams = {
    val safeFilter = safeFilterString(filterSpec)
    parseFilter(safeFilter)
  }

  def build(userSpec: FilterSpec, permissionSpec: FilterSpec): ClauseWithParams = {
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

  private def parseFilter(filterSpec: String): ClauseWithParams = {
    if (filterSpec.isBlank) {
      logger.trace("Filter spec is blank, returning no filter")
      return NoFilter
    }

    val stringBuilder = new java.lang.StringBuilder(256)
    val params = new mutable.HashMap[String, Any]()
    val filterVisitor = ClickHouseFilterVisitor(
      remoteNameMapping = tableDef.getRemoteColumnMapping,
      stringBuilder = stringBuilder,
      params = params
    )

    Try(FilterSpecParser.parse(filterSpec, filterVisitor)) match {
      case Success(_) =>
        if (stringBuilder.length == 0) {
          logger.warn("Parsed filter was empty")
          NoResults
        } else {
          val whereClause = stringBuilder.toString
          logger.trace(s"Parsed filter: $whereClause with params $params")
          ClauseWithParams(whereClause, params.toMap)
        }

      case Failure(err) =>
        logger.error(s"Could not parse filter: '$filterSpec'", err)
        NoResults
    }
  }

  private def safeFilterString(spec: FilterSpec): String = {
    if (spec == null || spec.filter == null || spec.filter.isBlank) ""
    else spec.filter
  }

}
