package org.finos.vuu.example.clickhouse.module

import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.Clock
import org.finos.vuu.api.ViewPortDef
import org.finos.vuu.core.module.{DefaultModule, ModuleFactory, TableDefContainer, ViewServerModule}
import org.finos.vuu.core.table.Columns
import org.finos.vuu.example.clickhouse.client.ClickHouseClient
import org.finos.vuu.example.clickhouse.provider.ClickHouseVirtualizedDataProvider
import org.finos.vuu.net.rpc.DefaultRpcHandler
import org.finos.vuu.plugin.virtualized.api.VirtualizedSessionTableDef

object ClickHouseTableModule extends DefaultModule {

  final val NAME = "CLICKHOUSE"

  def apply(client: ClickHouseClient)(implicit clock: Clock, lifecycle: LifecycleContainer, tableDefContainer: TableDefContainer): ViewServerModule = {
    ModuleFactory.withNamespace(NAME)
      .addSessionTable(
        VirtualizedSessionTableDef(
          name = "orders",
          keyField = "orderId",
          Columns.fromNames("orderId".string(), "quantity".int(), "price".long(), "side".string(), "trader".string())
        ),
        (table, vs) => new ClickHouseVirtualizedDataProvider(table.getTableDef, client),
        (table, _, _, tableContainer) => ViewPortDef(
          columns = table.getTableDef.getColumns,
          service = new DefaultRpcHandler()(tableContainer)
        )
      ).asModule()
  }
}
