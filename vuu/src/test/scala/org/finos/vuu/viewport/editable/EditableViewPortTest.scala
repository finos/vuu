package org.finos.vuu.viewport.editable

import org.finos.toolbox.jmx.MetricsProvider
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.Clock
import org.finos.vuu.api._
import org.finos.vuu.core.IVuuServer
import org.finos.vuu.core.module.ModuleFactory.stringToString
import org.finos.vuu.core.module.{StaticServedResource, TableDefContainer, ViewServerModule}
import org.finos.vuu.core.table._
import org.finos.vuu.net.ClientSessionId
import org.finos.vuu.net.rest.RestService
import org.finos.vuu.net.rpc.RpcHandler
import org.finos.vuu.provider._
import org.finos.vuu.util.OutboundRowPublishQueue
import org.finos.vuu.viewport._
import org.scalatest.GivenWhenThen
import org.scalatest.matchers.should.Matchers

abstract class EditableViewPortTest extends AbstractViewPortTestCase with Matchers with GivenWhenThen {

  final val TEST_TIME = 1450770869442L
  //final val clock: Clock = new TestFriendlyClock(TEST_TIME)
  //var counter: Int = 0

  def createViewServerModule(theName: String): ViewServerModule = {
    new ViewServerModule {
      override def name: String = theName
      override def tableDefContainer: TableDefContainer = ???
      override def tableDefs: List[TableDef] = ???
      override def serializationMixin: AnyRef = ???
      override def getProviderForTable(table: DataTable, viewserver: IVuuServer)(implicit time: Clock, lifecycleContainer: LifecycleContainer): Provider = ???
      override def staticFileResources(): List[StaticServedResource] = ???
      override def restServicesUnrealized: List[IVuuServer => RestService] = ???
      override def viewPortDefs: Map[String, (DataTable, Provider, ProviderContainer, TableContainer) => ViewPortDef] = ???
    }
  }

  def createRpcHandlerInstruments(mockProvider: MockProvider, tableContainer: TableContainer, clock: Clock): RpcHandler = {
    new RpcHandler {

      final val BASE_BASKET_TABLE = "basketOrders"

      def createBasket(selection: ViewPortSelection, sessionId: ClientSessionId): ViewPortAction = {

        val baseTable = tableContainer.getTable(BASE_BASKET_TABLE)

        val sessionTable = tableContainer.createSimpleSessionTable(baseTable, sessionId)

        val rows = selection.selectionKeys.map(selection.viewPort.table.pullRow(_)).toList

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

          sessionTable.processUpdate(clOrderId, RowWithData(clOrderId, dataMap))
        })

        OpenDialogViewPortAction(ViewPortTable(sessionTable.name, baseTable.getTableDef.getModule().name))
      }

      override def menuItems(): ViewPortMenu = ViewPortMenu("Test Menu",
        new SelectionViewPortMenuItem("Create Basket", "", this.createBasket, "CREATE_BASKET")
      )
    }
  }

  //final val TEST_TIME = 1450770869442L
  var counter: Int = 0

  def setupEditableTableInfra()(implicit clock: Clock, metrics: MetricsProvider, lifecycle: LifecycleContainer): (ViewPortContainer, Map[String, (DataTable, MockProvider)], ClientSessionId, OutboundRowPublishQueue, TableContainer, JoinTableProvider) = {

    val module = createViewServerModule("TEST")

    val constituentDef = TableDef(
      name = "constituent",
      keyField = "id",
      columns = Columns.fromNames("id".string(), "ric".string(), "quantity".long()),
      VisualLinks(),
      joinFields = "id", "ric"
    )

    val instrumentDef = TableDef(
      name = "instrument",
      keyField = "ric",
      columns = Columns.fromNames("ric:String", "description:String"),
      joinFields = "ric"
    )

    val pricesDef = TableDef(
      name = "price",
      keyField = "ric",
      columns = Columns.fromNames("ric:String", "bid:Long", "ask:Long"),
      joinFields = "ric"
    )

    val joinDef = JoinTableDef(
      name = "consInstrumentPrice",
      visibility = Public,
      baseTable = constituentDef,
      joinColumns = Columns.allFrom(constituentDef) ++ Columns.allFromExcept(instrumentDef, "ric") ++ Columns.allFromExcept(pricesDef, "ric"),
      links = VisualLinks(),
      joinFields = List("ric"),
      joins =
        JoinTo(
          table = instrumentDef,
          joinSpec = JoinSpec(left = "ric", right = "ric", LeftOuterJoin)
        ),
      JoinTo(
        table = pricesDef,
        joinSpec = JoinSpec(left = "ric", right = "ric", LeftOuterJoin)
      )
    )

    constituentDef.setModule(module)
    instrumentDef.setModule(module)
    pricesDef.setModule(module)
    joinDef.setModule(module)

    val joinProvider = JoinTableProviderImpl()

    val tableContainer = new TableContainer(joinProvider)

    val constituent = tableContainer.createTable(constituentDef)
    val instrument = tableContainer.createTable(instrumentDef)
    val prices = tableContainer.createTable(pricesDef)

    val consInstrumentPrices = tableContainer.createJoinTable(joinDef)

    val constituentProvider = new MockProvider(constituent)
    val instrumentProvider = new MockProvider(instrument)
    val pricesProvider = new MockProvider(prices)

    val providerContainer = new ProviderContainer(joinProvider)
    val viewPortContainer = setupViewPort(tableContainer, providerContainer)

    joinProvider.start()
    joinProvider.runOnce()

    val session = ClientSessionId("sess-01", "chris")

    val outQueue = new OutboundRowPublishQueue()

    val mapTables = Map(constituent.name -> (constituent, constituentProvider),
                        instrument.name -> (instrument, instrumentProvider),
                        prices.name -> (prices, pricesProvider),
                        consInstrumentPrices.name -> (consInstrumentPrices, null))

    (viewPortContainer,  mapTables, session, outQueue, tableContainer, joinProvider)
  }

  def createViewPortDefFunc(tableContainer: TableContainer, rpcHandler: RpcHandler, clock: Clock): (DataTable, Provider, ProviderContainer, TableContainer) => ViewPortDef = {
    val func = (t: DataTable, provider: Provider, pc: ProviderContainer, table: TableContainer) => ViewPortDef(t.getTableDef.columns, rpcHandler)
    func
  }

}
