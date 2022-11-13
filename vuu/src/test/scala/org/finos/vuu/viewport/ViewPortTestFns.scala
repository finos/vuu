package org.finos.vuu.viewport

import org.finos.vuu.core.table.TableContainer
import org.finos.vuu.provider.ProviderContainer
import org.finos.toolbox.jmx.MetricsProvider
import org.finos.toolbox.time.Clock


object ViewPortTestFns {

  def setupViewPort(tableContainer: TableContainer, providerContainer: ProviderContainer)(implicit time: Clock, metrics: MetricsProvider): (ViewPortContainer) = {

    val viewPortContainer = new ViewPortContainer(tableContainer, providerContainer)

    (viewPortContainer)
  }

}
