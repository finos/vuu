package org.finos.vuu.viewport

import org.finos.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.{Clock, TestFriendlyClock}
import org.finos.vuu.api.*
import org.finos.vuu.client.messages.RequestId
import org.finos.vuu.core.auths.VuuUser
import org.finos.vuu.core.table.TableTestHelper.combineQs
import org.finos.vuu.core.table.{Columns, TableContainer, ViewPortColumnCreator}
import org.finos.vuu.net.{ClientSessionId, SortDef, SortSpec}
import org.finos.vuu.provider.{JoinTableProviderImpl, MockProvider, ProviderContainer}
import org.finos.vuu.util.OutboundRowPublishQueue
import org.finos.vuu.util.table.TableAsserts.assertVpEqWithMeta
import org.scalatest.GivenWhenThen
import org.scalatest.matchers.should.Matchers
import org.scalatest.prop.Tables.Table

class VisualLinkedViewPortTest extends AbstractViewPortTestCase with Matchers with GivenWhenThen {

  Feature("Check our maintenance of selection on the server side") {

    Scenario("create viewport, update selection, see selection come back") {

      implicit val clock: Clock = new TestFriendlyClock(TestTimeStamp.EPOCH_DEFAULT)
      implicit val metrics: MetricsProvider = new MetricsProviderImpl

      Given("we've created a viewport with orders in")
      val (viewPortContainer, orders, ordersProvider, prices, pricesProvider, user, session, outQueue) = createDefaultOrderPricesViewPortInfra()

      val vpcolumnsOrders = ViewPortColumnCreator.create(orders, List("orderId", "trader", "tradeTime", "quantity", "ric"))
      val vpcolumnsPrices = ViewPortColumnCreator.create(prices, List("ric", "bid", "ask", "last", "open"))

//      val vpcolumnsOrders = List("orderId", "trader", "tradeTime", "quantity", "ric").map(orders.getTableDef.columnForName(_))
      //      val vpcolumnsPrices = List("ric", "bid", "ask", "last", "open").map(prices.getTableDef.columnForName(_))

      createPricesRow(pricesProvider, "VOD.L", 100, 101, 100.5, 99.5)
      createPricesRow(pricesProvider, "BT.L", 200, 201, 200.5, 199.5)
      createPricesRow(pricesProvider, "BP.L", 300, 301, 300.5, 299.5)

      createNOrderRows(ordersProvider, 3)(clock)
      createNOrderRows(ordersProvider, 4, ric = "BT.L", idOffset = 3)(clock)
      createNOrderRows(ordersProvider, 5, ric = "BP.L", idOffset = 7)(clock)

      val viewPortOrders = viewPortContainer.create(RequestId.oneNew(), user, session, outQueue, orders, ViewPortRange(0, 10), vpcolumnsOrders)
      val viewPortPrices = viewPortContainer.create(RequestId.oneNew(), user, session, outQueue, prices, ViewPortRange(0, 10), vpcolumnsPrices)

      viewPortContainer.runOnce()

      val combinedUpdates = combineQs(viewPortOrders)

      val priceUpdates = combinedUpdates.filter(_.vp.id == viewPortPrices.id)
      val orderUpdates = combinedUpdates.filter(_.vp.id == viewPortOrders.id)

      assertVpEqWithMeta(orderUpdates) {
        Table(
          ("sel"     ,"orderId" ,"trader"  ,"ric"     ,"tradeTime","quantity"),
          (0         ,"NYC-0000","chris"   ,"VOD.L"   ,1311544800000L,100       ),
          (0         ,"NYC-0001","chris"   ,"VOD.L"   ,1311544800010L,101       ),
          (0         ,"NYC-0002","chris"   ,"VOD.L"   ,1311544800020L,102       ),
          (0         ,"NYC-0003","chris"   ,"BT.L"    ,1311544800030L,100       ),
          (0         ,"NYC-0004","chris"   ,"BT.L"    ,1311544800040L,101       ),
          (0         ,"NYC-0005","chris"   ,"BT.L"    ,1311544800050L,102       ),
          (0         ,"NYC-0006","chris"   ,"BT.L"    ,1311544800060L,103       ),
          (0         ,"NYC-0007","chris"   ,"BP.L"    ,1311544800070L,100       ),
          (0         ,"NYC-0008","chris"   ,"BP.L"    ,1311544800080L,101       ),
          (0         ,"NYC-0009","chris"   ,"BP.L"    ,1311544800090L,102       )
        )
      }

      assertVpEqWithMeta(priceUpdates) {
        Table(
          ("sel", "ric", "bid", "ask", "last", "open"),
          (0, "BP.L", 300.0, 301.0, 300.5, null),
          (0, "BT.L", 200.0, 201.0, 200.5, null),
          (0, "VOD.L", 100.0, 101.0, 100.5, null)
        )
      }

      val results = viewPortContainer.getViewPortVisualLinks(session, viewPortOrders.id)
      results.size shouldEqual 1
      results.head._2.table.name shouldEqual "prices"

      Then("we link the viewports, with nothing selected in the parent grid yet")
      viewPortContainer.linkViewPorts(session, outQueue, childVpId = viewPortOrders.id, parentVpId = viewPortPrices.id, "ric", "ric")

      And("we run the container once through")
      viewPortContainer.runOnce()

      Then("we should show all by default in the viewport")
      viewPortOrders.getKeys.length shouldEqual 12

      When("we select some rows in the grid")
      viewPortContainer.selectRow(session, viewPortPrices.id, "BT.L", preserveExistingSelection = false)

      Then("Check the selected rows is updated in the vp")
      assertVpEqWithMeta(combineQs(viewPortPrices)) {
        Table(
          ("sel", "ric", "bid", "ask", "last", "open"),
          (0, "BP.L", 300.0, 301.0, 300.5, null),
          (1, "BT.L", 200.0, 201.0, 200.5, null),
          (0, "VOD.L", 100.0, 101.0, 100.5, null),
        )
      }

      And("we run the container once through to pick up ")
      viewPortContainer.runOnce()

      Then("check we now have 4 keys in the viewport")
      viewPortOrders.getKeys.length shouldEqual 4
      assertVpEqWithMeta(combineQs(viewPortOrders)) {
        Table(
          ("sel"     ,"orderId" ,"trader"  ,"ric"     ,"tradeTime","quantity"),
          (0         ,"NYC-0003","chris"   ,"BT.L"    ,1311544800030L,100       ),
          (0         ,"NYC-0004","chris"   ,"BT.L"    ,1311544800040L,101       ),
          (0         ,"NYC-0005","chris"   ,"BT.L"    ,1311544800050L,102       ),
          (0         ,"NYC-0006","chris"   ,"BT.L"    ,1311544800060L,103       )
        )
      }

      And("if we expend the selection to include BP.L in the prices table")
      viewPortContainer.selectRowRange(session, viewPortPrices.id, "BT.L", "BP.L", preserveExistingSelection = false)

      viewPortContainer.runOnce()

      Then("check we now have 9 keys in the viewport")
      viewPortOrders.getKeys.length shouldEqual 9
      Then("Check we still maintain the selection")
      assertVpEqWithMeta(combineQs(viewPortOrders).filter(vpu => vpu.vp.id == viewPortOrders.id)) {
        Table(
          ("sel"     ,"orderId" ,"trader"  ,"ric"     ,"tradeTime","quantity"),
          (0         ,"NYC-0007","chris"   ,"BP.L"    ,1311544800070L,100       ),
          (0         ,"NYC-0008","chris"   ,"BP.L"    ,1311544800080L,101       ),
          (0         ,"NYC-0009","chris"   ,"BP.L"    ,1311544800090L,102       ),
          (0         ,"NYC-0010","chris"   ,"BP.L"    ,1311544800100L,103       ),
          (0         ,"NYC-0011","chris"   ,"BP.L"    ,1311544800110L,104       )
        )
      }

      And("if we set selection to none")
      viewPortContainer.deselectAll(session, viewPortPrices.id)
      viewPortContainer.runOnce()

      Then("we should show all by default in the viewport")
      viewPortOrders.getKeys.length shouldEqual 12

      assertVpEqWithMeta(combineQs(viewPortOrders).filter(vpu => vpu.vp.id == viewPortOrders.id)) {
        Table(
          ("sel", "orderId", "trader", "ric", "tradeTime", "quantity"),
          (0, "NYC-0000", "chris", "VOD.L", 1311544800000L, 100),
          (0, "NYC-0001", "chris", "VOD.L", 1311544800010L, 101),
          (0, "NYC-0002", "chris", "VOD.L", 1311544800020L, 102),
          (0, "NYC-0003", "chris", "BT.L", 1311544800030L, 100),
          (0, "NYC-0004", "chris", "BT.L", 1311544800040L, 101),
          (0, "NYC-0005", "chris", "BT.L", 1311544800050L, 102),
          (0, "NYC-0006", "chris", "BT.L", 1311544800060L, 103),
          (0, "NYC-0007", "chris", "BP.L", 1311544800070L, 100),
          (0, "NYC-0008", "chris", "BP.L", 1311544800080L, 101),
          (0, "NYC-0009", "chris", "BP.L", 1311544800090L, 102)
        )
      }

      Then("Change the viewport to sort by quantity")
      viewPortContainer.change(RequestId.oneNew(), session, viewPortOrders.id, ViewPortRange(0, 10), vpcolumnsOrders, SortSpec(List(SortDef("quantity", 'D'))))
      viewPortContainer.selectRow(session, viewPortPrices.id, "BT.L", preserveExistingSelection = false)

      viewPortContainer.runOnce()

      Then("check we now have 4 keys in the viewport")
      viewPortOrders.getKeys.length shouldEqual 4

      Then("Check we can remove the visual linking")

      viewPortContainer.unlinkViewPorts(session, outQueue, viewPortOrders.id)

      viewPortContainer.runOnce()

      val combinedUpdates2 = combineQs(viewPortOrders)

      val priceUpdates2 = combinedUpdates2.filter(_.vp.id == viewPortPrices.id)
      val orderUpdates2 = combinedUpdates2.filter(_.vp.id == viewPortOrders.id)

      assertVpEqWithMeta(orderUpdates2) {
        Table(
          ("sel"     ,"orderId" ,"trader"  ,"ric"     ,"tradeTime","quantity"),
          (0         ,"NYC-0000","chris"   ,"VOD.L"   ,1311544800000L,100       ),
          (0         ,"NYC-0001","chris"   ,"VOD.L"   ,1311544800010L,101       ),
          (0         ,"NYC-0002","chris"   ,"VOD.L"   ,1311544800020L,102       ),
          (0         ,"NYC-0004","chris"   ,"BT.L"    ,1311544800040L,101       ),
          (0         ,"NYC-0005","chris"   ,"BT.L"    ,1311544800050L,102       ),
          (0         ,"NYC-0006","chris"   ,"BT.L"    ,1311544800060L,103       ),
          (0         ,"NYC-0008","chris"   ,"BP.L"    ,1311544800080L,101       ),
          (0         ,"NYC-0009","chris"   ,"BP.L"    ,1311544800090L,102       ),
          (0         ,"NYC-0010","chris"   ,"BP.L"    ,1311544800100L,103       ),
          (0         ,"NYC-0011","chris"   ,"BP.L"    ,1311544800110L,104       )
        )
      }
    }

    Scenario("able to create visual link on same type of table") {

      implicit val clock: Clock = new TestFriendlyClock(TestTimeStamp.EPOCH_DEFAULT)
      implicit val metrics: MetricsProvider = new MetricsProviderImpl

      Given("we've created a viewport with orders in")
      implicit val lifecycle: LifecycleContainer = new LifecycleContainer
      val ordersDef = TableDef(
        name = "orders",
        keyField = "orderId",
        columns = Columns.fromNames("orderId:String", "trader:String", "ric:String", "tradeTime:Long", "quantity:Int"),
        links = VisualLinks(
          Link("orderId", "orders", "orderId")
        ),
        indices = Indices(
          Index("ric")
        )
      )


      val joinProvider = JoinTableProviderImpl()

      val tableContainer = new TableContainer(joinProvider)

      val orders1 = tableContainer.createTable(ordersDef)
      val orders2 = tableContainer.createTable(ordersDef)

      val ordersProvider1 = new MockProvider(orders1)
      val ordersProvider2 = new MockProvider(orders2)

      val providerContainer = new ProviderContainer(joinProvider)

      val viewPortContainer = setupViewPort(tableContainer, providerContainer)

      joinProvider.start()

      joinProvider.runOnce()

      val user = VuuUser("chris")
      
      val session = ClientSessionId("sess-01", "channel")

      val outQueue = new OutboundRowPublishQueue()
      val vpcolumnsOrders1 = ViewPortColumnCreator.create(orders1, List("orderId", "trader", "tradeTime", "quantity", "ric"))
      val vpcolumnsOrders2 = ViewPortColumnCreator.create(orders2, List("orderId", "trader", "tradeTime", "quantity", "ric"))


      createNOrderRows(ordersProvider1, 3)(clock)
      createNOrderRows(ordersProvider1, 4, ric = "BT.L", idOffset = 3)(clock)
      createNOrderRows(ordersProvider1, 5, ric = "BP.L", idOffset = 7)(clock)

      createNOrderRows(ordersProvider2, 3)(clock)
      createNOrderRows(ordersProvider2, 4, ric = "BT.L", idOffset = 3)(clock)
      createNOrderRows(ordersProvider2, 5, ric = "BP.L", idOffset = 7)(clock)

      val viewPortOrders1 = viewPortContainer.create(RequestId.oneNew(), user, session, outQueue, orders1, ViewPortRange(0, 10), vpcolumnsOrders1)
      val viewPortOrders2 = viewPortContainer.create(RequestId.oneNew(), user, session, outQueue, orders2, ViewPortRange(0, 10), vpcolumnsOrders2)

      viewPortContainer.runOnce()

      val combinedUpdates = combineQs(viewPortOrders1)

      val orderUpdates1 = combinedUpdates.filter(_.vp.id == viewPortOrders1.id)
      val orderUpdates2 = combinedUpdates.filter(_.vp.id == viewPortOrders2.id)

      assertVpEqWithMeta(orderUpdates1) {
        Table(
          ("sel", "orderId", "trader", "ric", "tradeTime", "quantity"),
          (0, "NYC-0000", "chris", "VOD.L", 1311544800000L, 100),
          (0, "NYC-0001", "chris", "VOD.L", 1311544800010L, 101),
          (0, "NYC-0002", "chris", "VOD.L", 1311544800020L, 102),
          (0, "NYC-0003", "chris", "BT.L", 1311544800030L, 100),
          (0, "NYC-0004", "chris", "BT.L", 1311544800040L, 101),
          (0, "NYC-0005", "chris", "BT.L", 1311544800050L, 102),
          (0, "NYC-0006", "chris", "BT.L", 1311544800060L, 103),
          (0, "NYC-0007", "chris", "BP.L", 1311544800070L, 100),
          (0, "NYC-0008", "chris", "BP.L", 1311544800080L, 101),
          (0, "NYC-0009", "chris", "BP.L", 1311544800090L, 102)
        )
      }

      // TODO: emily to remove tradeTime (create test dummy object to ignore fields we dont care in the test)
      assertVpEqWithMeta(orderUpdates2) {
        Table(
          ("sel", "orderId", "trader", "ric", "tradeTime", "quantity"),
          (0, "NYC-0000", "chris", "VOD.L", 1311544800120L, 100),
          (0, "NYC-0001", "chris", "VOD.L", 1311544800130L, 101),
          (0, "NYC-0002", "chris", "VOD.L", 1311544800140L, 102),
          (0, "NYC-0003", "chris", "BT.L", 1311544800150L, 100),
          (0, "NYC-0004", "chris", "BT.L", 1311544800160L, 101),
          (0, "NYC-0005", "chris", "BT.L", 1311544800170L, 102),
          (0, "NYC-0006", "chris", "BT.L", 1311544800180L, 103),
          (0, "NYC-0007", "chris", "BP.L", 1311544800190L, 100),
          (0, "NYC-0008", "chris", "BP.L", 1311544800200L, 101),
          (0, "NYC-0009", "chris", "BP.L", 1311544800210L, 102)
        )
      }

      val results = viewPortContainer.getViewPortVisualLinks(session, viewPortOrders1.id)
      results.size shouldEqual 2
      results.head._2.table.name shouldEqual "orders"
      results.last._2.table.name shouldEqual "orders"

      Then("we link the viewports, with nothing selected in the parent grid yet")
      viewPortContainer.linkViewPorts(session, outQueue, childVpId = viewPortOrders1.id, parentVpId = viewPortOrders2.id, "orderId", "orderId")

      And("we run the container once through")
      viewPortContainer.runOnce()

      Then("we should show all by default in the viewport")
      viewPortOrders1.getKeys.length shouldEqual 12

      When("we select second row in the grid")
      viewPortContainer.selectRow(session, viewPortOrders2.id, "NYC-0001", preserveExistingSelection = false)

      Then("Check the selected rows is updated in the vp")
      assertVpEqWithMeta(combineQs(viewPortOrders2)) {
        Table(
          ("sel", "orderId", "trader", "ric", "tradeTime", "quantity"),
          (0, "NYC-0000", "chris", "VOD.L", 1311544800120L, 100),
          (1, "NYC-0001", "chris", "VOD.L", 1311544800130L, 101),
          (0, "NYC-0002", "chris", "VOD.L", 1311544800140L, 102),
          (0, "NYC-0003", "chris", "BT.L", 1311544800150L, 100),
          (0, "NYC-0004", "chris", "BT.L", 1311544800160L, 101),
          (0, "NYC-0005", "chris", "BT.L", 1311544800170L, 102),
          (0, "NYC-0006", "chris", "BT.L", 1311544800180L, 103),
          (0, "NYC-0007", "chris", "BP.L", 1311544800190L, 100),
          (0, "NYC-0008", "chris", "BP.L", 1311544800200L, 101),
          (0, "NYC-0009", "chris", "BP.L", 1311544800210L, 102)
        )
      }

      And("we run the container once through to pick up ")
      viewPortContainer.runOnce()

      assertVpEqWithMeta(combineQs(viewPortOrders1)) {
        Table(
          ("sel", "orderId", "trader", "ric", "tradeTime", "quantity"),
        )
      }
    }

    Scenario("should show all when no parent is selected") {

      implicit val clock: Clock = new TestFriendlyClock(TestTimeStamp.EPOCH_DEFAULT)
      implicit val metrics: MetricsProvider = new MetricsProviderImpl

      Given("we've created a viewport with orders in")
      val (viewPortContainer, orders, ordersProvider, prices, pricesProvider, user, session, outQueue) = createDefaultOrderPricesViewPortInfra()

      val vpcolumnsOrders = ViewPortColumnCreator.create(orders, List("orderId", "trader", "tradeTime", "quantity", "ric"))
      val vpcolumnsPrices = ViewPortColumnCreator.create(prices, List("ric", "bid", "ask", "last", "open"))

      createPricesRow(pricesProvider, "VOD.L", 100, 101, 100.5, 99.5)
      createPricesRow(pricesProvider, "BT.L", 200, 201, 200.5, 199.5)
      createPricesRow(pricesProvider, "BP.L", 300, 301, 300.5, 299.5)

      createNOrderRows(ordersProvider, 3)(clock)
      createNOrderRows(ordersProvider, 4, ric = "BT.L", idOffset = 3)(clock)
      createNOrderRows(ordersProvider, 5, ric = "BP.L", idOffset = 7)(clock)

      val viewPortOrders = viewPortContainer.create(RequestId.oneNew(), user, session, outQueue, orders, ViewPortRange(0, 10), vpcolumnsOrders)
      val viewPortPrices = viewPortContainer.create(RequestId.oneNew(), user, session, outQueue, prices, ViewPortRange(0, 10), vpcolumnsPrices)

      viewPortContainer.runOnce()

      val combinedUpdates = combineQs(viewPortOrders)

      val priceUpdates = combinedUpdates.filter(_.vp.id == viewPortPrices.id)
      val orderUpdates = combinedUpdates.filter(_.vp.id == viewPortOrders.id)

      assertVpEqWithMeta(orderUpdates) {
        Table(
          ("sel", "orderId", "trader", "ric", "tradeTime", "quantity"),
          (0, "NYC-0000", "chris", "VOD.L", 1311544800000L, 100),
          (0, "NYC-0001", "chris", "VOD.L", 1311544800010L, 101),
          (0, "NYC-0002", "chris", "VOD.L", 1311544800020L, 102),
          (0, "NYC-0003", "chris", "BT.L", 1311544800030L, 100),
          (0, "NYC-0004", "chris", "BT.L", 1311544800040L, 101),
          (0, "NYC-0005", "chris", "BT.L", 1311544800050L, 102),
          (0, "NYC-0006", "chris", "BT.L", 1311544800060L, 103),
          (0, "NYC-0007", "chris", "BP.L", 1311544800070L, 100),
          (0, "NYC-0008", "chris", "BP.L", 1311544800080L, 101),
          (0, "NYC-0009", "chris", "BP.L", 1311544800090L, 102)
        )
      }

      assertVpEqWithMeta(priceUpdates) {
        Table(
          ("sel", "ric", "bid", "ask", "last", "open"),
          (0, "BP.L", 300.0, 301.0, 300.5, null),
          (0, "BT.L", 200.0, 201.0, 200.5, null),
          (0, "VOD.L", 100.0, 101.0, 100.5, null)
        )
      }

      val results = viewPortContainer.getViewPortVisualLinks(session, viewPortOrders.id)
      results.size shouldEqual 1
      results.head._2.table.name shouldEqual "prices"

      Then("we link the viewports, with nothing selected in the parent grid yet")
      viewPortContainer.linkViewPorts(session, outQueue, childVpId = viewPortOrders.id, parentVpId = viewPortPrices.id, "ric", "ric")

      And("we run the container once through")
      viewPortContainer.runOnce()

      Then("we should show all by default in the viewport")
      viewPortOrders.getKeys.length shouldEqual 12
    }

  }
}
