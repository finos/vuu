package org.finos.vuu.viewport

import com.typesafe.scalalogging.StrictLogging
import org.finos.toolbox.thread.WorkItem
import org.finos.vuu.viewport.InMemViewPortWorkItem.logger

import scala.util.control.NonFatal

object InMemViewPortWorkItem extends StrictLogging {
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
      case NonFatal(e) =>
        logger.error(s"Exception encountered during viewport callable execution: ${e.getMessage}", e)
        throw e
    }
  }
}

object InMemViewPortTreeWorkItem extends StrictLogging {
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
      case NonFatal(e) =>
        logger.error(s"Exception encountered during tree viewport callable execution: ${e.getMessage}", e)
        throw e
    }
  }
}

