package io.venuu.vuu.core.filter

import io.venuu.toolbox.collection.array.ImmutableArray
import io.venuu.vuu.viewport.RowSource


trait Condition {
  def evaluate(key: String, row: Array[Any]): Boolean
}



//Pipeline.contains
//
//

class MultiConditionFilter extends Filter {

  override def dofilter(source: RowSource, primaryKeys: ImmutableArray[String]): ImmutableArray[String] = ???
}
