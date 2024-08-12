package org.finos.vuu.net

import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.Clock
import org.finos.vuu.api.{TableDef, ViewPortDef}
import org.finos.vuu.core.IVuuServer
import org.finos.vuu.core.module.{ModuleFactory, ModuleFactoryNode, TableDefContainer, ViewServerModule}
import org.finos.vuu.core.table.{DataTable, TableContainer}
import org.finos.vuu.provider.{MockProvider, Provider, ProviderContainer}


object TestExtension {
  implicit class ModuleFactoryExtension(val moduleFactoryNode: ModuleFactoryNode) {

    def addTableForTest(tableDef: TableDef)(implicit clock: Clock, lifecycle: LifecycleContainer): ModuleFactoryNode = {
      moduleFactoryNode.addTable(
        tableDef,
        (table, _) => new MockProvider(table)
      )
    }

    def addTableForTest(
                         tableDef: TableDef,
                         ViewPortDefFactory: (DataTable, Provider, ProviderContainer, TableContainer) => ViewPortDef,
                         providerFactory: (DataTable, IVuuServer) => Provider
                       )(implicit clock: Clock, lifecycle: LifecycleContainer): ModuleFactoryNode = {
      moduleFactoryNode.addTable(
        tableDef,
        providerFactory,
        ViewPortDefFactory
      )
    }

  }
}
class TestModuleBuilder(moduleName:String)(implicit clock: Clock, lifecycle: LifecycleContainer, tableDefContainer: TableDefContainer){

  private var moduleFactory = ModuleFactory.withNamespace(moduleName)

  def withTable(tableDef: TableDef, viewPortDef: ViewPortDef): TestModuleBuilder = {
    moduleFactory = moduleFactory.addTable(
      tableDef,
      (table, _) => new MockProvider(table),
      (_, _, _, _) => viewPortDef
    )
    this
  }

  def build(moduleName: String, tableDef: TableDef, viewPortDef: ViewPortDef)(implicit clock: Clock, lifecycle: LifecycleContainer, tableDefContainer: TableDefContainer): ViewServerModule =
  ModuleFactory.withNamespace(moduleName)
      .addTable(
        tableDef,
        (table, _) => new MockProvider(table),
        (_, _, _, _) => viewPortDef
      )
      .asModule()

  def build(moduleName: String, tableDef: TableDef)(implicit clock: Clock, lifecycle: LifecycleContainer, tableDefContainer: TableDefContainer): ViewServerModule =
    ModuleFactory.withNamespace(moduleName)
      .addTable(
        tableDef,
        (table, _) => new MockProvider(table)
      )
      .asModule()


}
