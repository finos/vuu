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
  final val INSTRUMENT_TABLE_NAME = "instruments"
  final val ORDER_INSTRUMENTS_JOIN_TABLE_NAME = "ordersWithInstruments"

  def apply(client: ClickHouseClient)(using clock: Clock, lifecycle: LifecycleContainer, tableDefContainer: TableDefContainer): ViewServerModule = {
    val orderHistoryDef = AliasedVirtualizedSessionTableDef(
      tableName = TABLE_NAME,
      tableKeyField = "orderId",
      remoteName = "order_history",
      remoteKeyField = "order_id",
      remoteColumns = VirtualizedSessionTableColumnBuilder()
        .addLong("orderId", "order_id")
        .addLong("instrumentId", "instrument_id")
        .addInt("quantity")
        .addScaledDecimal6("price")
        .addString("side")
        .addString("trader")
        .addString("currency")
        .addEpochTimestampNano("time")
        .build(),
      options = TableDefOptions(
        includeDefaultColumns = false,
        rangeSettings = RangeSettings()
          .withMaxRangeEnd(1_000_000)
      )
    )

    val orderHistoryDefWithNoSellPermission = orderHistoryDef.copy(
      tableName = NO_SELL_TABLE_NAME,
      remotePermissionFilterSpecFunction = (vp: ViewPort) => {
        FilterSpec("side = \"Buy\"")
      }
    )

    val instrumentsDef = AliasedVirtualizedSessionTableDef(
      tableName = INSTRUMENT_TABLE_NAME,
      tableKeyField = "instrumentId",
      remoteName = "instruments",
      remoteKeyField = "instrument_id",
      remoteColumns = VirtualizedSessionTableColumnBuilder()
        .addLong("instrumentId", "instrument_id")
        .addString("ric")
        .addString("exchange")
        .addString("currency")
        .build(),
      options = TableDefOptions(
        includeDefaultColumns = false,
        rangeSettings = RangeSettings()
          .withMaxRangeEnd(1_000_000)
      )
    )

    val ordersInstrumentsJoinDef = AliasedVirtualizedSessionTableDef(
      tableName = ORDER_INSTRUMENTS_JOIN_TABLE_NAME,
      tableKeyField = "orderId",
      remoteName = "enriched_orders",
      remoteKeyField = "order_id",
      remoteColumns = VirtualizedSessionTableColumnBuilder()
        .addLong("orderId", "order_id")
        .addLong("instrumentId", "instrument_id")
        .addInt("quantity")
        .addScaledDecimal6("price")
        .addString("side")
        .addString("trader")
        .addString("currency")
        .addEpochTimestampNano("time")
        .addString("ric")
        .addString("exchange")
        .addString("instrumentCurrency","instrument_currency")
        .build(),
      options = TableDefOptions(
        includeDefaultColumns = false,
        rangeSettings = RangeSettings()
          .withMaxRangeEnd(1_000_000)
      )
    )

    ModuleFactory.withNamespace(NAME)
      .addSessionTable(orderHistoryDef,
        (table, vs) => new ClickHouseVirtualizedDataProvider(orderHistoryDef, client),
        (table, _, _, _) => ViewPortDef.createDefault(orderHistoryDef.getColumns)
      )
      .addSessionTable(orderHistoryDefWithNoSellPermission,
        (table, vs) => new ClickHouseVirtualizedDataProvider(orderHistoryDefWithNoSellPermission, client),
        (table, _, _, _) => ViewPortDef.createDefault(orderHistoryDefWithNoSellPermission.getColumns)
      )
      .addSessionTable(instrumentsDef,
        (table, vs) => new ClickHouseVirtualizedDataProvider(instrumentsDef, client),
        (table, _, _, _) => ViewPortDef.createDefault(instrumentsDef.getColumns)
      )
      .addSessionTable(ordersInstrumentsJoinDef,
        (table, vs) => new ClickHouseVirtualizedDataProvider(ordersInstrumentsJoinDef, client),
        (table, _, _, _) => ViewPortDef.createDefault(ordersInstrumentsJoinDef.getColumns)
      )
      .asModule()
  }

}
