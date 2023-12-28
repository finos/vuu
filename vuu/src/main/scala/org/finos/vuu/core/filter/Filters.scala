package org.finos.vuu.core.filter

import org.finos.vuu.viewport.{RowSource, ViewPortColumns}
import org.finos.toolbox.collection.array.ImmutableArray
import org.finos.vuu.core.table.TablePrimaryKeys

trait Filter {
  def dofilter(source: RowSource, primaryKeys: TablePrimaryKeys, vpColumns:ViewPortColumns): TablePrimaryKeys
}

object NoFilter extends Filter {
  override def dofilter(source: RowSource, primaryKeys: TablePrimaryKeys, vpColumns:ViewPortColumns): TablePrimaryKeys = primaryKeys
}




