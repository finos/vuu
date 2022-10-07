package io.venuu.vuu.viewport

import io.venuu.toolbox.jmx.MetricsProvider
import io.venuu.toolbox.time.Clock
import io.venuu.vuu.core.table.TableContainer
import io.venuu.vuu.provider.ProviderContainer


object ViewPortTestFns {

  def setupViewPort(tableContainer: TableContainer, providerContainer: ProviderContainer)(implicit time: Clock, metrics: MetricsProvider): (ViewPortContainer) = {

    val viewPortContainer = new ViewPortContainer(tableContainer, providerContainer)

    (viewPortContainer)
  }

}
