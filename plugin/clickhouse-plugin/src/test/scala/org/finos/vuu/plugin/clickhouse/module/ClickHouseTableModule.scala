package org.finos.vuu.plugin.clickhouse.module

import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.Clock
import org.finos.vuu.api.{TableDefOptions, ViewPortDef}
import org.finos.vuu.core.module.{DefaultModule, ModuleFactory, TableDefContainer, ViewServerModule}
import org.finos.vuu.core.table.RangeSettings
import org.finos.vuu.net.FilterSpec
import org.finos.vuu.net.rpc.DefaultRpcHandler
import org.finos.vuu.plugin.clickhouse.client.ClickHouseClient
import org.finos.vuu.plugin.clickhouse.provider.ClickHouseVirtualizedDataProvider
import org.finos.vuu.plugin.virtualized.api.{AliasedVirtualizedSessionTableDef, VirtualizedSessionTableColumnBuilder}
import org.finos.vuu.viewport.ViewPort

object ClickHouseTableModule extends DefaultModule {

  final val NAME = "CLICKHOUSE"
  final val TABLE_NAME = "orderHistory"
  final val NO_SELL_TABLE_NAME = "noSellOrderHistory"

  def apply(client: ClickHouseClient)(using clock: Clock, lifecycle: LifecycleContainer, tableDefContainer: TableDefContainer): ViewServerModule = {
    val tableDef = AliasedVirtualizedSessionTableDef(
      tableName = TABLE_NAME,
      tableKeyField = "orderId",
      remoteName = "order_history",
      remoteKeyField = "order_id",
      remoteColumns = VirtualizedSessionTableColumnBuilder()
        .addString("orderId", "order_id")
        .addInt("quantity")
        .addLong("price")
        .addString("side")
        .addString("trader")
        .build(),
      options = TableDefOptions(
        includeDefaultColumns = false,
        rangeSettings = RangeSettings()
          .withMaxRangeEnd(1_000_000)
      )
    )

    val tableDefWithNoSellPermission = AliasedVirtualizedSessionTableDef(
      tableName = NO_SELL_TABLE_NAME,
      tableKeyField = "orderId",
      remoteName = "order_history",
      remoteKeyField = "order_id",
      remoteColumns = VirtualizedSessionTableColumnBuilder()
        .addString("orderId", "order_id")
        .addInt("quantity")
        .addLong("price")
        .addString("side")
        .addString("trader")
        .build(),
      remotePermissionFilterSpecFunction = (vp: ViewPort) => {
        FilterSpec("side = \"Buy\"")
      },
      options = TableDefOptions(
        includeDefaultColumns = false,
        rangeSettings = RangeSettings()
          .withMaxRangeEnd(1_000_000)
      )
    )

    ModuleFactory.withNamespace(NAME)
      .addSessionTable(tableDef,
        (table, vs) => new ClickHouseVirtualizedDataProvider(tableDef, client),
        (table, _, _, tableContainer) => ViewPortDef(
          columns = tableDef.getColumns,
          service = new DefaultRpcHandler()(tableContainer)
        )
      )
      .addSessionTable(tableDefWithNoSellPermission,
        (table, vs) => new ClickHouseVirtualizedDataProvider(tableDefWithNoSellPermission, client),
        (table, _, _, tableContainer) => ViewPortDef(
          columns = tableDefWithNoSellPermission.getColumns,
          service = new DefaultRpcHandler()(tableContainer)
        )
      )
      .asModule()
  }

}
