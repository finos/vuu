package org.finos.vuu.viewport.sessiontable

import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.{Clock, TestFriendlyClock}
import org.finos.vuu.api._
import org.finos.vuu.core.VuuServer
import org.finos.vuu.core.module.ModuleFactory.stringToString
import org.finos.vuu.core.module.{StaticServedResource, ViewServerModule}
import org.finos.vuu.core.table.{Columns, DataTable, RowWithData, TableContainer}
import org.finos.vuu.net.ClientSessionId
import org.finos.vuu.net.rest.RestService
import org.finos.vuu.net.rpc.RpcHandler
import org.finos.vuu.provider.{JoinTableProviderImpl, MockProvider, Provider, ProviderContainer}
import org.finos.vuu.util.OutboundRowPublishQueue
import org.finos.vuu.viewport._
class AbstractSessionTableTestCase extends AbstractViewPortTestCase{

  final val TEST_TIME = 1450770869442L
  final val clock: Clock = new TestFriendlyClock(TEST_TIME)
  var counter: Int = 0

  def createViewServerModule(theName: String) = {
    new ViewServerModule {
      override def name: String = theName

      override def tableDefs: List[TableDef] = ???

      override def serializationMixin: AnyRef = ???

      override def rpcHandlersUnrealized: List[VuuServer => RpcHandler] = ???

      override def getProviderForTable(table: DataTable, viewserver: VuuServer)(implicit time: Clock, lifecycleContainer: LifecycleContainer): Provider = ???

      override def staticFileResources(): List[StaticServedResource] = ???

      override def restServicesUnrealized: List[VuuServer => RestService] = ???

      override def viewPortDefs: Map[String, (DataTable, Provider, ProviderContainer) => ViewPortDef] = ???
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

  def createDefaultSessionTableInfra(): (ViewPortContainer, DataTable, MockProvider, DataTable, MockProvider, ClientSessionId, OutboundRowPublishQueue, OutboundRowPublishQueue, DataTable, TableContainer, DataTable) = {
    implicit val lifecycle = new LifecycleContainer

    val dateTime = 1437728400000l //new LocalDateTime(2015, 7, 24, 11, 0).toDateTime.toInstant.getMillis

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

    val basketOrdersPricesDef = JoinSessionTableDef(
      name = "basketOrdersPrices",
      basketOrdersDef,
      columns = Columns.fromNames("clientOrderId:String", "orderId:String", "ric:String", "lastModifiedTime:Long", "quantity:Int", "price:Long", "priceType:String", "currency:String", "exchange:String"),
      joins = JoinTo(
        table = pricesDef,
        joinSpec = JoinSpec(left = "ric",
          right = "ric",
          LeftOuterJoin)
      ),
      joinFields = List()
    )

    basketOrdersPricesDef.setModule(module)

    val joinProvider = JoinTableProviderImpl() // new EsperJoinTableProviderImpl()

    val tableContainer = new TableContainer(joinProvider)

    val orders = tableContainer.createTable(ordersDef)
    val prices = tableContainer.createTable(pricesDef)
    val orderPrices = tableContainer.createJoinTable(joinDef)
    val instruments = tableContainer.createTable(instrumentsDef)
    //we create the archetype session table, then whenever a new viewport is created we'll open a new one
    val basketOrders = tableContainer.createTable(basketOrdersDef)
    val basketOrdersPrices = tableContainer.createTable(basketOrdersPricesDef)

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

    (viewPortContainer, instruments, instrumentsProvider, prices, pricesProvider, session, outQueue, highPriorityQueue, basketOrders, tableContainer, basketOrdersPrices)
  }

}
