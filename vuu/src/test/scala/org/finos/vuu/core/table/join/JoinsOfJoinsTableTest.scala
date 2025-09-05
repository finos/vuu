package org.finos.vuu.core.table.join

import org.finos.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.{Clock, DefaultClock}
import org.finos.vuu.api._
import org.finos.vuu.client.messages.RequestId
import org.finos.vuu.core.table.{Columns, TableContainer, ViewPortColumnCreator}
import org.finos.vuu.feature.inmem.VuuInMemPlugin
import org.finos.vuu.net.ClientSessionId
import org.finos.vuu.plugin.DefaultPluginRegistry
import org.finos.vuu.provider.{JoinTableProviderImpl, MockProvider, ProviderContainer}
import org.finos.vuu.util.OutboundRowPublishQueue
import org.finos.vuu.util.table.TableAsserts.assertVpEq
import org.finos.vuu.viewport.{DefaultRange, ViewPortContainer, ViewPortSetup}
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers
import org.scalatest.prop.Tables.Table

/**
 * This fixture deals with the scenario where we want to create a table
 * that is the join of Instruments and Prices (InstrumentPrices)
 * and then we want to create a subsequent join which is InstrumentPrices to FxRates.
 * This involves being able to base join tables onto of existing Join tables.
 *
 */
class JoinsOfJoinsTableTest extends AnyFeatureSpec with Matchers with ViewPortSetup {

  implicit val timeProvider: Clock = new DefaultClock
  implicit val lifecycle: LifecycleContainer = new LifecycleContainer
  implicit val metrics: MetricsProvider = new MetricsProviderImpl

  def setupViewPort(tableContainer: TableContainer, providerContainer: ProviderContainer): ViewPortContainer = {

    val pluginRegistry = new DefaultPluginRegistry
    pluginRegistry.registerPlugin(new VuuInMemPlugin)

    val viewPortContainer = new ViewPortContainer(tableContainer, providerContainer, pluginRegistry)

    viewPortContainer
  }

