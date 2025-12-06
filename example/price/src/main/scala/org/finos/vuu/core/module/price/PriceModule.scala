package org.finos.vuu.core.module.price

import com.typesafe.scalalogging.StrictLogging
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.Clock
import org.finos.vuu.api.{AutoSubscribeTableDef, ViewPortDef}
import org.finos.vuu.core.module.ModuleFactory.stringToString
import org.finos.vuu.core.module.{ModuleFactory, TableDefContainer, ViewServerModule}
import org.finos.vuu.core.table.{Columns, DataTable, TableContainer}
import org.finos.vuu.net.ClientSessionId
import org.finos.vuu.net.rpc.DefaultRpcHandler
import org.finos.vuu.provider.Provider
import org.finos.vuu.provider.simulation.SimulatedPricesProvider
import org.finos.vuu.viewport._


class PricesService(val table: DataTable, val provider: Provider)(implicit tableContainer: TableContainer) extends DefaultRpcHandler with StrictLogging {

  private val pricesProvider = provider.asInstanceOf[SimulatedPricesProvider]

  def setSpeedSlow(selection: ViewPortSelection, sessionId: ClientSessionId):ViewPortAction = {
    pricesProvider.setSpeed(8000)
    NoAction()
  }

  def setSpeedMedium(selection: ViewPortSelection, sessionId: ClientSessionId):ViewPortAction = {
    pricesProvider.setSpeed(2000)
    NoAction()
  }

  def setSpeedFast(selection: ViewPortSelection, sessionId: ClientSessionId):ViewPortAction = {
    pricesProvider.setSpeed(400)
    NoAction()
  }

  override def menuItems(): ViewPortMenu = ViewPortMenu("Root",
    new SelectionViewPortMenuItem("Set Slow", "", this.setSpeedSlow, "SET_SPEED_SLOW"),
    new SelectionViewPortMenuItem("Set Medium", "", this.setSpeedMedium, "SET_SPEED_MED"),
    new SelectionViewPortMenuItem("Set Fast", "", this.setSpeedFast, "SET_SPEED_FAST")
  )
}

object PriceModule {

  final val NAME = "PRICE"
  final val PriceTable = "prices"
  def apply()(implicit clock: Clock, lifecycle: LifecycleContainer, tableDefContainer: TableDefContainer): ViewServerModule = {

    ModuleFactory.withNamespace(NAME)
      .addTable(
        AutoSubscribeTableDef(
          name = PriceTable,
          keyField = "ric",
          Columns.fromNames("ric".string(), "bid".double(), "bidSize".int(), "ask".double(), "askSize".int(),
            "last".double(), "open".double(), "close".double(), "scenario".string(), "phase".string()),
          joinFields = "ric"
        ),
        (table, vs) => new SimulatedPricesProvider(table, maxSleep = 800),
        (table, provider, _, tableContainer) => ViewPortDef(
          columns = table.getTableDef.getColumns,
          service = new PricesService(table, provider)(tableContainer)
        )
      ).asModule()
  }
}
