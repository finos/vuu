package org.finos.vuu.feature.ignite

import org.finos.toolbox.jmx.MetricsProvider
import org.finos.vuu.feature.{FilterFactory, JoinTableFactory, SessionTableFactory, SortFactory, TableFactory, ViewPortFactory, ViewPortKeysCreator}
import org.finos.vuu.plugin.{DefaultPlugin, PluginType}

object VuuIgnitePluginType extends PluginType

object VuuIgnitePlugin extends DefaultPlugin {

  override def tableFactory(implicit metrics: MetricsProvider): TableFactory = {
    null
  }

  override def pluginType: PluginType = VuuIgnitePluginType

  override def joinTableFactory(implicit metrics: MetricsProvider): JoinTableFactory = ???

  override def sessionTableFactory: SessionTableFactory = ???

  override def viewPortKeysCreator: ViewPortKeysCreator = ???

  override def viewPortFactory: ViewPortFactory = ???

  override def filterFactory: FilterFactory = ???

  override def sortFactory: SortFactory = ???
}
