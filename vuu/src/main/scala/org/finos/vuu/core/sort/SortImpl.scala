package org.finos.vuu.core.sort

import org.finos.toolbox.time.Clock
import org.finos.vuu.core.table.Column
import org.finos.vuu.net.SortSpec

object SortImpl {
  def apply(spec: SortSpec, columns: List[Column])(implicit clock: Clock): Sort = {
    GenericSort2(spec, columns)
  }
}
