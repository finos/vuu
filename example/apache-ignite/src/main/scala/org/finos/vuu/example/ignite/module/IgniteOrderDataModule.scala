package org.finos.vuu.example.ignite.module

import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.Clock
import org.finos.vuu.api.ViewPortDef
import org.finos.vuu.core.module.{DefaultModule, ModuleFactory, TableDefContainer, ViewServerModule}
import org.finos.vuu.core.table.{Column, Columns}
import org.finos.vuu.example.ignite.IgniteOrderStore
import org.finos.vuu.example.ignite.provider.IgniteOrderDataProvider
import org.finos.vuu.net.rpc.RpcHandler
import org.finos.vuu.plugin.virtualized.api.VirtualizedSessionTableDef

class NoOpIgniteService extends RpcHandler

object IgniteOrderDataModule extends DefaultModule {
  private final val NAME = "IGNITE"

  def apply(igniteOrderStore: IgniteOrderStore)(implicit clock: Clock, lifecycle: LifecycleContainer, tableDefContainer: TableDefContainer): ViewServerModule = {
    ModuleFactory.withNamespace(NAME)
      .addSessionTable(
        VirtualizedSessionTableDef(
          name = "bigOrders2",
          keyField = "orderId",
          columns
        ),
        (_, _) => new IgniteOrderDataProvider(igniteOrderStore),
        (table, _, _, _) => ViewPortDef(
          columns = table.getTableDef.getColumns,
          service = new NoOpIgniteService()
        )
      ).asModule()
  }

  val columns: Array[Column] = Columns.fromNames("orderId".int(), "ric".string(), "quantity".int(), "price".double(), "side".string(), "strategy".string(), "parentId".int())
}
