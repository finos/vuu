package org.finos.vuu.core.module.price

import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.Clock
import org.finos.vuu.api.{AutoSubscribeTableDef, ViewPortDef}
import org.finos.vuu.core.module.ModuleFactory.stringToString
import org.finos.vuu.core.module.simul.PricesService
import org.finos.vuu.core.module.{ModuleFactory, TableDefContainer, ViewServerModule}
import org.finos.vuu.core.table.Columns
import org.finos.vuu.provider.simulation.SimulatedPricesProvider

object PriceModule {

  final val NAME = "PRICE"

  def apply()(implicit clock: Clock, lifecycle: LifecycleContainer, tableDefContainer: TableDefContainer): ViewServerModule = {

    ModuleFactory.withNamespace(NAME)
      .addTable(
        AutoSubscribeTableDef(
          name = "prices",
          keyField = "ric",
          Columns.fromNames("ric".string(), "bid".double(), "bidSize".int(), "ask".double(), "askSize".int(),
            "last".double(), "open".double(), "close".double(), "scenario".string(), "phase".string()),
          joinFields = "ric"
        ),
        (table, vs) => new SimulatedPricesProvider(table, maxSleep = 800),
        (table, provider, providerContainer, _) => ViewPortDef(
          columns = table.getTableDef.columns,
          service = new PricesService(table, provider)
        )
      ).asModule()
  }
}
