package org.finos.vuu.example.rest.module

import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.Clock
import org.finos.vuu.api.{TableDef, ViewPortDef}
import org.finos.vuu.core.module.ModuleFactory.stringToString
import org.finos.vuu.core.module.{ModuleFactory, TableDefContainer, ViewServerModule}
import org.finos.vuu.core.table.Columns
import org.finos.vuu.example.rest.RestClient
import org.finos.vuu.example.rest.provider.InstrumentsProvider
import org.finos.vuu.net.rpc.RpcHandler

object InstrumentsModule {
  private final val NAME: String = "REST"

  def apply(client: RestClient)(implicit clock: Clock, lifecycle: LifecycleContainer, tableDefContainer: TableDefContainer): ViewServerModule = {
    ModuleFactory.withNamespace(NAME)
      .addTable(
        TableDef(
          name = "Instruments",
          keyField = "id",
          columns = Columns.fromNames("id".long(), "ric".string(), "isin".string(), "currency".string())
        ),
        (table, _) => new InstrumentsProvider(table, client),
        (table, _, _, _) => ViewPortDef(columns = table.getTableDef.columns, service = new DefaultRpcHandler)
      ).asModule()
  }

  private class DefaultRpcHandler extends RpcHandler
}
