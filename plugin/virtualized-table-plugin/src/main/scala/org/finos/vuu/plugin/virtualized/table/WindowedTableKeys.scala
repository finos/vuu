package org.finos.vuu.plugin.virtualized.table

import org.finos.toolbox.collection.window.{ArrayBackedMovingWindow, MovingWindow}

object WindowedTableKeys {
  def apply(cacheSize: Int): MovingWindow[String] = {
    new ArrayBackedMovingWindow[String](cacheSize)
  }

}
