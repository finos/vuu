package org.finos.vuu.plugin.offheap

import org.finos.toolbox.jmx.MetricsProvider
import org.finos.toolbox.time.Clock
import org.finos.vuu.api.TableDef
import org.finos.vuu.core.table.{InMemDataTable, TableContainer}
import org.finos.vuu.feature.{FilterFactory, JoinTableFactory, SessionTableFactory, SortFactory, TableFactory, TableFeature, ViewPortCallableFactory, ViewPortFactory, ViewPortKeysCreator, ViewPortTableCreator, ViewPortTreeCallableFactory}
import org.finos.vuu.plugin.offheap.table.OffHeapDataTable
import org.finos.vuu.plugin.{DefaultPlugin, PluginType}
import org.finos.vuu.provider.JoinTableProvider

object OffHeapTablePlugin extends DefaultPlugin {

  registerFeature(TableFeature)

  override def tableFactory(implicit metrics: MetricsProvider): TableFactory = (tableDef: TableDef, tableContainer: TableContainer, joinTableProvider: JoinTableProvider) => {
    given clock: Clock = tableContainer.timeProvider
    val table = new OffHeapDataTable(tableDef, joinTableProvider)
    tableContainer.addTable(table)
    table
  }

  override def pluginType: PluginType = OffHeapTablePluginType

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