package org.finos.vuu.plugin.virtualized.provider

import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.core.table.ColumnValueProvider
import org.finos.vuu.plugin.virtualized.table.VirtualizedSessionTable
import org.finos.vuu.provider.Provider
import org.finos.vuu.viewport.ViewPort

trait VirtualizedProvider extends Provider with ColumnValueProvider with StrictLogging {

  def runOnce(viewPort: ViewPort): Unit = {
    viewPort.table.asTable match {
        case table: VirtualizedSessionTable =>
          if (table.needsRefresh(viewPort)) {
            logger.trace(s"Viewport ${viewPort.id} in session ${viewPort.session.sessionId} needs a refresh.")
            runOnceInternal(viewPort)
          } else {
            logger.trace(s"Viewport ${viewPort.id} in session ${viewPort.session.sessionId} does not need a refresh.")
          }
        case _ => logger.error(s"ViewPort ${viewPort.id} in session ${viewPort.session.sessionId} has a VirtualizedProvider but no VirtualizedSessionTable")
      }
  }

  def runOnceInternal(viewPort: ViewPort): Unit

}
