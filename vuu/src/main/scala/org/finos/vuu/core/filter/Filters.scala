package org.finos.vuu.core.filter

import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.core.table.{EmptyTablePrimaryKeys, TablePrimaryKeys}
import org.finos.vuu.viewport.{RowSource, ViewPortColumns}

trait Filter {
  def doFilter(source: RowSource, primaryKeys: TablePrimaryKeys, firstInChain: Boolean): TablePrimaryKeys
}

case class CompoundFilter(filters: Filter*) extends Filter with StrictLogging {

  override def doFilter(source: RowSource, primaryKeys: TablePrimaryKeys, firstInChain: Boolean): TablePrimaryKeys = {
    logger.trace(s"Starting filter with ${primaryKeys.length} rows")
    if (primaryKeys.isEmpty || filters.isEmpty) return primaryKeys

    var currentKeys = primaryKeys
    val filterIterator = filters.iterator

    while (filterIterator.hasNext && currentKeys.nonEmpty) {
      val filter = filterIterator.next()
      val stillFirst = firstInChain && (currentKeys eq primaryKeys)
      currentKeys = filter.doFilter(source, currentKeys, stillFirst)
    }

    currentKeys
  }
}

trait ViewPortFilter {
  def doFilter(source: RowSource, primaryKeys: TablePrimaryKeys, vpColumns:ViewPortColumns, firstInChain: Boolean): TablePrimaryKeys
}

object NoFilter extends ViewPortFilter {
  override def doFilter(source: RowSource, primaryKeys: TablePrimaryKeys, 
                        vpColumns:ViewPortColumns, firstInChain: Boolean): TablePrimaryKeys = primaryKeys
}

object FilterOutEverythingFilter extends ViewPortFilter {
  override def doFilter(source: RowSource, primaryKeys: TablePrimaryKeys,
                        vpColumns: ViewPortColumns, firstInChain: Boolean): TablePrimaryKeys = EmptyTablePrimaryKeys
}

case class CompoundViewPortFilter(filters: ViewPortFilter*) extends ViewPortFilter with StrictLogging {

  override def doFilter(source: RowSource, primaryKeys: TablePrimaryKeys, 
                        vpColumns: ViewPortColumns, firstInChain: Boolean): TablePrimaryKeys = {
    logger.trace(s"Starting filter with ${primaryKeys.length} rows")
    if (primaryKeys.isEmpty || filters.isEmpty) return primaryKeys

    var currentKeys = primaryKeys
    val filterIterator = filters.iterator

    while (filterIterator.hasNext && currentKeys.nonEmpty) {
      val filter = filterIterator.next()      
      val stillFirst = firstInChain && (currentKeys eq primaryKeys)
      currentKeys = filter.doFilter(source, currentKeys, vpColumns, stillFirst)
    }

    currentKeys
  }
}