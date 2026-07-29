package org.finos.vuu.example.virtualtable.module

import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.Clock
import org.finos.vuu.api.ViewPortDef
import org.finos.vuu.core.module.{DefaultModule, ModuleFactory, TableDefContainer, ViewServerModule}
import org.finos.vuu.example.virtualtable.provider.ReallyBigVirtualizedDataProvider
import org.finos.vuu.net.rpc.DefaultRpcHandler
import org.finos.vuu.plugin.virtualized.api.{SimpleVirtualizedSessionTableDef, VirtualizedSessionTableColumnBuilder}

object VirtualTableModule extends DefaultModule {

  final val NAME = "VIRTUAL"

  def apply()(implicit clock: Clock, lifecycle: LifecycleContainer, tableDefContainer: TableDefContainer): ViewServerModule = {

    val tableDef = SimpleVirtualizedSessionTableDef(
      tableName = "bigOrders",
      tableKeyField = "orderId",
      remoteColumns = VirtualizedSessionTableColumnBuilder()
        .addString("orderId")
        .addInt("quantity")
        .addLong("price")
        .addString("side")
        .addString("trader")
        .build()
    )

    ModuleFactory.withNamespace(NAME)
      .addSessionTable(tableDef,
        (table, vs) => new ReallyBigVirtualizedDataProvider(tableDef),
        (table, _, _, tableContainer) => ViewPortDef(
          columns = tableDef.getColumns,
          service = new DefaultRpcHandler()(tableContainer)
        )
      ).asModule()
  }

}
