package org.finos.vuu.core.filter

import org.finos.vuu.core.table.{EmptyTablePrimaryKeys, TablePrimaryKeys}
import org.finos.vuu.viewport.{RowSource, ViewPortColumns}

trait Filter {
  def dofilter(source: RowSource, primaryKeys: TablePrimaryKeys, vpColumns:ViewPortColumns): TablePrimaryKeys
}

object NoFilter extends Filter {
  override def dofilter(source: RowSource, primaryKeys: TablePrimaryKeys, vpColumns:ViewPortColumns): TablePrimaryKeys = primaryKeys
}

object FilterOutEverythingFilter extends Filter {
  override def dofilter(source: RowSource, primaryKeys: TablePrimaryKeys, vpColumns: ViewPortColumns): TablePrimaryKeys = EmptyTablePrimaryKeys
}




