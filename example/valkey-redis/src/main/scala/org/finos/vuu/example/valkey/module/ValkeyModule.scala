package org.finos.vuu.example.valkey.module

import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.Clock
import org.finos.vuu.api.{Index, Indices, ViewPortDef}
import org.finos.vuu.core.module.ModuleFactory.stringToString
import org.finos.vuu.core.module.{ModuleFactory, TableDefContainer, ViewServerModule}
import org.finos.vuu.core.table.{Column, Columns}
import org.finos.vuu.example.valkey.factory.ValkeyConnectionPool
import org.finos.vuu.example.valkey.provider.ValkeyVirtualizedProvider
import org.finos.vuu.net.rpc.RpcHandler
import org.finos.vuu.plugin.virtualized.api.VirtualizedSessionTableDef

class NoOpValkeyService extends RpcHandler

object ValkeyModule {

  private final val NAME = "VALKEY"

  def apply(pool: ValkeyConnectionPool)(implicit clock: Clock, lifecycle: LifecycleContainer, tableDefContainer: TableDefContainer): ViewServerModule = {
    ModuleFactory.withNamespace(NAME)
      .addSessionTable(
        VirtualizedSessionTableDef(
          name = "bigOrders3",
          keyField = "id",
          columns,
          Indices(
            //id is not required, its implicitly indexed as the primary key
            Index("ric"),
            Index("strategy"),
            Index("parentId"),
            Index("orderTimeMs"),
            Index("currency"),
            Index("quantity"),
          )
        ),
        (_, _) => new ValkeyVirtualizedProvider(pool),
        (table, _, _, _) => ViewPortDef(
          columns = table.getTableDef.columns,
          service = new NoOpValkeyService()
        )
      ).asModule()
  }

  val columns: Array[Column] = Columns.fromNames("id".int(), "ric".string(), "quantity".int(), "price".double(), "side".string(), "strategy".string(), "parentId".int(), "orderTimeMs".long(), "currency".string())
}
