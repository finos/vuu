package org.finos.vuu.viewport.sessiontable

import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.{Clock, TestFriendlyClock}
import org.finos.vuu.api._
import org.finos.vuu.client.messages.{ClientOrderId, RequestId}
import org.finos.vuu.core.VuuServer
import org.finos.vuu.core.module.ModuleFactory.stringToString
import org.finos.vuu.core.module.{StaticServedResource, ViewServerModule}
import org.finos.vuu.core.table.TableTestHelper.{combineQs, emptyQueues}
import org.finos.vuu.core.table.{Columns, DataTable, RowWithData, TableContainer, ViewPortColumnCreator}
import org.finos.vuu.net.ClientSessionId
import org.finos.vuu.net.rest.RestService
import org.finos.vuu.net.rpc.RpcHandler
import org.finos.vuu.provider.{JoinTableProviderImpl, MockProvider, Provider, ProviderContainer}
import org.finos.vuu.util.OutboundRowPublishQueue
import org.finos.vuu.util.table.TableAsserts.assertVpEq
import org.finos.vuu.viewport.{AbstractViewPortTestCase, CellViewPortMenuItem, DefaultRange, NoAction, OpenDialogViewPortAction, RowViewPortMenuItem, SelectionViewPortMenuItem, TableViewPortMenuItem, ViewPortAction, ViewPortContainer, ViewPortMenu, ViewPortSelectedIndices, ViewPortSelection, ViewPortTable}
import org.scalatest.GivenWhenThen
import org.scalatest.matchers.should.Matchers
import org.scalatest.prop.Tables.Table


class SessionTableViewportTest extends AbstractViewPortTestCase with Matchers with GivenWhenThen {

  final val TEST_TIME = 1450770869442L
  final val clock: Clock = new TestFriendlyClock(TEST_TIME)
  var counter: Int = 0

  def createViewServerModule(theName: String): ViewServerModule = {
    new ViewServerModule {
      override def name: String = theName

      override def tableDefs: List[TableDef] = ???

      override def serializationMixin: AnyRef = ???

      override def rpcHandlersUnrealized: List[VuuServer => RpcHandler] = ???

      override def getProviderForTable(table: DataTable, viewserver: VuuServer)(implicit time: Clock, lifecycleContainer: LifecycleContainer): Provider = ???

      override def staticFileResources(): List[StaticServedResource] = ???

      override def restServicesUnrealized: List[VuuServer => RestService] = ???

      override def viewPortDefs: Map[String, (DataTable, Provider, ProviderContainer, TableContainer) => ViewPortDef] = ???
    }
  }

  def createRpcHandlerInstruments(mockProvider: MockProvider, tableContainer: TableContainer, clock: Clock): RpcHandler = {
    new RpcHandler {

      final val BASE_BASKET_TABLE = "basketOrders"

      def createBasket(selection: ViewPortSelection, sessionId: ClientSessionId): ViewPortAction = {

        val baseTable = tableContainer.getTable(BASE_BASKET_TABLE)

        val sessionTable = tableContainer.createSimpleSessionTable(baseTable, sessionId)

        val rows = selection.rowKeyIndex.keys.map(selection.viewPort.table.pullRow(_)).toList

        rows.foreach(row => {

          counter += 1
          val ric = row.get("ric")
          val currency = row.get("currency")
          val exchange = row.get("exchange")
          val clOrderId = "clOrderId-" + clock.now() + "-" + (counter)

          val dataMap = Map(
            "clientOrderId" -> clOrderId,
            "ric" -> ric,
            "currency" -> currency,
            "lastModifiedTime" -> clock.now(),
            "exchange" -> exchange
          )

          sessionTable.processUpdate(clOrderId, RowWithData(clOrderId, dataMap), clock.now())
        })

        OpenDialogViewPortAction(ViewPortTable(sessionTable.name, baseTable.getTableDef.getModule().name))
      }

      override def menuItems(): ViewPortMenu = ViewPortMenu("Test Menu",
        new SelectionViewPortMenuItem("Create Basket", "", this.createBasket, "CREATE_BASKET")
      )
    }
  }

