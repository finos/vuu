package org.finos.vuu.provider

import org.finos.vuu.core.table.ColumnValueProvider
import org.finos.vuu.viewport.ViewPort

trait VirtualizedProvider extends Provider with ColumnValueProvider {
  def runOnce(viewPort: ViewPort): Unit
}
