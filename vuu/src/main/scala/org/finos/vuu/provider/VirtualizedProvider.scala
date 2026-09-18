package org.finos.vuu.provider

import org.finos.vuu.core.table.ColumnValueProvider
import org.finos.vuu.viewport.ViewPort

trait VirtualizedProvider extends Provider with ColumnValueProvider {

  final def runOnce(viewPort: ViewPort): Unit = {
    if (shouldRun(viewPort)) {
      runOnceInternal(viewPort)
    }
  }

  def shouldRun(viewPort: ViewPort): Boolean = true

  def runOnceInternal(viewPort: ViewPort) : Unit

}
