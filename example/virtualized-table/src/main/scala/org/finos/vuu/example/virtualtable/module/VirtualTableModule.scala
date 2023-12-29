package org.finos.vuu.example.virtualtable.module

import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.Clock
import org.finos.vuu.api.{AutoSubscribeTableDef, ViewPortDef}
import org.finos.vuu.core.module.{DefaultModule, ModuleFactory, TableDefContainer, ViewServerModule}
import org.finos.vuu.core.table.Columns
import org.finos.vuu.example.virtualtable.provider.ReallyBigVirtualizedDataProvider
import org.finos.vuu.net.rpc.RpcHandler
import org.finos.vuu.plugin.virtualized.api
import org.finos.vuu.plugin.virtualized.api.VirtualizedSessionTableDef

class VirtualService extends RpcHandler

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
      (table, vs) => new ReallyBigVirtualizedDataProvider(table),
      (table, _, _, _) => ViewPortDef(
        columns = table.getTableDef.columns,
        service = new VirtualService()
      )
    ).asModule()
  }

}
