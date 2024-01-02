package org.finos.vuu.plugin
import org.finos.toolbox.jmx.MetricsProvider
import org.finos.vuu.api.TableDef
import org.finos.vuu.core.table.DataTable
import org.finos.vuu.feature.{Feature, FilterFactory, JoinTableFactory, SessionTableFactory, SortFactory, TableFactory, ViewPortCallableFactory, ViewPortFactory, ViewPortKeysCreator, ViewPortTreeCallableFactory}
import org.finos.vuu.provider.JoinTableProvider

object TestPlugin{
  def apply(): Plugin = {
    new TestPlugin()
  }
}

class TestPlugin extends Plugin with TableFactory {
  override def hasFeature(feature: Feature): Boolean = ???
  override def registerFeature(feature: Feature): Unit = ???

  override def tableFactory(implicit metrics: MetricsProvider): TableFactory = ???

  override def pluginType: PluginType = ???

  override def joinTableFactory(implicit metrics: MetricsProvider): JoinTableFactory = ???

  override def sessionTableFactory: SessionTableFactory = ???

  override def viewPortKeysCreator: ViewPortKeysCreator = ???

  override def viewPortFactory: ViewPortFactory = ???

  override def filterFactory: FilterFactory = ???

  override def sortFactory: SortFactory = ???

  override def createTable(tableDef: TableDef, joinTableProvider: JoinTableProvider): DataTable = ???

  override def viewPortCallableFactory: ViewPortCallableFactory = ???

  override def viewPortTreeCallableFactory: ViewPortTreeCallableFactory = ???
}
