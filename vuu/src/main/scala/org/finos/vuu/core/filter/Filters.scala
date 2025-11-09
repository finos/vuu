package org.finos.vuu.core.filter

import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.core.table.{EmptyTablePrimaryKeys, TablePrimaryKeys}
import org.finos.vuu.net.FilterSpec
import org.finos.vuu.viewport.{RowSource, ViewPortColumns}

trait Filter {
  def doFilter(source: RowSource, primaryKeys: TablePrimaryKeys, vpColumns:ViewPortColumns): TablePrimaryKeys
}

object NoFilter extends Filter {
  override def doFilter(source: RowSource, primaryKeys: TablePrimaryKeys, vpColumns:ViewPortColumns): TablePrimaryKeys = primaryKeys
}

object FilterOutEverythingFilter extends Filter {
  override def doFilter(source: RowSource, primaryKeys: TablePrimaryKeys, vpColumns: ViewPortColumns): TablePrimaryKeys = EmptyTablePrimaryKeys
}

case class CompoundFilter(filters: Filter*) extends Filter {

  override def doFilter(source: RowSource, primaryKeys: TablePrimaryKeys, vpColumns: ViewPortColumns): TablePrimaryKeys = {
    filters.foldLeft(primaryKeys) {
      (remainingKeys, filter) => filter.doFilter(source, remainingKeys, vpColumns)
    }
  }
}




