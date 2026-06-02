package org.finos.vuu.plugin.clickhouse.provider.filter

import com.github.benmanes.caffeine.cache.Caffeine
import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.api.TableDef
import org.finos.vuu.core.filter.FilterSpecParser
import org.finos.vuu.net.FilterSpec

import java.lang
import scala.util.{Failure, Success, Try}

object ClickHouseFilterFactory extends StrictLogging {

  private val NO_FILTER = ""
  private val NO_RESULTS = "WHERE 1 = 0"
  private val filterCache = Caffeine.newBuilder()
    .maximumSize(1_000)
    .build[String, String]()

  def build(filterSpec: FilterSpec): String = {
    if (filterSpec != null && filterSpec.filter != null && filterSpec.filter.nonEmpty) {      
      filterCache.get(filterSpec.filter, f => parseFilter(f))
    } else {
      logger.trace("No filter spec was provided")
      NO_FILTER
    }
  }

  private def parseFilter(filterSpec: String): String = {
    val filterVisitor = new ClickHouseFilterVisitor()
    Try(FilterSpecParser.parse(filterSpec, filterVisitor)) match {
      case Success(_) =>
        val buffer = filterVisitor.getBuffer
        if (buffer.isEmpty) {
          logger.debug("Parsed filter was empty")
          NO_FILTER
        } else {
          val whereClause = s"WHERE ${buffer.toString}" 
          logger.debug(s"Parsed filter \"$whereClause\"")
          whereClause
        }
      case Failure(err) =>
        logger.error(s"Could not parse filter $filterSpec", err)
        NO_RESULTS
    }
  }

}
