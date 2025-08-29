package org.finos.vuu.feature.ignite

import org.finos.toolbox.jmx.MetricsProvider
import org.finos.toolbox.time.Clock
import org.finos.vuu.feature.{FilterFactory, JoinTableFactory, SessionTableFactory, SortFactory, TableFactory, ViewPortCallableFactory, ViewPortFactory, ViewPortKeysCreator, ViewPortTableCreator, ViewPortTreeCallableFactory}
import org.finos.vuu.plugin.{DefaultPlugin, PluginType}

object VuuIgnitePluginType extends PluginType

object VuuIgnitePlugin extends DefaultPlugin {

  override def tableFactory(implicit metrics: MetricsProvider): TableFactory = {
    null
  }

  override def pluginType: PluginType = VuuIgnitePluginType

  override def joinTableFactory(implicit metrics: MetricsProvider, timeProvider: Clock): JoinTableFactory = ???

  override def sessionTableFactory: SessionTableFactory = ???

  override def viewPortKeysCreator: ViewPortKeysCreator = ???

  override def viewPortFactory: ViewPortFactory = ???

  override def filterFactory: FilterFactory = ???

  override def sortFactory: SortFactory = ???

  override def viewPortCallableFactory: ViewPortCallableFactory = ???

  override def viewPortTreeCallableFactory: ViewPortTreeCallableFactory = ???

  override def viewPortTableCreator: ViewPortTableCreator = ???
}
