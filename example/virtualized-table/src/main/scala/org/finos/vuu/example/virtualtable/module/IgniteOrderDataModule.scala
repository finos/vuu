package org.finos.vuu.example.virtualtable.module

import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.Clock
import org.finos.vuu.api.ViewPortDef
import org.finos.vuu.core.module.{DefaultModule, ModuleFactory, TableDefContainer, ViewServerModule}
import org.finos.vuu.core.table.Columns
import org.finos.vuu.data.order.ignite.IgniteOrderStore
import org.finos.vuu.example.virtualtable.provider.IgniteOrderDataProvider
import org.finos.vuu.plugin.virtualized.api.VirtualizedSessionTableDef


object IgniteOrderDataModule extends DefaultModule {
  final val NAME = "IGNITE_ORDER_VIRTUAL"

  def apply(igniteOrderStore: IgniteOrderStore)(implicit clock: Clock, lifecycle: LifecycleContainer, tableDefContainer: TableDefContainer): ViewServerModule = {
    ModuleFactory.withNamespace(NAME)
      .addSessionTable(
        VirtualizedSessionTableDef(
          name = "bigOrders2",
          keyField = "orderId",
          Columns.fromNames("orderId".string(), "quantity".int(), "price".long(), "side".string(), "trader".string())
        ),
        (table, _) => new IgniteOrderDataProvider(igniteOrderStore),
        (table, _, _, _) => ViewPortDef(
          columns = table.getTableDef.columns,
          service = new VirtualService()
        )
      ).asModule()
  }

}
