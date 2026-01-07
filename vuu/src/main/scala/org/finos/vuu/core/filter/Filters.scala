package org.finos.vuu.core.filter

import org.finos.vuu.core.table.{EmptyTablePrimaryKeys, TablePrimaryKeys}
import org.finos.vuu.viewport.{RowSource, ViewPortColumns}

trait Filter {
  def doFilter(source: RowSource, primaryKeys: TablePrimaryKeys, firstInChain: Boolean): TablePrimaryKeys
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

case class CompoundFilter(filters: ViewPortFilter*) extends ViewPortFilter {

  override def doFilter(source: RowSource, primaryKeys: TablePrimaryKeys, 
                        vpColumns: ViewPortColumns, firstInChain: Boolean): TablePrimaryKeys = {
    if (primaryKeys.isEmpty) {
      primaryKeys
    } else {
      filters.foldLeft(primaryKeys) {
        (remainingKeys, filter) => {
          if (remainingKeys.isEmpty) {
            remainingKeys
          } else {
            val stillFirstInChain = firstInChain && remainingKeys == primaryKeys
            filter.doFilter(source, remainingKeys, vpColumns, stillFirstInChain)
          }
        }
      }
    }
  }
}