  def createDefaultSessionTableInfra(): (ViewPortContainer, DataTable, MockProvider, DataTable, MockProvider, ClientSessionId, OutboundRowPublishQueue, OutboundRowPublishQueue, DataTable, TableContainer) = {
    implicit val lifecycle = new LifecycleContainer

    val dateTime = 1437728400000L //new LocalDateTime(2015, 7, 24, 11, 0).toDateTime.toInstant.getMillis

    val module = createViewServerModule("TEST")

    val instrumentsDef = TableDef(
      name = "instruments",
      keyField = "ric",
      columns = Columns.fromNames("ric".string(), "description".string(), "bbg".string(), "isin".string(), "currency".string(), "exchange".string(), "lotSize".int()),
      VisualLinks(),
      joinFields = "ric"
    )

    instrumentsDef.setModule(module)

    val ordersDef = TableDef(
      name = "orders",
      keyField = "orderId",
      columns = Columns.fromNames("orderId:String", "trader:String", "ric:String", "tradeTime:Long", "quantity:Int"),
      links = VisualLinks(
        Link("ric", "prices", "ric")
      ),
      indices = Indices(
        Index("ric")
      ),
      joinFields = "ric", "orderId"
    )

    ordersDef.setModule(module)

    val pricesDef = TableDef("prices", "ric", Columns.fromNames("ric:String", "bid:Double", "ask:Double", "last:Double", "open:Double", "close:Double", "exchange:String"), "ric")

    pricesDef.setModule(module)

    val joinDef = JoinTableDef(
      name = "orderPrices",
      baseTable = ordersDef,
      joinColumns = Columns.allFrom(ordersDef) ++ Columns.allFromExcept(pricesDef, "ric"),
      joins =
        JoinTo(
          table = pricesDef,
          joinSpec = JoinSpec(left = "ric", right = "ric", LeftOuterJoin)
        ),
      joinFields = Seq()
    )

    joinDef.setModule(module)

    val basketOrdersDef = SessionTableDef(
      name = "basketOrders",
      keyField = "clientOrderId",
      columns = Columns.fromNames("clientOrderId:String", "orderId:String", "currency:String", "ric:String", "lastModifiedTime:Long", "quantity:Int", "price:Long", "priceType:String", "effectivePrice:Long", "exchange:String")
    )

    basketOrdersDef.setModule(module)


    val basketOrdersPrices = JoinSessionTableDef(
      name = "basketOrdersPrices",
      keyField = "clientOrderId",
      columns = Columns.fromNames("clientOrderId:String", "orderId:String", "ric:String", "lastModifiedTime:Long", "quantity:Int", "price:Long", "priceType:String", "currency:String", "exchange:String")
    )

    val joinProvider = JoinTableProviderImpl()

    val tableContainer = new TableContainer(joinProvider)

    val orders = tableContainer.createTable(ordersDef)
    val prices = tableContainer.createTable(pricesDef)
    val orderPrices = tableContainer.createJoinTable(joinDef)
    val basketOrders = tableContainer.createTable(basketOrdersDef)
    val instruments = tableContainer.createTable(instrumentsDef)

    val ordersProvider = new MockProvider(orders)
    val pricesProvider = new MockProvider(prices)
    val instrumentsProvider = new MockProvider(instruments)

    val providerContainer = new ProviderContainer(joinProvider)

    val viewPortContainer = setupViewPort(tableContainer, providerContainer)

    joinProvider.start()

    joinProvider.runOnce()

    val session = ClientSessionId("sess-01", "chris")

    val outQueue = new OutboundRowPublishQueue()
    val highPriorityQueue = new OutboundRowPublishQueue()

    (viewPortContainer, instruments, instrumentsProvider, prices, pricesProvider, session, outQueue, highPriorityQueue, basketOrders, tableContainer)
  }

  def createViewPortDefFunc(tableContainer: TableContainer, clock: Clock): (DataTable, Provider, ProviderContainer, TableContainer) => ViewPortDef = {
    val func = (t: DataTable, provider: Provider, pc: ProviderContainer, tableContainer: TableContainer) => ViewPortDef(t.getTableDef.columns, createRpcHandlerInstruments(provider.asInstanceOf[MockProvider], tableContainer, clock))
    func
  }

  Feature("Viewports on session tables") {

    Scenario("Create a session table from an rpc call and edit it") {

      val (viewPortContainer, instruments, instrumentsProvider, prices, pricesProvider, session, outQueue, highPriorityQueue, basketOrders, tableContainer) = createDefaultSessionTableInfra()

      val vpcolumns = ViewPortColumnCreator.create(instruments, instruments.getTableDef.columns.map(_.name).toList)

      Given("We have a viewport on instruments with an rpc service attached...")
      viewPortContainer.addViewPortDefinition(instruments.getTableDef.name, createViewPortDefFunc(tableContainer, clock))

      val viewPort = viewPortContainer.create(RequestId.oneNew(), session, outQueue, highPriorityQueue, instruments, DefaultRange, vpcolumns)

      viewPortContainer.runOnce()

      And("we've ticked in some data")
      instrumentsProvider.tick("VOD.L", Map("ric" -> "VOD.L", "description" -> "Vodafone", "bbg" -> "VOD LN", "currency" -> "GBp", "exchange" -> "XLON/SETS"))
      instrumentsProvider.tick("BT.L", Map("ric" -> "BT.L", "description" -> "British Telecom", "bbg" -> "BT LN", "currency" -> "GBp", "exchange" -> "XLON/SETS"))

      viewPortContainer.runOnce()

      val combinedUpdates = combineQs(viewPort)

      Then("verify the table is populated")
      assertVpEq(combinedUpdates) {
        Table(
          ("ric", "description", "bbg", "currency", "exchange", "lotSize", "isin"),
          ("VOD.L", "Vodafone", "VOD LN", "GBp", "XLON/SETS", null, null),
          ("BT.L", "British Telecom", "BT LN", "GBp", "XLON/SETS", null, null)
        )
      }

      Then("update selection to VOD.L row....")
      viewPortContainer.changeSelection(session, outQueue, viewPort.id, ViewPortSelectedIndices(Array(0)))

      emptyQueues(viewPort)

      And("call rpc service to create new session table")
      val result = viewPortContainer.callRpcSelection(viewPort.id, "CREATE_BASKET", session)

      result.getClass shouldBe (classOf[OpenDialogViewPortAction])

      result match {
        case x: OpenDialogViewPortAction =>
          val basketTable = tableContainer.getTable(x.table.table)
          val vpColumns2 = ViewPortColumnCreator.create(basketTable, basketTable.getTableDef.columns.map(_.name).toList)
          val viewPort2 = viewPortContainer.create(RequestId.oneNew(), session, outQueue, highPriorityQueue, basketTable, DefaultRange, vpColumns2)

          viewPortContainer.runOnce()

          val combinedUpdates2 = combineQs(viewPort2)

          Then("verify the table is populated")
          assertVpEq(combinedUpdates2) {
            Table(
              ("ric", "clientOrderId", "currency", "lastModifiedTime", "quantity", "price", "priceType", "exchange", "orderId", "effectivePrice"),
              ("VOD.L", "clOrderId-1450770869442-1", "GBp", 1450770869442L, null, null, null, "XLON/SETS", null, null)
            )
          }
      }
    }
  }
}
