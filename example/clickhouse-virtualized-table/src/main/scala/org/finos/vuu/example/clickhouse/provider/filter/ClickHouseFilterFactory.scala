package org.finos.vuu.example.clickhouse.provider.filter

import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.api.TableDef
import org.finos.vuu.core.filter.FilterSpecParser
import org.finos.vuu.net.FilterSpec

import scala.util.{Failure, Success, Try}

object ClickHouseFilterFactory extends StrictLogging {

  private val NO_FILTER = ""
  private val NO_RESULTS = "WHERE 1 = 0"

  def build(filterSpec: FilterSpec, tableDef: TableDef): String = {
    if (filterSpec != null && filterSpec.filter != null && filterSpec.filter.nonEmpty) {
      parseWhereClause(filterSpec, tableDef)
    } else {
      logger.debug("No filter spec was provided")
      NO_FILTER
    }
  }

  private def parseWhereClause(filterSpec: FilterSpec, tableDef: TableDef): String = {
    Try(FilterSpecParser.parse(filterSpec.filter, new ClickHouseFilterVisitor())) match {
      case Success(clause) =>
        if (clause.isEmpty) {
          logger.debug("Parsed filter was empty")
          NO_FILTER
        } else {
          logger.debug(s"Applying filter ${filterSpec.filter}")
          s"WHERE $clause"
        }
      case Failure(err) =>
        logger.error(s"Could not parse filter ${filterSpec.filter}", err)
        NO_RESULTS
    }
  }

}
