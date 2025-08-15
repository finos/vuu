package org.finos.vuu.wsapi.helpers

import org.finos.vuu.api.{JoinTableDef, TableDef, ViewPortDef}
import org.finos.vuu.core.IVuuServer
import org.finos.vuu.core.module.{ModuleFactoryNode, TableDefContainer}
import org.finos.vuu.core.table.{DataTable, TableContainer}
import org.finos.vuu.provider.{Provider, ProviderContainer}

import scala.collection.immutable.ListMap

object TestExtension {
  implicit class ModuleFactoryExtension(val moduleFactoryNode: ModuleFactoryNode) {

    def addTableForTest(tableDef: TableDef): ModuleFactoryNode = {
      moduleFactoryNode.addTable(
        tableDef,
        (table, _) => new TestProvider(table, new FakeDataSource(ListMap.empty))
      )
    }

    def addTableForTest(
                         tableDef: TableDef,
                         providerFactory: (DataTable, IVuuServer) => Provider
                       ): ModuleFactoryNode = {
      moduleFactoryNode.addTable(
        tableDef,
        providerFactory
      )
    }

    def addTableForTest(
                         tableDef: TableDef,
                         ViewPortDefFactory: (DataTable, Provider, ProviderContainer, TableContainer) => ViewPortDef,
                         providerFactory: (DataTable, IVuuServer) => Provider
                       ): ModuleFactoryNode = {
      moduleFactoryNode.addTable(
        tableDef,
        providerFactory,
        ViewPortDefFactory
      )
    }

    def addJoinTableForTest(
                             func: TableDefContainer => JoinTableDef
                           ): ModuleFactoryNode = {
      moduleFactoryNode.addJoinTable(func)
    }

  }
}