  Scenario("check a tick all the way through from source to join table") {

    val dateTime = 1437728400000L

    val ordersDef = TableDef(
      name = "orders",
      keyField = "orderId",
      columns = Columns.fromNames("orderId:String", "trader:String", "ric:String", "tradeTime:Long", "quantity:Double", "ccyCross:String"),
      joinFields = "ric", "orderId", "ccyCross")

    val pricesDef = TableDef("prices", "ric", Columns.fromNames("ric:String", "bid:Double", "ask:Double", "last:Double", "open:Double", "close:Double"), "ric")

    val fxDef = TableDef("fx", "cross", Columns.fromNames("cross:String", "fxbid:Double", "fxask:Double"), "cross")

    val joinDef = JoinTableDef(
      name = "orderPrices",
      baseTable = ordersDef,
      joinColumns = Columns.allFrom(ordersDef) ++ Columns.allFromExcept(pricesDef, "ric"),
      joins =
        JoinTo(
          table = pricesDef,
          joinSpec = JoinSpec(left = "ric", right = "ric", LeftOuterJoin)
        ),
      links = VisualLinks(),
      joinFields = Seq("ccyCross", "orderId")
    )

    val joinDefFx = JoinTableDef(
      name = "orderPricesFx",
      visibility = Public,
      baseTable = ordersDef,
      joinColumns = Columns.allFrom(ordersDef) ++ Columns.allFromExcept(pricesDef, "ric") ++ Columns.allFrom(fxDef),
      links = VisualLinks(),
      joinFields = Seq("ccyCross", "orderId"),
      JoinTo(
        table = pricesDef,
        joinSpec = JoinSpec(left = "ric", right = "ric", LeftOuterJoin)
      ),
      JoinTo(
        table = fxDef,
        joinSpec = JoinSpec(left = "ccyCross", right = "cross", LeftOuterJoin)
      )
    )

    val joinProvider = JoinTableProviderImpl()

    val tableContainer = new TableContainer(joinProvider)

    val orders = tableContainer.createTable(ordersDef)
    val prices = tableContainer.createTable(pricesDef)
    val fx = tableContainer.createTable(fxDef)

    val orderPrices = tableContainer.createJoinTable(joinDef)
    val orderPricesFx = tableContainer.createJoinTable(joinDefFx)

    val ordersProvider = new MockProvider(orders)
    val pricesProvider = new MockProvider(prices)
    val fxProvider = new MockProvider(fx)

    val providerContainer = new ProviderContainer(joinProvider)

    val viewPortContainer = setupViewPort(tableContainer, providerContainer)

    joinProvider.start()

    fxProvider.tick("USDGBP", Map("cross" -> "USDGBP", "fxbid" -> 0.703, "fxask" -> 0.703))
    fxProvider.tick("USDEUR", Map("cross" -> "USDEUR", "fxbid" -> 1.213, "fxask" -> 1.223))

    ordersProvider.tick("NYC-0001", Map("orderId" -> "NYC-0001", "trader" -> "chris", "tradeTime" -> dateTime, "quantity" -> 100, "ric" -> "VOD.L", "ccyCross" -> "USDGBP"))
    pricesProvider.tick("VOD.L", Map("ric" -> "VOD.L", "bid" -> 220.0, "ask" -> 222.0))

    pricesProvider.tick("BT.L", Map("ric" -> "BT.L", "bid" -> 500.0, "ask" -> 501.0))
    ordersProvider.tick("NYC-0002", Map("orderId" -> "NYC-0002", "trader" -> "chris", "tradeTime" -> dateTime, "quantity" -> 100, "ric" -> "BT.L", "ccyCross" -> "USDEUR"))

    joinProvider.runOnce()

    val session = ClientSessionId("sess-01", "chris")

    val outQueue = new OutboundRowPublishQueue()

    val vpcolumns = ViewPortColumnCreator.create(orderPricesFx, List("orderId", "trader", "tradeTime", "quantity", "ric", "fxbid", "fxask"))

    val viewPort = viewPortContainer.create(RequestId.oneNew(), session, outQueue, orderPricesFx, DefaultRange, vpcolumns)

    viewPortContainer.runOnce()

    assertVpEq(filterByVpId(combineQs(viewPort), viewPort)) {
      Table(
        ("orderId", "trader", "tradeTime", "quantity", "ric", "fxbid", "fxask"),
        ("NYC-0001", "chris", 1437728400000L, 100, "VOD.L", 0.703, 0.703),
        ("NYC-0002", "chris", 1437728400000L, 100, "BT.L", 1.213, 1.223)
      )
    }
  }

