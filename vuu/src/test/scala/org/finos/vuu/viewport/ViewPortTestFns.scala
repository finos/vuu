package org.finos.vuu.viewport

import org.finos.vuu.core.table.TableContainer
import org.finos.vuu.provider.ProviderContainer
import org.finos.toolbox.jmx.MetricsProvider
import org.finos.toolbox.time.Clock
import org.finos.vuu.feature.inmem.VuuInMemPlugin
import org.finos.vuu.plugin.DefaultPluginRegistry


object ViewPortTestFns {

  def setupViewPort(tableContainer: TableContainer, providerContainer: ProviderContainer)(implicit time: Clock, metrics: MetricsProvider): (ViewPortContainer) = {

    val pluginRegistry = new DefaultPluginRegistry
    pluginRegistry.registerPlugin(new VuuInMemPlugin)

    val viewPortContainer = new ViewPortContainer(tableContainer, providerContainer, pluginRegistry)

    (viewPortContainer)
  }

}
