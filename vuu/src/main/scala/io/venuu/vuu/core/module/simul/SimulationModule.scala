package io.venuu.vuu.core.module.simul

import com.typesafe.scalalogging.StrictLogging
import io.venuu.toolbox.lifecycle.{DefaultLifecycleEnabled, LifecycleContainer}
import io.venuu.toolbox.time.Clock
import io.venuu.vuu.api._
import io.venuu.vuu.core.module.simul.provider._
import io.venuu.vuu.core.module.{DefaultModule, ModuleFactory, ViewServerModule}
import io.venuu.vuu.core.table.{Columns, DataTable, TableContainer}
import io.venuu.vuu.net.rpc.RpcHandler
import io.venuu.vuu.net.{ClientSessionId, RequestContext}
import io.venuu.vuu.provider.simulation.{SimulatedBigInstrumentsProvider, SimulatedPricesProvider}
import io.venuu.vuu.provider.{Provider, ProviderContainer, RpcProvider}
import io.venuu.vuu.viewport._

import java.util.UUID

class PricesService(val table: DataTable, val provider: Provider) extends RpcHandler with StrictLogging {

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

class InstrumentsService(val table: DataTable, val providerContainer: ProviderContainer) extends RpcHandler with StrictLogging {

  def addRowsFromInstruments(selection: ViewPortSelection, sessionId: ClientSessionId): ViewPortAction = {
    val rics = selection.rowKeyIndex.map({ case (key, _) => key }).toList
    providerContainer.getProviderForTable("orderEntry") match {
      case Some(provider) =>
        rics.foreach(ric => {
          val uuid = UUID.randomUUID().toString
          provider.asInstanceOf[RpcProvider].tick(uuid, Map("clOrderId" -> uuid, "ric" -> ric, "quantity" -> 10_000, "orderType" -> "Limit"))
        })
        OpenDialogViewPortAction(ViewPortTable("orderEntry", "SIMUL"))
      case None =>
        logger.error("Could not find provider for table: orderEntry")
        throw new Exception("could not find provider for table")
    }
  }

  def testSelect(selection: ViewPortSelection, sessionId: ClientSessionId): ViewPortAction = {
    println("In testSelect")
    OpenDialogViewPortAction(ViewPortTable("prices", "SIMUL"))
  }

  def testCell(rowKey: String, field: String, value: Object, sessionId: ClientSessionId): ViewPortAction = {
    println("In testCell")
    NoAction()
  }

  def testTable(sessionId: ClientSessionId): ViewPortAction = {
    println("In testTable")
    NoAction()
  }

  def testRow(rowKey: String, row: Map[String, Any], sessionId: ClientSessionId): ViewPortAction = {
    println("In testRow")
    NoAction()
  }

  override def menuItems(): ViewPortMenu = ViewPortMenu("Test Menu",
    new SelectionViewPortMenuItem("Add Rows To Orders", "", this.addRowsFromInstruments, "ADD_ROWS_TO_ORDERS"),
    new SelectionViewPortMenuItem("Test Selection", "", this.testSelect, "TEST_SELECT"),
    new CellViewPortMenuItem("Test Cell", "", this.testCell, "TEST_CELL"),
    new TableViewPortMenuItem("Test Table", "", this.testTable, "TEST_TABLE"),
    new RowViewPortMenuItem("Test Row", "", this.testRow, "TEST_ROW")
  )
}

trait SimulRpcHandler {
  def onSendToMarket(param1: Map[String, Any])(ctx: RequestContext): Boolean

}

class TheSimulRpcHander extends DefaultLifecycleEnabled with RpcHandler with SimulRpcHandler {
  def onSendToMarket(param1: Map[String, Any])(ctx: RequestContext): Boolean = {
    println("onSendToMarket called:" + param1)
    false
  }
}

trait OrderEntryRpcHandler {
  def addRowsFromInstruments(sourceVpId: String)(ctx: RequestContext): List[String]
}


class OrderEntryRpcHandlerImpl(val vpContainer: ViewPortContainer, val tableContainer: TableContainer, val providerContainer: ProviderContainer) extends DefaultLifecycleEnabled with OrderEntryRpcHandler with RpcHandler with StrictLogging {
  override def addRowsFromInstruments(sourceVpId: String)(ctx: RequestContext): List[String] = {
    vpContainer.get(ctx.session, sourceVpId) match {
      case Some(vp) =>
        val rics = vp.getSelection.map({ case (key, rowIndex) => key }).toList
        providerContainer.getProviderForTable("orderEntry") match {
          case Some(provider) =>
            rics.foreach(ric => {
              val uuid = UUID.randomUUID().toString
              provider.asInstanceOf[RpcProvider].tick(uuid, Map("clOrderId" -> uuid, "ric" -> ric, "quantity" -> 10_000, "orderType" -> "Limit"))
            })
            rics
          case None =>
            logger.error("Could not find provider for table: orderEntry")
            throw new Exception("could not find provider for table")
        }
      case None =>
        logger.error("could not find vp to get selection")
        throw new Exception("could not find vp to get selection")
    }
  }
}

object SimulationModule extends DefaultModule {

  final val NAME = "SIMUL"

