package org.finos.vuu.example.virtualtable.module

import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.Clock
import org.finos.vuu.api.ViewPortDef
import org.finos.vuu.core.module.{DefaultModule, ModuleFactory, TableDefContainer, ViewServerModule}
import org.finos.vuu.core.table.Columns
import org.finos.vuu.example.virtualtable.provider.ReallyBigVirtualizedDataProvider
import org.finos.vuu.net.rpc.DefaultRpcHandler
import org.finos.vuu.plugin.virtualized.api.VirtualizedSessionTableDef

object VirtualTableModule extends DefaultModule{

  final val NAME = "VIRTUAL"
  def apply()(implicit clock: Clock, lifecycle: LifecycleContainer, tableDefContainer: TableDefContainer): ViewServerModule = {

  ModuleFactory.withNamespace(NAME)
    .addSessionTable(
      VirtualizedSessionTableDef(
        name = "bigOrders",
        keyField = "orderId",
        Columns.fromNames("orderId".string(), "quantity".int(), "price".long(), "side".string(), "trader".string())
      ),
      (table, vs) => new ReallyBigVirtualizedDataProvider(),
      (table, _, _, tableContainer) => ViewPortDef(
        columns = table.getTableDef.getColumns,
        service = new DefaultRpcHandler()(tableContainer)
      )
    ).asModule()
  }

}
