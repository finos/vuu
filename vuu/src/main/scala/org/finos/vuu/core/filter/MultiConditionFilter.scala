package org.finos.vuu.core.filter

import org.finos.vuu.viewport.{RowSource, ViewPortColumns}
import org.finos.toolbox.collection.array.ImmutableArray


trait Condition {
  def evaluate(key: String, row: Array[Any]): Boolean
}



//Pipeline.contains
//
//

class MultiConditionFilter extends Filter {
  override def dofilter(source: RowSource, primaryKeys: ImmutableArray[String], viewPortColumns: ViewPortColumns): ImmutableArray[String] = ???
}