  def apply()(implicit clock: Clock, lifecycle: LifecycleContainer): ViewServerModule = {
    implicit val randomNumbers = new SeededRandomNumbers(clock.now())

    val ordersModel = new ParentChildOrdersModel()

    ModuleFactory.withNamespace(NAME)
      .addTable(
        TableDef(
          name = "instruments",
          keyField = "ric",
          columns = Columns.fromNames("ric".string(), "description".string(), "bbg".string(), "isin".string(), "currency".string(), "exchange".string(), "lotSize".int()),
          VisualLinks(),
          joinFields = "ric"
        ),
        (table, vs) => new SimulatedBigInstrumentsProvider(table),
        (table, provider, providerContainer) => ViewPortDef(
          columns = table.getTableDef.columns,
          service = new InstrumentsService(table, providerContainer)
        )
      )
      .addTable(
        AutoSubscribeTableDef(
          name = "prices",
          keyField = "ric",
          Columns.fromNames("ric".string(), "bid".double(), "bidSize".int(), "ask".double(), "askSize".int(), "last".double(), "open".double(), "close".double(), "scenario".string(), "phase".string()),
          joinFields = "ric"
        ),
        (table, vs) => new SimulatedPricesProvider(table, maxSleep = 800),
        (table, provider, providerContainer) => ViewPortDef(
          columns = table.getTableDef.columns,
          service = new PricesService(table, provider)
        )
      )
      .addTable(
        TableDef(
          name = "orders",
          keyField = "orderId",
          Columns.fromNames("orderId:String", "side:Char", "ric:String", "ccy:String", "quantity:Double", "trader:String", "filledQuantity:Double", "lastUpdate: Long", "created: Long"),
          VisualLinks(
            Link("ric", "instruments", "ric"),
            Link("ric", "prices", "ric")
          ),
          joinFields = "orderId", "ric"
        ),
        (table, vs) => new OrdersSimulProvider(table)
      )
      .addTable(
        TableDef(
          name = "parentOrders",
          keyField = "id",
          Columns.fromNames("id:String", "idAsInt: Int", "ric:String", "childCount: Int", "price:Double", "quantity:Int", "side:String", "account:String", "exchange: String",
            "ccy: String", "algo: String", "volLimit:Double", "filledQty:Int", "openQty:Int", "averagePrice: Double", "status:String",
            "lastUpdate:Long"),
          VisualLinks(
            Link("ric", "prices", "ric")
          ),
          indices = Indices(
            Index("ric")
          ),
          joinFields = "id", "ric"
        ),
        (table, vs) => new ParentOrdersProvider(table, ordersModel)
      )
      .addTable(
        TableDef(
          name = "childOrders",
          keyField = "id",
          Columns.fromNames("parentOrderId:Int", "id:String", "idAsInt: Int", "ric:String", "price:Double", "quantity:Int", "side:String", "account:String", "exchange: String",
            "ccy: String", "strategy: String", "volLimit:Double", "filledQty:Int", "openQty:Int", "averagePrice: Double", "status:String", "lastUpdate:Long"),
          VisualLinks(
            Link("parentOrderId", "parentOrders", "idAsInt")
          ),
          indices = Indices(
            Index("parentOrderId"),
            Index("quantity"),
            Index("exchange"),
            Index("ccy"),
          ),
          joinFields = "id", "ric"
        ),
        (table, vs) => new ChildOrdersProvider(table, ordersModel)
      )
      .addTable(
        TableDef(
          name = "orderEntry",
          keyField = "clOrderId",
          Columns.fromNames("clOrderId:String", "ric:String", "quantity: Double", "orderType:String", "price: Double", "priceLevel: String"),
          VisualLinks(
            Link("ric", "instruments", "ric")
          ),
          joinFields = "ric"
        ),
        (table, vs) => new RpcProvider(table)
      )
      .addJoinTable(tableDefs =>
        JoinTableDef(
          name = "orderEntryPrices",
          baseTable = tableDefs.get("orderEntry"),
          joinColumns = Columns.allFrom(tableDefs.get("orderEntry")) ++ Columns.allFromExcept(tableDefs.get("prices"), "ric"),
          joins =
            JoinTo(
              table = tableDefs.get("prices"),
              joinSpec = JoinSpec(left = "ric", right = "ric", LeftOuterJoin)
            ),
          joinFields = Seq()
        ))
      .addJoinTable(tableDefs =>
        JoinTableDef(
          name = "instrumentPrices",
          baseTable = tableDefs.get("instruments"),
          joinColumns = Columns.allFrom(tableDefs.get("instruments")) ++ Columns.allFromExcept(tableDefs.get("prices"), "ric"),
          joins =
            JoinTo(
              table = tableDefs.get("prices"),
              joinSpec = JoinSpec(left = "ric", right = "ric", LeftOuterJoin)
            ),
          joinFields = Seq()
        ))
      .addJoinTable(tableDefs =>
        JoinTableDef(
          name = "ordersPrices",
          baseTable = tableDefs.get("orders"),
          joinColumns = Columns.allFrom(tableDefs.get("orders")) ++ Columns.allFromExcept(tableDefs.get("prices"), "ric"),
          joins =
            JoinTo(
              table = tableDefs.get("prices"),
              joinSpec = JoinSpec(left = "ric", right = "ric", LeftOuterJoin)
            ),
          joinFields = Seq()
        ))
      //.addRpcHandler(vs => new TheSimulRpcHander)
      //.addRpcHandler(vs => new OrderEntryRpcHandlerImpl(vs.viewPortContainer, vs.tableContainer, vs.providerContainer))
      .asModule()
  }
}
