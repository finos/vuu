package org.finos.vuu.provider

import org.finos.vuu.viewport.ViewPort

trait VirtualizedProvider extends Provider {
  def runOnce(viewPort: ViewPort): Unit

}
