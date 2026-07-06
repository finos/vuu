package org.finos.vuu.plugin.virtualized.viewport

import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.provider.VirtualizedProvider
import org.finos.vuu.viewport.{ViewPort, ViewPortContainer}

import java.util.concurrent.{Callable, FutureTask}
import scala.util.control.NonFatal

object VirtualizedViewPortCallable extends StrictLogging {

  def apply(r: FutureTask[ViewPort], viewPortContainer: ViewPortContainer): Callable[ViewPort] = {
    () => {
      try {
        val viewport = r.get()
        val provider = viewport.table.asTable.getProvider

        provider match {

          case virt: VirtualizedProvider =>
            virt.runOnce(viewport)

          case _ => logger.error("trying to calculate a virtualized table def with a non virtualized provider. Provider must extend org.finos.vuu.provider.VirtualizedProvider")
        }

        viewport
      } catch {
        case NonFatal(e) =>
          logger.error(s"Exception encountered during viewport callable execution: ${e.getMessage}", e)
          throw e
      }
    }
  }

}
