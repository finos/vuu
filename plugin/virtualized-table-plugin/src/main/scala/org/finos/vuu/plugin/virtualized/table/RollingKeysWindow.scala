package org.finos.vuu.plugin.virtualized.table

import org.finos.toolbox.collection.window.{ArrayBackedMovingWindow, MovingWindow}

object RollingKeysWindow {
  def apply(cacheSize: Int): MovingWindow[String] = {
    new ArrayBackedMovingWindow[String](cacheSize)
  }

}
