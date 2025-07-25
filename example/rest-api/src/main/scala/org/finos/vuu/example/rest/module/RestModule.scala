package org.finos.vuu.example.rest.module

import com.typesafe.config.Config
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.Clock
import org.finos.vuu.api.TableDef
import org.finos.vuu.core.module.ModuleFactory.stringToString
import org.finos.vuu.core.module.{ModuleFactory, TableDefContainer, ViewServerModule}
import org.finos.vuu.core.table.Columns
import org.finos.vuu.example.rest.client.{HttpClient, InstrumentServiceClient}
import org.finos.vuu.example.rest.provider.InstrumentsProvider

object RestModule {
  private final val NAME: String = "REST"

  def apply(httpClient: HttpClient, config: Config)(implicit clock: Clock, lifecycle: LifecycleContainer, tableDefContainer: TableDefContainer): ViewServerModule = {
    ModuleFactory.withNamespace(NAME)
      .addTable(
        TableDef(
          name = "Instruments",
          keyField = "id",
          columns = Columns.fromNames("id".long(), "ric".string(), "isin".string(), "currency".string())
        ),
        (table, _) => new InstrumentsProvider(
          table,
          InstrumentServiceClient(httpClient, config.getString("instrumentServiceUrl"))
        ),
      ).asModule()
  }
}