  Scenario("Check join of joins with data arriving out of order") {

    val dateTime = 1437728400000L

    val ordersDef = TableDef(
      name = "orders",
      keyField = "orderId",
      columns = Columns.fromNames("orderId:String", "trader:String", "ric:String", "tradeTime:Long", "quantity:Double", "ccyCross:String"),
      joinFields = "ric", "orderId", "ccyCross")

    val pricesDef = TableDef("prices", "ric", Columns.fromNames("ric:String", "bid:Double", "ask:Double", "last:Double", "open:Double", "close:Double"), "ric")

    val fxDef = TableDef("fx", "cross", Columns.fromNames("cross:String", "fxbid:Double", "fxask:Double"), "cross")

    val joinDef = JoinTableDef(
      name = "orderPrices",
      baseTable = ordersDef,
      joinColumns = Columns.allFrom(ordersDef) ++ Columns.allFromExcept(pricesDef, "ric"),
      joins =
        JoinTo(
          table = pricesDef,
          joinSpec = JoinSpec(left = "ric", right = "ric", LeftOuterJoin)
        ),
      links = VisualLinks(),
      joinFields = Seq("ccyCross", "orderId")
    )

    val joinDefFx = JoinTableDef(
      name = "orderPricesFx",
      visibility = Public,
      baseTable = ordersDef,
      joinColumns = Columns.allFrom(ordersDef) ++ Columns.allFromExcept(pricesDef, "ric") ++ Columns.allFrom(fxDef),
      links = VisualLinks(),
      joinFields = Seq("ccyCross", "orderId"),
      JoinTo(
        table = pricesDef,
        joinSpec = JoinSpec(left = "ric", right = "ric", LeftOuterJoin)
      ),
      JoinTo(
        table = fxDef,
        joinSpec = JoinSpec(left = "ccyCross", right = "cross", LeftOuterJoin)
      )
    )

    val joinProvider = JoinTableProviderImpl()

    val tableContainer = new TableContainer(joinProvider)

    val orders = tableContainer.createTable(ordersDef)
    val prices = tableContainer.createTable(pricesDef)
    val fx = tableContainer.createTable(fxDef)

    val orderPrices = tableContainer.createJoinTable(joinDef)
    val orderPricesFx = tableContainer.createJoinTable(joinDefFx)

    val ordersProvider = new MockProvider(orders)
    val pricesProvider = new MockProvider(prices)
    val fxProvider = new MockProvider(fx)

    val providerContainer = new ProviderContainer(joinProvider)

    val viewPortContainer = setupViewPort(tableContainer, providerContainer)

    joinProvider.start()

    ordersProvider.tick("NYC-0001", Map("orderId" -> "NYC-0001", "trader" -> "chris", "tradeTime" -> dateTime, "quantity" -> 100, "ric" -> "VOD.L", "ccyCross" -> "USDGBP"))
    ordersProvider.tick("NYC-0002", Map("orderId" -> "NYC-0002", "trader" -> "chris", "tradeTime" -> dateTime, "quantity" -> 100, "ric" -> "BT.L", "ccyCross" -> "USDEUR"))

    pricesProvider.tick("BT.L", Map("ric" -> "BT.L", "bid" -> 500.0, "ask" -> 501.0))
    pricesProvider.tick("VOD.L", Map("ric" -> "VOD.L", "bid" -> 220.0, "ask" -> 222.0))

    fxProvider.tick("USDEUR", Map("cross" -> "USDEUR", "fxbid" -> 1.213, "fxask" -> 1.223))
    fxProvider.tick("USDGBP", Map("cross" -> "USDGBP", "fxbid" -> 0.703, "fxask" -> 0.703))

    joinProvider.runOnce()

    val session = ClientSessionId("sess-01", "chris")

    val outQueue = new OutboundRowPublishQueue()

    val vpcolumns = ViewPortColumnCreator.create(orderPricesFx, List("orderId", "trader", "tradeTime", "quantity", "ric", "fxbid", "fxask"))

    val viewPort = viewPortContainer.create(RequestId.oneNew(), session, outQueue, orderPricesFx, DefaultRange, vpcolumns)

    viewPortContainer.runOnce()

    assertVpEq(filterByVpId(combineQs(viewPort), viewPort)) {
      Table(
        ("orderId", "trader", "tradeTime", "quantity", "ric", "fxbid", "fxask"),
        ("NYC-0001", "chris", 1437728400000L, 100, "VOD.L", 0.703, 0.703),
        ("NYC-0002", "chris", 1437728400000L, 100, "BT.L", 1.213, 1.223)
      )
    }


  }

