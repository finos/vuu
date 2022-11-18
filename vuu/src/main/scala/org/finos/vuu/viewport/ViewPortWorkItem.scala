package org.finos.vuu.viewport

import org.finos.toolbox.thread.WorkItem

object ViewPortWorkItem{
  def apply(viewPort: ViewPort, container: ViewPortContainer): WorkItem[ViewPort] = {
    new WorkItem[ViewPort] {
      override def doWork(): ViewPort = {
        container.refreshOneViewPort(viewPort)
        viewPort
      }
      override def toString: String = "Runner:[" + viewPort + "]"
      override def hashCode(): Int = viewPort.hashCode()
      override def equals(obj: Any): Boolean = {
        this.hashCode() == obj.hashCode()
      }
    }
  }
}
