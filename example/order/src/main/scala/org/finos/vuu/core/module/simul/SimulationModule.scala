package org.finos.vuu.core.module.simul

import com.typesafe.scalalogging.StrictLogging
import org.finos.toolbox.lifecycle.{DefaultLifecycleEnabled, LifecycleContainer}
import org.finos.toolbox.time.Clock
import org.finos.vuu.api._
import org.finos.vuu.client.messages.RequestId
import org.finos.vuu.core.module.auths.OrderPermissionChecker
import org.finos.vuu.core.module.price.PriceModule
import org.finos.vuu.core.module.simul.provider._
import org.finos.vuu.core.module.simul.service.ParentOrdersService
import org.finos.vuu.core.module.{DefaultModule, ModuleFactory, TableDefContainer, ViewServerModule}
import org.finos.vuu.core.table.{Columns, DataTable, TableContainer}
import org.finos.vuu.net.rpc.{DefaultRpcHandler, RpcHandler}
import org.finos.vuu.net.{ClientSessionId, RequestContext}
import org.finos.vuu.provider.simulation.SimulatedBigInstrumentsProvider
import org.finos.vuu.provider.{ProviderContainer, RpcProvider}
import org.finos.vuu.viewport._


class InstrumentsService(val table: DataTable, val providerContainer: ProviderContainer)(implicit tableContainer: TableContainer) extends DefaultRpcHandler with StrictLogging {

