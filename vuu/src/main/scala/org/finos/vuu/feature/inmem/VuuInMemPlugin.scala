package org.finos.vuu.feature.inmem

import org.finos.toolbox.jmx.MetricsProvider
import org.finos.vuu.api.{JoinTableDef, TableDef}
import org.finos.vuu.core.table.{DataTable, JoinTable, SimpleDataTable, TableContainer}
import org.finos.vuu.feature._
import org.finos.vuu.plugin.{DefaultPlugin, PluginType}
import org.finos.vuu.provider.JoinTableProvider

object VuuInMemPluginType extends PluginType

class VuuInMemPlugin extends DefaultPlugin {
  registerFeature(TableFeature)
  registerFeature(JoinTableFeature)
  registerFeature(SessionTableFeature)
  registerFeature(TreeSessionTableFeature)
  registerFeature(ViewPortKeysFeature)
  registerFeature(SortFeature)
  registerFeature(FilterFeature)
  registerFeature(ViewPortFeature)

  override def pluginType: PluginType = VuuInMemPluginType
  override def joinTableFactory(implicit metrics: MetricsProvider): JoinTableFactory = (table: JoinTableDef, tableContainer: TableContainer, joinTableProvider: JoinTableProvider) => {
    val baseTable = tableContainer.getTable(table.baseTable.name)
    val joinTableMap = table.joins.map(join => join.table.name -> tableContainer.getTable(join.table.name)).toMap //tables.get(table.right.name)
    val baseTableMap = Map[String, DataTable](table.baseTable.name -> baseTable)

    val sourceTables = joinTableMap ++ baseTableMap

    val joinTable = new JoinTable(table, sourceTables, joinTableProvider)

    tableContainer.addTable(joinTable)
    joinTableProvider.addJoinTable(joinTable)

    joinTable
  }
  override def sessionTableFactory: SessionTableFactory = ???
  override def viewPortKeysCreator: ViewPortKeysCreator = ???
  override def viewPortFactory: ViewPortFactory = ???
  override def filterFactory: FilterFactory = ???
  override def sortFactory: SortFactory = ???
  override def tableFactory(implicit metrics: MetricsProvider): TableFactory = (tableDef: TableDef, joinTableProvider: JoinTableProvider) => {
    new SimpleDataTable(tableDef, joinTableProvider)
  }
}
