package org.finos.vuu.plugin.virtualized.viewport

import com.typesafe.scalalogging.StrictLogging
import org.finos.toolbox.thread.WorkItem
import org.finos.vuu.provider.VirtualizedProvider
import org.finos.vuu.viewport.{ViewPort, ViewPortContainer}

import scala.util.control.NonFatal

object VirtualizedViewPortWorkItem extends StrictLogging{

  def apply(viewPort: ViewPort, container: ViewPortContainer): WorkItem[ViewPort] = {
    try {
      new WorkItem[ViewPort] {
        override def doWork(): ViewPort = {

          val provider = viewPort.table.asTable.getProvider

          provider match {
            case virt: VirtualizedProvider =>
              virt.runOnce(viewPort)
            case _ => logger.error("trying to calculate a virtualized table def with a non virtualized provider. Provider must extend org.finos.vuu.provider.VirtualizedProvider")
          }

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
        logger.error(s"Exception encountered during viewport work item execution: ${e.getMessage}", e)
        throw e
    }
  }

}
