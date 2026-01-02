package org.finos.vuu.core.table.join

import org.finos.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.{Clock, DefaultClock, TestFriendlyClock}
import org.finos.vuu.api.*
import org.finos.vuu.api.TableVisibility.Public
import org.finos.vuu.client.messages.RequestId
import org.finos.vuu.core.auths.VuuUser
import org.finos.vuu.core.filter.`type`.AllowAllPermissionFilter
import org.finos.vuu.core.index.IndexedField
import org.finos.vuu.core.table.datatype.EpochTimestamp
import org.finos.vuu.core.table.{Columns, DefaultColumn, RowWithData, TableContainer, ViewPortColumnCreator}
import org.finos.vuu.feature.inmem.VuuInMemPlugin
import org.finos.vuu.net.{ClientSessionId, FilterSpec, SortSpec}
import org.finos.vuu.plugin.DefaultPluginRegistry
import org.finos.vuu.provider.{JoinTableProviderImpl, MockProvider, ProviderContainer}
import org.finos.vuu.util.OutboundRowPublishQueue
import org.finos.vuu.util.table.TableAsserts.assertVpEq
import org.finos.vuu.viewport.{DefaultRange, RowUpdateType, ViewPortContainer, ViewPortSetup}
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
      joinColumns = Columns.allFrom(ordersDef) ++ Columns.allFromExceptDefaultAnd(pricesDef, "ric"),
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
      joinColumns = Columns.allFrom(ordersDef) ++ Columns.allFromExceptDefaultAnd(pricesDef, "ric") ++ Columns.allFrom(fxDef),
      links = VisualLinks(),
      permissionFunction = (_, _) => AllowAllPermissionFilter,
      defaultSort = SortSpec(List.empty),
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

    val user = VuuUser("chris")

    val session = ClientSessionId("sess-01", "channel")

    val outQueue = new OutboundRowPublishQueue()

    val vpcolumns = ViewPortColumnCreator.create(orderPricesFx, List("orderId", "trader", "tradeTime", "quantity", "ric", "fxbid", "fxask"))

    val viewPort = viewPortContainer.create(RequestId.oneNew(), user, session, outQueue, orderPricesFx, DefaultRange, vpcolumns)

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
      joinColumns = Columns.allFrom(ordersDef) ++ Columns.allFromExceptDefaultAnd(pricesDef, "ric"),
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
      joinColumns = Columns.allFrom(ordersDef) ++ Columns.allFromExceptDefaultAnd(pricesDef, "ric") ++ Columns.allFrom(fxDef),
      links = VisualLinks(),
      permissionFunction = (_, _) => AllowAllPermissionFilter,
      defaultSort = SortSpec(List.empty),
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

    val user = VuuUser("chris")

    val session = ClientSessionId("sess-01", "channel")

    val outQueue = new OutboundRowPublishQueue()

    val vpcolumns = ViewPortColumnCreator.create(orderPricesFx, List("orderId", "trader", "tradeTime", "quantity", "ric", "fxbid", "fxask"))

    val viewPort = viewPortContainer.create(RequestId.oneNew(), user, session, outQueue, orderPricesFx, DefaultRange, vpcolumns)

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
      joinColumns = Columns.allFrom(instrumentDef) ++ Columns.allFromExceptDefaultAnd(currencyDef, "currency"),
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
      joinColumns = Columns.allFrom(ordersDef) ++ Columns.allFromExceptDefaultAnd(join1Def, "ric"),
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

    val user = VuuUser("chris")

    val session = ClientSessionId("sess-01", "channel")

    val outQueue = new OutboundRowPublishQueue()

    val vpcolumns = ViewPortColumnCreator.create(orderToInstrument, List("orderId", "ric", "currency", "country"))

    val viewPort = viewPortContainer.create(RequestId.oneNew(), user, session, outQueue, orderToInstrument, DefaultRange, vpcolumns)

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

  Scenario("check created timestamp and last updated timestamp are populated correctly for Join of Join of Joins") {

    implicit val timeProvider: TestFriendlyClock = new TestFriendlyClock(1000L)
    implicit val lifecycle: LifecycleContainer = new LifecycleContainer
    val joinProvider = JoinTableProviderImpl()
    val providerContainer = new ProviderContainer(joinProvider)
    val tableContainer = new TableContainer(joinProvider)
    val pluginRegistry = new DefaultPluginRegistry
    pluginRegistry.registerPlugin(new VuuInMemPlugin)
    val viewPortContainer = new ViewPortContainer(tableContainer, providerContainer, pluginRegistry)

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
      joinColumns = Columns.allFrom(instrumentDef) ++ Columns.allFromExceptDefaultAnd(currencyDef, "currency"),
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
      joinColumns = Columns.allFrom(ordersDef) ++ Columns.allFromExceptDefaultAnd(join1Def, "ric"),
      joins =
        JoinTo(
          table = join1Def,
          joinSpec = JoinSpec(left = "ric", right = "ric", LeftOuterJoin)
        ),
      links = VisualLinks(),
      joinFields = Seq("orderId")
    )

    val orders = tableContainer.createTable(ordersDef)
    val instruments = tableContainer.createTable(instrumentDef)
    val currencies = tableContainer.createTable(currencyDef)

    val instrumentToCurrency = tableContainer.createJoinTable(join1Def)
    val orderToInstrument = tableContainer.createJoinTable(join2Def)

    val ordersProvider = new MockProvider(orders)
    val instrumentsProvider = new MockProvider(instruments)
    val currenciesProvider = new MockProvider(currencies)

    joinProvider.start()
    joinProvider.runOnce()

    val user = VuuUser("chris")
    val session = ClientSessionId("sess-01", "channel")
    val outQueue = new OutboundRowPublishQueue()
    val vpcolumns = ViewPortColumnCreator.create(orderToInstrument, List("orderId", "ric", "currency", "country", DefaultColumn.CreatedTime.name, DefaultColumn.LastUpdatedTime.name))
    val viewPort = viewPortContainer.create(RequestId.oneNew(), user, session, outQueue, orderToInstrument, DefaultRange, vpcolumns)

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

    val updates = filterByVpId(combineQs(viewPort), viewPort)
      .filter(vpu => vpu.vpUpdate == RowUpdateType)
      .map(vpu => vpu.table.pullRow(vpu.key.key))
      .filter(_.isInstanceOf[RowWithData])
      .map(_.asInstanceOf[RowWithData].data)
      .toArray

    updates.length shouldEqual 2
    updates(0)("orderId") shouldEqual "NYC-0001"
    updates(0)(DefaultColumn.CreatedTime.name) shouldEqual EpochTimestamp(1000L)
    updates(0)(DefaultColumn.LastUpdatedTime.name) shouldEqual EpochTimestamp(1000L)
    updates(1)("orderId") shouldEqual "NYC-0002"
    updates(1)(DefaultColumn.CreatedTime.name) shouldEqual EpochTimestamp(1000L)
    updates(1)(DefaultColumn.LastUpdatedTime.name) shouldEqual EpochTimestamp(1000L)

    timeProvider.advanceBy(1000L)
    ordersProvider.delete("NYC-0001")
    ordersProvider.delete("NYC-0002")
    ordersProvider.tick("NYC-0003", Map("orderId" -> "NYC-0003", "trader" -> "chris", "tradeTime" -> dateTime, "quantity" -> 100, "ric" -> "VOD.L", "ccyCross" -> "USDGBP"))

    joinProvider.runOnce()
    viewPortContainer.runOnce()

    val updates2 = filterByVpId(combineQs(viewPort), viewPort)
      .filter(vpu => vpu.vpUpdate == RowUpdateType)
      .map(vpu => vpu.table.pullRow(vpu.key.key))
      .filter(_.isInstanceOf[RowWithData])
      .map(_.asInstanceOf[RowWithData].data)
      .toArray

    updates2.length shouldEqual 1
    updates2(0)("orderId") shouldEqual "NYC-0003"
    updates2(0)(DefaultColumn.CreatedTime.name) shouldEqual EpochTimestamp(2000L)
    updates2(0)(DefaultColumn.LastUpdatedTime.name) shouldEqual EpochTimestamp(2000L)

  }

  Scenario("Test hitting indices in join of joins when the right table is a join table") {

    val dateTime = 1437728400000L

    val ordersDef = TableDef(
      name = "orders",
      keyField = "orderId",
      indices = Indices(Index("orderId"), Index("quantity")),
      columns = Columns.fromNames("orderId:String", "ric:String", "tradeTime:Long", "quantity:Int"),
      joinFields = "orderId", "ric")

    val instrumentDef = TableDef(
      name = "instruments",
      keyField = "ric",
      indices = Indices(Index("ric")),
      columns = Columns.fromNames("ric:String", "currency:String"),
      joinFields = "ric", "currency")

    val currencyDef = TableDef(
      name = "currencies",
      keyField = "currency",
      indices = Indices(Index("currency")),
      columns = Columns.fromNames("currency:String", "country:String"),
      joinFields = "currency")

    val join1Def = JoinTableDef(
      name = "instrumentToCurrency",
      baseTable = instrumentDef,
      joinColumns = Columns.allFrom(instrumentDef) ++ Columns.allFromExceptDefaultAnd(currencyDef, "currency"),
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
      joinColumns = Columns.allFrom(ordersDef) ++ Columns.allFromExceptDefaultAnd(join1Def, "ric"),
      joins =
        JoinTo(
          table = join1Def,
          joinSpec = JoinSpec(left = "ric", right = "ric", LeftOuterJoin)
        ),
      links = VisualLinks(),
      joinFields = Seq("orderId"),
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

    val user = VuuUser("chris")

    val session = ClientSessionId("sess-01", "channel")

    val outQueue = new OutboundRowPublishQueue()

    val vpcolumns = ViewPortColumnCreator.create(orderToInstrument, List("orderId", "ric", "currency", "country"))

    val viewPort = viewPortContainer.create(RequestId.oneNew(), user, session, outQueue, orderToInstrument,
      DefaultRange, vpcolumns)

    ordersProvider.tick("NYC-0001", Map("orderId" -> "NYC-0001", "tradeTime" -> dateTime, "quantity" -> 100, "ric" -> "VOD.L"))
    ordersProvider.tick("NYC-0002", Map("orderId" -> "NYC-0002", "tradeTime" -> dateTime, "quantity" -> 100, "ric" -> "AIR.PA"))

    instrumentsProvider.tick("VOD.L", Map("ric" -> "VOD.L", "currency" -> "GBP"))
    instrumentsProvider.tick("AIR.PA", Map("ric" -> "AIR.PA", "currency" -> "EUR"))

    currenciesProvider.tick("GBP", Map("currency" -> "GBP", "country" -> "UK"))
    currenciesProvider.tick("EUR", Map("currency" -> "EUR", "country" -> "FR"))

    joinProvider.runOnce()
    viewPortContainer.runOnce()

    //Test index on primary key in base table
    val orderIdIndexOption: Option[IndexedField[?]] = orderToInstrument.indexForColumn(orderToInstrument.columnForName("orderId"))
    orderIdIndexOption.isDefined shouldBe true
    val orderIdIndex = orderIdIndexOption.get.asInstanceOf[IndexedField[String]]
    val orderIndexHit = orderIdIndex.find("NYC-0001")
    orderIndexHit.length shouldEqual 1
    orderIndexHit.head shouldEqual "NYC-0001"

    //Test index on field in base table
    val quantityIndexOption: Option[IndexedField[?]] = orderToInstrument.indexForColumn(orderToInstrument.columnForName("quantity"))
    quantityIndexOption.isDefined shouldBe true
    val quantityIndex = quantityIndexOption.get.asInstanceOf[IndexedField[Int]]
    val quantityIndexHit = quantityIndex.find(100)
    quantityIndexHit.length shouldEqual 2
    quantityIndexHit.indexOf("NYC-0001") > -1 shouldBe true
    quantityIndexHit.indexOf("NYC-0002") > -1 shouldBe true

    //Should not be able to hit an index in the right table
    val ricIndexOption: Option[IndexedField[?]] = orderToInstrument.indexForColumn(orderToInstrument.columnForName("ric"))
    ricIndexOption.isDefined shouldBe false

  }

  Scenario("Test hitting indices in join of joins when the left table is a join table") {

    val dateTime = 1437728400000L

    val ordersDef = TableDef(
      name = "orders",
      keyField = "orderId",
      indices = Indices(Index("orderId"), Index("quantity")),
      columns = Columns.fromNames("orderId:String", "ric:String", "tradeTime:Long", "quantity:Int", "counterpartyId:String"),
      joinFields = "orderId", "ric", "counterpartyId")

    val instrumentDef = TableDef(
      name = "instruments",
      keyField = "ric",
      indices = Indices(Index("ric")),
      columns = Columns.fromNames("ric:String", "currency:String"),
      joinFields = "ric", "currency")

    val orderCounterpartyDef = TableDef(
      name = "counterparties",
      keyField = "counterpartyId",
      indices = Indices(Index("counterpartyId"), Index("name")),
      columns = Columns.fromNames("counterpartyId:String", "name:String"),
      joinFields = "counterpartyId")

    val join1Def = JoinTableDef(
      name = "orderToInstrument",
      baseTable = ordersDef,
      joinColumns = Columns.allFrom(ordersDef) ++ Columns.allFromExceptDefaultAnd(instrumentDef, "ric"),
      joins =
        JoinTo(
          table = instrumentDef,
          joinSpec = JoinSpec(left = "ric", right = "ric", LeftOuterJoin)
        ),
      links = VisualLinks(),
      joinFields = Seq("orderId","ric","counterpartyId"),
    )

    val join2Def = JoinTableDef(
      name = "orderToInstrumentAndCounterparty",
      baseTable = join1Def,
      joinColumns = Columns.allFrom(join1Def) ++ Columns.allFromExceptDefaultAnd(orderCounterpartyDef, "counterpartyId"),
      joins =
        JoinTo(
          table = orderCounterpartyDef,
          joinSpec = JoinSpec(left = "counterpartyId", right = "counterpartyId", LeftOuterJoin)
        ),
      links = VisualLinks(),
      joinFields = Seq("orderId","ric","counterpartyId")
    )

    val joinProvider = JoinTableProviderImpl()

    val tableContainer = new TableContainer(joinProvider)

    val orders = tableContainer.createTable(ordersDef)
    val instruments = tableContainer.createTable(instrumentDef)
    val counterparties = tableContainer.createTable(orderCounterpartyDef)

    val orderToInstrument = tableContainer.createJoinTable(join1Def)
    val orderToInstrumentToCpty = tableContainer.createJoinTable(join2Def)

    val ordersProvider = new MockProvider(orders)
    val instrumentsProvider = new MockProvider(instruments)
    val cptyProvider = new MockProvider(counterparties)

    val providerContainer = new ProviderContainer(joinProvider)

    val viewPortContainer = setupViewPort(tableContainer, providerContainer)

    joinProvider.start()

    joinProvider.runOnce()

    val user = VuuUser("chris")

    val session = ClientSessionId("sess-01", "channel")

    val outQueue = new OutboundRowPublishQueue()

    val vpcolumns = ViewPortColumnCreator.create(orderToInstrument, List("orderId", "ric", "currency", "country"))

    val viewPort = viewPortContainer.create(RequestId.oneNew(), user, session, outQueue, orderToInstrument,
      DefaultRange, vpcolumns)

    ordersProvider.tick("NYC-0001", Map("orderId" -> "NYC-0001", "tradeTime" -> dateTime, "quantity" -> 100, "ric" -> "VOD.L", "counterpartyId" -> "666"))
    ordersProvider.tick("NYC-0002", Map("orderId" -> "NYC-0002", "tradeTime" -> dateTime, "quantity" -> 100, "ric" -> "AIR.PA", "counterpartyId" -> "777"))

    joinProvider.runOnce()
    viewPortContainer.runOnce()

    instrumentsProvider.tick("VOD.L", Map("ric" -> "VOD.L", "currency" -> "GBP"))
    instrumentsProvider.tick("AIR.PA", Map("ric" -> "AIR.PA", "currency" -> "EUR"))

    joinProvider.runOnce()
    viewPortContainer.runOnce()

    cptyProvider.tick("666", Map("counterpartyId" -> "666", "name" -> "Bob"))
    cptyProvider.tick("777", Map("counterpartyId" -> "777", "name" -> "Alice"))

    joinProvider.runOnce()
    viewPortContainer.runOnce()

    //Test index on primary key in base table
    val orderIdColumn = orderToInstrumentToCpty.columnForName("orderId")
    val orderIdIndexOption: Option[IndexedField[?]] = orderToInstrumentToCpty.indexForColumn(orderIdColumn)
    orderIdIndexOption.isDefined shouldBe true
    val orderIdIndex = orderIdIndexOption.get.asInstanceOf[IndexedField[String]]
    val orderIndexHit = orderIdIndex.find("NYC-0001")
    orderIndexHit.length shouldEqual 1
    orderIndexHit.head shouldEqual "NYC-0001"

    //Test index on field in base table
    val quantityColumn = orderToInstrumentToCpty.columnForName("quantity")
    val quantityIndexOption: Option[IndexedField[?]] = orderToInstrumentToCpty.indexForColumn(quantityColumn)
    quantityIndexOption.isDefined shouldBe true
    val quantityIndex = quantityIndexOption.get.asInstanceOf[IndexedField[Int]]
    val quantityIndexHit = quantityIndex.find(100)
    quantityIndexHit.length shouldEqual 2
    quantityIndexHit.indexOf("NYC-0001") > -1 shouldBe true
    quantityIndexHit.indexOf("NYC-0002") > -1 shouldBe true

    //Should not be able to hit an index in the right table of the base left join table
    val ricColumn = orderToInstrumentToCpty.columnForName("ric")
    val ricIndexOption: Option[IndexedField[?]] = orderToInstrumentToCpty.indexForColumn(ricColumn)
    ricIndexOption.isDefined shouldBe false

    //Should not be able to hit an index in the right table
    val nameColumn = orderToInstrumentToCpty.columnForName("name")
    val nameIndexOption: Option[IndexedField[?]] = orderToInstrumentToCpty.indexForColumn(nameColumn)
    nameIndexOption.isDefined shouldBe false

  }


}