  Scenario("Check join of join of joins in reverse order") {

    val dateTime = 1437728400000L

    val ordersDef = TableDef(
      name = "orders",
      keyField = "orderId",
      columns = Columns.fromNames("orderId:String", "ric:String", "tradeTime:Long", "quantity:Double"),
      joinFields = "orderId", "ric")

    val instrumentDef = TableDef(
      name = "instruments",
      keyField = "ric",
      columns = Columns.fromNames("ric:String", "currency:String"),
      joinFields = "ric", "currency")

    val currencyDef = TableDef(
      "currencies",
      "currency",
      Columns.fromNames("currency:String", "country:String"),
      "currency")

    val join1Def = JoinTableDef(
      name = "instrumentToCurrency",
      baseTable = instrumentDef,
      joinColumns = Columns.allFrom(instrumentDef) ++ Columns.allFromExcept(currencyDef, "currency"),
      joins =
        JoinTo(
          table = currencyDef,
          joinSpec = JoinSpec(left = "currency", right = "currency", LeftOuterJoin)
        ),
      links = VisualLinks(),
      joinFields = Seq("ric")
    )

    val join2Def = JoinTableDef(
      name = "orderToInstrument",
      baseTable = ordersDef,
      joinColumns = Columns.allFrom(ordersDef) ++ Columns.allFromExcept(join1Def, "ric"),
      joins =
        JoinTo(
          table = join1Def,
          joinSpec = JoinSpec(left = "ric", right = "ric", LeftOuterJoin)
        ),
      links = VisualLinks(),
      joinFields = Seq("orderId")
    )

    val joinProvider = JoinTableProviderImpl()

    val tableContainer = new TableContainer(joinProvider)

    val orders = tableContainer.createTable(ordersDef)
    val instruments = tableContainer.createTable(instrumentDef)
    val currencies = tableContainer.createTable(currencyDef)

    val instrumentToCurrency = tableContainer.createJoinTable(join1Def)
    val orderToInstrument = tableContainer.createJoinTable(join2Def)

    val ordersProvider = new MockProvider(orders)
    val instrumentsProvider = new MockProvider(instruments)
    val currenciesProvider = new MockProvider(currencies)

    val providerContainer = new ProviderContainer(joinProvider)

    val viewPortContainer = setupViewPort(tableContainer, providerContainer)

    joinProvider.start()

    joinProvider.runOnce()

    val session = ClientSessionId("sess-01", "chris")

    val outQueue = new OutboundRowPublishQueue()

    val vpcolumns = ViewPortColumnCreator.create(orderToInstrument, List("orderId", "ric", "currency", "country"))

    val viewPort = viewPortContainer.create(RequestId.oneNew(), session, outQueue, orderToInstrument, DefaultRange, vpcolumns)

    viewPortContainer.runOnce()

    assertVpEq(filterByVpId(combineQs(viewPort), viewPort)) {
      Table(
        ("orderId", "ric", "currency", "country"),
      )
    }

    ordersProvider.tick("NYC-0001", Map("orderId" -> "NYC-0001", "tradeTime" -> dateTime, "quantity" -> 100, "ric" -> "VOD.L"))
    ordersProvider.tick("NYC-0002", Map("orderId" -> "NYC-0002", "tradeTime" -> dateTime, "quantity" -> 100, "ric" -> "AIR.PA"))

    joinProvider.runOnce()
    viewPortContainer.runOnce()

    instrumentsProvider.tick("VOD.L", Map("ric" -> "VOD.L", "currency" -> "GBP"))
    instrumentsProvider.tick("AIR.PA", Map("ric" -> "AIR.PA", "currency" -> "EUR"))

    joinProvider.runOnce()
    viewPortContainer.runOnce()

    currenciesProvider.tick("GBP", Map("currency" -> "GBP", "country" -> "UK"))
    currenciesProvider.tick("EUR", Map("currency" -> "EUR", "country" -> "FR"))

    joinProvider.runOnce()
    viewPortContainer.runOnce()

    assertVpEq(filterByVpId(combineQs(viewPort), viewPort)) {
      Table(
        ("orderId", "ric", "currency", "country"),
        ("NYC-0001", "VOD.L", "GBP", "UK"),
        ("NYC-0002", "AIR.PA", "EUR", "FR")
      )
    }

  }

}
