package org.finos.vuu.example.virtualtable.module

import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.Clock
import org.finos.vuu.api.{TableDefOptions, ViewPortDef}
import org.finos.vuu.core.module.{DefaultModule, ModuleFactory, TableDefContainer, ViewServerModule}
import org.finos.vuu.core.table.TableContainer
import org.finos.vuu.example.virtualtable.provider.ReallyBigVirtualizedDataProvider
import org.finos.vuu.net.rpc.sessiontable.CreateSessionTableRpcHandler
import org.finos.vuu.net.rpc.{AllowAllRpcPermissionChecker, RpcHandler, RpcPermissionChecker}
import org.finos.vuu.plugin.virtualized.api.{VirtualizedSessionTableColumnBuilder, VirtualizedSessionTableDefBuilder}

object VirtualTableModule extends DefaultModule {

  final val NAME = "VIRTUAL"

  def apply()(implicit clock: Clock, lifecycle: LifecycleContainer, tableDefContainer: TableDefContainer): ViewServerModule = {

    val tableDef = VirtualizedSessionTableDefBuilder()
      .withTableName("bigOrders")
      .withTableKeyField("orderId")
      .withColumns(
        VirtualizedSessionTableColumnBuilder()
          .addString("orderId")
          .addInt("quantity")
          .addLong("price")
          .addString("side")
          .addString("trader")
          .build())
      .withOptions(
        TableDefOptions.apply()
          .withMaxSize(10_000)
          .withIncludeDefaultColumns(false),
      ).buildSimple()

    ModuleFactory.withNamespace(NAME)
      .addSessionTable(tableDef,
        (table, vs) => new ReallyBigVirtualizedDataProvider(tableDef),
        (table, _, _, tableContainer) => ViewPortDef.apply(tableDef.getColumns,
          new RpcHandler with CreateSessionTableRpcHandler {
          override val tableContainer: TableContainer = tableContainer
          override val rpcPermissionChecker: RpcPermissionChecker = AllowAllRpcPermissionChecker
        })
      ).asModule()
  }

}
