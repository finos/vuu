package org.finos.vuu.viewport

import com.typesafe.scalalogging.StrictLogging
import org.finos.toolbox.thread.WorkItem

object ViewPortWorkItem extends StrictLogging {
  def apply(viewPort: ViewPort, container: ViewPortContainer): WorkItem[ViewPort] = {
    try {
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
    } catch {
      case e: Exception => logger.error(e.getMessage + " " + e.getStackTrace)
        null
    }
  }
}

object ViewPortTreeWorkItem extends StrictLogging {
  def apply(viewPort: ViewPort, container: ViewPortContainer): WorkItem[ViewPort] = {
    try {
      new WorkItem[ViewPort] {
        override def doWork(): ViewPort = {
          container.refreshOneTreeViewPort(viewPort)
          viewPort
        }

        override def toString: String = "TreeRunner:[" + viewPort + "]"

        override def hashCode(): Int = viewPort.hashCode()

        override def equals(obj: Any): Boolean = {
          this.hashCode() == obj.hashCode()
        }
      }
    } catch {
      case e: Exception => logger.error(e.getMessage + " " + e.getStackTrace)
        null
    }
  }
}

