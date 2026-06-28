package org.finos.vuu.plugin.clickhouse.module

import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.Clock
import org.finos.vuu.api.ViewPortDef
import org.finos.vuu.core.module.{DefaultModule, ModuleFactory, TableDefContainer, ViewServerModule}
import org.finos.vuu.core.table.{AliasedSimpleColumn, Columns}
import org.finos.vuu.net.rpc.DefaultRpcHandler
import org.finos.vuu.plugin.clickhouse.client.ClickHouseClient
import org.finos.vuu.plugin.clickhouse.provider.ClickHouseVirtualizedDataProvider
import org.finos.vuu.plugin.virtualized.api.AliasedVirtualizedSessionTableDef
import org.finos.vuu.plugin.virtualized.table.VirtualizedTableColumn

object ClickHouseTableModule extends DefaultModule {

  final val NAME = "CLICKHOUSE"

  def apply(client: ClickHouseClient)(using clock: Clock, lifecycle: LifecycleContainer, tableDefContainer: TableDefContainer): ViewServerModule = {
    val tableDef = AliasedVirtualizedSessionTableDef(
      remoteName = "order_history",
      name = "orderHistory",
      keyField = "orderId",
      customColumns = Array(
        new VirtualizedTableColumn("order")
      )
      VirtualizedTableColumn().fromNames("orderId".string(), "quantity".int(), "price".long(), "side".string(), "trader".string())
    )
    ModuleFactory.withNamespace(NAME)
      .addSessionTable(tableDef,
        (table, vs) => new ClickHouseVirtualizedDataProvider(tableDef, client),
        (table, _, _, tableContainer) => ViewPortDef(
          columns = tableDef.getColumns,
          service = new DefaultRpcHandler()(tableContainer)
        )
      ).asModule()
  }

}
