package org.finos.vuu.table.virtualized

import org.finos.toolbox.collection.window.{ArrayBackedMovingWindow, MovingWindow}

object RollingKeysWindow {
  def apply(cacheSize: Int): MovingWindow[String] = {
    new ArrayBackedMovingWindow[String](cacheSize)
  }

}
