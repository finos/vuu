package org.finos.vuu.plugin.virtualized

import org.finos.toolbox.jmx.MetricsProvider
import org.finos.vuu.api.TableDef
import org.finos.vuu.core.table.{InMemDataTable, TableContainer}
import org.finos.vuu.feature.{FilterFactory, JoinTableFactory, SessionTableFactory, SortFactory, TableFactory, ViewPortCallableFactory, ViewPortFactory, ViewPortKeysCreator, ViewPortTableCreator, ViewPortTreeCallableFactory}
import org.finos.vuu.plugin.virtualized.plugin.ViewPortVirtualizedTableCreator
import org.finos.vuu.plugin.virtualized.viewport.VirtualizedViewPortCallableFactory
import org.finos.vuu.plugin.{DefaultPlugin, PluginType}
import org.finos.vuu.provider.JoinTableProvider


object VirtualizedTablePlugin extends DefaultPlugin {

  final val callableFactory = new VirtualizedViewPortCallableFactory

  override def tableFactory(implicit metrics: MetricsProvider): TableFactory = (tableDef: TableDef, tableContainer: TableContainer, joinTableProvider: JoinTableProvider) => {
    val table = new InMemDataTable(tableDef, joinTableProvider)
    tableContainer.addTable(table)
    table
  }

  override def pluginType: PluginType = VirtualizedTablePluginType

  override def joinTableFactory(implicit metrics: MetricsProvider): JoinTableFactory = ???

  override def sessionTableFactory: SessionTableFactory = ???

  override def viewPortKeysCreator: ViewPortKeysCreator = ???

  override def viewPortFactory: ViewPortFactory = ???

  override def filterFactory: FilterFactory = ???

  override def sortFactory: SortFactory = ???

  override def viewPortCallableFactory: ViewPortCallableFactory = callableFactory

  override def viewPortTreeCallableFactory: ViewPortTreeCallableFactory = ???

  override def viewPortTableCreator: ViewPortTableCreator = ViewPortVirtualizedTableCreator
}
