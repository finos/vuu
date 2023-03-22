package org.finos.vuu.core.filter

import org.finos.vuu.viewport.{RowSource, ViewPortColumns}
import org.finos.toolbox.collection.array.ImmutableArray

trait Filter {
  def dofilter(source: RowSource, primaryKeys: ImmutableArray[String], vpColumns:ViewPortColumns): ImmutableArray[String]
}

object NoFilter extends Filter {
  override def dofilter(source: RowSource, primaryKeys: ImmutableArray[String], vpColumns:ViewPortColumns): ImmutableArray[String] = primaryKeys
}