  def addRowsFromInstruments(selection: ViewPortSelection, sessionId: ClientSessionId): ViewPortAction = {
    val rics = selection.rowKeyIndex.map({ case (key, _) => key }).toList
    providerContainer.getProviderForTable("orderEntry") match {
      case Some(provider) =>
        rics.foreach(ric => {
          val uuid = RequestId.oneNew()
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

  override def menuItems(): ViewPortMenu = ViewPortMenu(
    ViewPortMenu("Block Actions (selected rows)",
      new SelectionViewPortMenuItem("Test Selection", "", this.testSelect, "TEST_SELECT"),
      new SelectionViewPortMenuItem("Test Selection CAD", "currency=\"CAD\"", this.testSelect, "TEST_SELECT_CAD"),
      new SelectionViewPortMenuItem("Test Selection EUR", "currency=\"EUR\"", this.testSelect, "TEST_SELECT_EUR"),
      new SelectionViewPortMenuItem("Test Selection USD", "currency=\"USD\"", this.testSelect, "TEST_SELECT_USD")
    ),
    ViewPortMenu("Cell Actions",
      new CellViewPortMenuItem("Test Cell", "", this.testCell, "TEST_CELL"),
      new CellViewPortMenuItem("Test BBG Cell", "", this.testCell, "TEST_BBG_CELL", "bbg"),
      new CellViewPortMenuItem("Test CCY Cell", "", this.testCell, "TEST_CURRENCY_CELL", "currency")
    ),
    ViewPortMenu("Row Actions",
      new RowViewPortMenuItem("Test Row", "", this.testRow, "TEST_ROW"),
      new RowViewPortMenuItem("Test Row EUR", "currency=\"EUR\"", this.testRow, "TEST_ROW_EUR"),
      new RowViewPortMenuItem("Test Row USD", "currency=\"USD\"", this.testRow, "TEST_ROW_USD"),
      new RowViewPortMenuItem("Test Row CAD", "currency=\"CAD\"", this.testRow, "TEST_ROW_CAD"),
      new RowViewPortMenuItem("Test Row CAD/USD", "currency in [\"CAD\",\"USD\"]", this.testRow, "TEST_ROW_CAD_USD"),
      new RowViewPortMenuItem("Test Row XLON-LSE", "exchange = \"XLON/LSE-SETS\"", this.testRow, "TEST_ROW_XLON"),
      new RowViewPortMenuItem("Test Row London Rics", "ric ends \".L\"", this.testRow, "TEST_ROW_LON_RICS")
    ),
    new SelectionViewPortMenuItem("Add Rows To Orders", "", this.addRowsFromInstruments, "ADD_ROWS_TO_ORDERS"),
    new TableViewPortMenuItem("Test Table", "", this.testTable, "TEST_TABLE")
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
              val uuid = RequestId.oneNew()
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

  def apply()(implicit clock: Clock, lifecycle: LifecycleContainer, tableDefContainer: TableDefContainer): ViewServerModule = {

    implicit val randomNumbers: SeededRandomNumbers = new SeededRandomNumbers(clock.now())

    val ordersModel = new ParentChildOrdersModel()

    ModuleFactory.withNamespace(NAME)
      .addTable(
        TableDef(
          name = "instruments",
          keyField = "ric",
          columns = Columns.fromNames("ric".string(), "description".string(), "bbg".string(), "isin".string(),
            "currency".string(), "exchange".string(), "lotSize".int()),
          VisualLinks(),
          joinFields = "ric"
        ),
        (table, vs) => new SimulatedBigInstrumentsProvider(table),
        (table, _, providerContainer, tableContainer) => ViewPortDef(
          columns = table.getTableDef.columns,
          service = new InstrumentsService(table, providerContainer)(tableContainer)
        )
      )
      .addTable(
        TableDef(
          name = "orders",
          keyField = "orderId",
          Columns.fromNames("orderId".string(), "side".char(), "ric".string(), "ccy".string(), "quantity".double(),
            "trader".string(), "filledQuantity".double(), "lastUpdate".long(), "created".long()),
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
          Columns.fromNames("id".string(), "idAsInt".int(), "ric".string(), "childCount".int(), "price".double(),
            "quantity".int(), "side".string(), "account".string(), "exchange".string(),
            "ccy".string(), "algo".string(), "volLimit".double(), "filledQty".int(), "openQty".int(),
            "averagePrice".double(), "status".string(), "lastUpdate".long()),
          VisualLinks(
            Link("ric", "prices", "ric")
          ),
          indices = Indices(
            Index("ric")
          ),
          joinFields = "id", "ric"
        ),
        (table, vs) => new ParentOrdersProvider(table, ordersModel),
        (table, provider, _, tableContainer) => ViewPortDef(
          columns = table.getTableDef.columns,
          service = new ParentOrdersService(table, provider)(tableContainer)
        )
      )
      .addTable(
        TableDef(
          name = "permissionedOrders",
          keyField = "id",
          Columns.fromNames("id".string(), "idAsInt".int(), "ric".string(), "childCount".int(), "price".double(),
            "quantity".int(), "side".string(), "account".string(), "exchange".string(),
            "ccy".string(), "algo".string(), "volLimit".double(), "filledQty".int(), "openQty".int(),
            "averagePrice".double(), "status".string(), "lastUpdate".long(), "owner".string(), "mask".int()),
          VisualLinks(),
          indices = Indices(
            Index("ric"),
            Index("mask")
          ),
          joinFields = "id", "ric", "owner"
        ).withPermissions((vp, tableContainer) => new OrderPermissionChecker(vp, tableContainer)),
        (table, _) => new PermissionedOrdersProvider(table, ordersModel)
      )
      .addTable(
        TableDef(
          name = "childOrders",
          keyField = "id",
          Columns.fromNames("parentOrderId".int(), "id".string(), "idAsInt".int(), "ric".string(), "price".double(),
            "quantity".int(), "side".string(), "account".string(), "exchange".string(), "ccy".string(),
            "strategy".string(), "volLimit".double(), "filledQty".int(), "openQty".int(), "averagePrice".double(),
            "status".string(), "lastUpdate".long()),
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
          Columns.fromNames("clOrderId".string(), "ric".string(), "quantity".double(), "orderType".string(), "price".double(), "priceLevel".string()),
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
          visibility = Public,
          baseTable = tableDefs.get(NAME, "orderEntry"),
          joinColumns = Columns.allFrom(tableDefs.get(NAME, "orderEntry")) ++ Columns.allFromExcept(tableDefs.get(PriceModule.NAME, "prices"), "ric"),
          joins =
            JoinTo(
              table = tableDefs.get(PriceModule.NAME, "prices"),
              joinSpec = JoinSpec(left = "ric", right = "ric", LeftOuterJoin)
            ),
          links = VisualLinks(),
          joinFields = Seq()
        ))
      .addJoinTable(tableDefs =>
        JoinTableDef(
          name = "instrumentPrices",
          visibility = Public,
          baseTable = tableDefs.get(NAME, "instruments"),
          joinColumns = Columns.allFrom(tableDefs.get(NAME, "instruments")) ++ Columns.allFromExcept(tableDefs.get(PriceModule.NAME, "prices"), "ric"),
          joins =
            JoinTo(
              table = tableDefs.get(PriceModule.NAME, "prices"),
              joinSpec = JoinSpec(left = "ric", right = "ric", LeftOuterJoin)
            ),
          links = VisualLinks(),
          joinFields = Seq()
        ))
      .addJoinTable(tableDefs =>
        JoinTableDef(
          name = "ordersPrices",
          visibility = Public,
          baseTable = tableDefs.get(NAME, "orders"),
          joinColumns = Columns.allFrom(tableDefs.get(NAME, "orders")) ++ Columns.allFromExcept(tableDefs.get(PriceModule.NAME, "prices"), "ric"),
          joins =
            JoinTo(
              table = tableDefs.get(PriceModule.NAME, "prices"),
              joinSpec = JoinSpec(left = "ric", right = "ric", LeftOuterJoin)
            ),
          links = VisualLinks(),
          joinFields = Seq()
        ))
      .asModule()
  }
}
