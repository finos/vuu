package org.finos.vuu.plugin
import org.finos.vuu.api.TableDef
import org.finos.vuu.core.table.DataTable
import org.finos.vuu.feature.{Feature, TableFactory}

object TestPlugin{
  def apply(): Plugin = {
    new TestPlugin()
  }
}

class TestPlugin extends Plugin with TableFactory {
  override def hasFeature(feature: Feature): Boolean = ???
  override def registerFeature(feature: Feature): Unit = ???
  override def createTable(tableDef: TableDef): DataTable = ???
}
