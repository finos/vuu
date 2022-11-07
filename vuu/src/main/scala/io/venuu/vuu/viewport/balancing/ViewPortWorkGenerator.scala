package io.venuu.vuu.viewport.balancing

import io.venuu.toolbox.thread.balancing.{TimedWork, WorkGenerator}
import io.venuu.vuu.viewport.{ViewPort, ViewPortContainer}

class ViewPortWorkGenerator(val viewPortContainer: ViewPortContainer) extends WorkGenerator[ViewPort] {

  override def generate(): List[TimedWork[ViewPort]] = {
    viewPortContainer.toViewPortUnitsOfWork()
  }
}
