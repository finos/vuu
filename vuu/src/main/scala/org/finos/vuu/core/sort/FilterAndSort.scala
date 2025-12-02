package org.finos.vuu.core.sort

import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.core.filter.`type`.BaseFilter
import org.finos.vuu.core.filter.{CompoundFilter, ViewPortFilter}
import org.finos.vuu.core.table.{EmptyTablePrimaryKeys, TablePrimaryKeys}
import org.finos.vuu.viewport.{RowSource, ViewPortColumns}

trait FilterAndSort {
  def filterAndSort(source: RowSource, primaryKeys: TablePrimaryKeys, vpColumns: ViewPortColumns,
                    baseFilter: BaseFilter): TablePrimaryKeys

  def filter: ViewPortFilter

  def sort: Sort
}

case class UserDefinedFilterAndSort(filter: ViewPortFilter, sort: Sort) extends FilterAndSort with StrictLogging {

  override def filterAndSort(source: RowSource, primaryKeys: TablePrimaryKeys, vpColumns: ViewPortColumns,
                             baseFilter: BaseFilter): TablePrimaryKeys = {
    logger.trace(s"Starting filter and sort with ${primaryKeys.length} rows")
    if (primaryKeys.length == 0) {
      return EmptyTablePrimaryKeys
    }

    try {
      
      val realizedFilter = CompoundFilter(baseFilter, filter)
      logger.trace("Filtering...")
      val filteredKeys = realizedFilter.doFilter(source, primaryKeys, vpColumns, firstInChain = true)
      logger.trace("Filtered. Sorting...")
      val sortedKeys = sort.doSort(source, filteredKeys, vpColumns)
      logger.trace("Sorted")
      sortedKeys
    } catch {
      case e: Throwable =>
        logger.error("Error during filtering and sorting", e)
        EmptyTablePrimaryKeys
    }
  }

}


