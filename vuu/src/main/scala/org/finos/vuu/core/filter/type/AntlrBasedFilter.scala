package org.finos.vuu.core.filter.`type`

import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.core.filter.{Filter, FilterClause, ViewPortFilter}
import org.finos.vuu.core.table.column.{Error, Success}
import org.finos.vuu.core.table.{EmptyTablePrimaryKeys, TablePrimaryKeys}
import org.finos.vuu.viewport.{RowSource, ViewPortColumns}

case class AntlrBasedFilter(clause: FilterClause) extends ViewPortFilter with StrictLogging {

  override def doFilter(source: RowSource, rowKeys: TablePrimaryKeys, vpColumns: ViewPortColumns, firstInChain: Boolean): TablePrimaryKeys = {
    logger.trace(s"Starting filter with ${rowKeys.length}")
    clause.filterAllSafe(source, rowKeys, vpColumns, firstInChain) match {
      case Success(filteredKeys) =>
        logger.trace(s"Complete filter with ${filteredKeys.length}")
        filteredKeys
      case Error(msg) =>
        logger.error(s"Error occurred while filtering: ${System.lineSeparator()} $msg")
        EmptyTablePrimaryKeys
    }
  }

}
