package org.finos.vuu.core.module.basket

import org.finos.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.{Clock, TestFriendlyClock}
import org.finos.vuu.api.ViewPortDef
import org.finos.vuu.client.messages.RequestId
import org.finos.vuu.core.module.TableDefContainer
import org.finos.vuu.core.module.basket.BasketModule.{BasketColumnNames => B, BasketConstituentColumnNames => BC}
import org.finos.vuu.core.module.basket.service.{BasketServiceIF, BasketTradingServiceIF}
import org.finos.vuu.core.module.price.PriceModule
import org.finos.vuu.core.table.TableTestHelper.combineQs
import org.finos.vuu.core.table.{TableContainer, ViewPortColumnCreator}
import org.finos.vuu.feature.inmem.VuuInMemPlugin
import org.finos.vuu.net.{SortDef, SortSpec}
import org.finos.vuu.order.oms.OmsApi
import org.finos.vuu.plugin.DefaultPluginRegistry
import org.finos.vuu.provider.{JoinTableProviderImpl, ProviderContainer}
import org.finos.vuu.test.VuuServerTestCase
import org.finos.vuu.util.table.TableAsserts.{assertVpEq, assertVpEqWithMeta}
import org.finos.vuu.viewport.{TestTimeStamp, ViewPortContainer, ViewPortCreateSuccess, ViewPortRange, ViewPortSelectedIndices}
import org.scalatest.prop.Tables.Table

class VisualLinkTest extends VuuServerTestCase {
  implicit val clock: Clock = new TestFriendlyClock(10001L)
  implicit val lifecycle: LifecycleContainer = new LifecycleContainer()
  implicit val tableDefContainer: TableDefContainer = new TableDefContainer(Map())
  implicit val metricsProvider: MetricsProvider = new MetricsProviderImpl

  val omsApi = OmsApi()

  import BasketModule.{BasketTradingColumnNames => BT, _}
  Feature("Visual Link Test Case") {

    Scenario("create viewport, update selection, see selection come back") {

      withVuuServer(PriceModule(), BasketModule(omsApi)) {
        vuuServer =>
          val joinProvider = JoinTableProviderImpl()

          val tableContainer = new TableContainer(joinProvider)

          val orders = tableContainer.createTable(ordersDef)
          val prices = tableContainer.createTable(pricesDef)
          val orderPrices = tableContainer.createJoinTable(joinDef)

          val ordersProvider = new MockProvider(orders)
          val pricesProvider = new MockProvider(prices)

          val providerContainer = new ProviderContainer(joinProvider)

          val viewPortContainer = setupViewPort(tableContainer, providerContainer)
      }

      Given("we've created a viewport with orders in")
      val (viewPortContainer, orders, ordersProvider, prices, pricesProvider, session, outQueue) = createDefaultOrderPricesViewPortInfra()

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

      val viewPortOrders = viewPortContainer.create(RequestId.oneNew(), session, outQueue, orders, ViewPortRange(0, 10), vpcolumnsOrders)
      val viewPortPrices = viewPortContainer.create(RequestId.oneNew(), session, outQueue, prices, ViewPortRange(0, 10), vpcolumnsPrices)

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

      Then("we should have nothing available in the viewport")
      viewPortOrders.getKeys.length shouldEqual 0

      When("we select some rows in the grid")
      viewPortContainer.changeSelection(session, outQueue, viewPortPrices.id, ViewPortSelectedIndices(Array(1)))

      Then("Check the selected rows is updated in the vp")
      assertVpEqWithMeta(combineQs(viewPortPrices)) {
        Table(
          ("sel", "ric", "bid", "ask", "last", "open"),
          (1, "BT.L", 200.0, 201.0, 200.5, null),
        )
      }

      And("we run the container once through to pick up ")
      viewPortContainer.runOnce()

      assertVpEqWithMeta(combineQs(viewPortOrders)) {
        Table(
          ("sel", "orderId", "trader", "ric", "tradeTime", "quantity"),
          (0, "NYC-0003", "chris", "BT.L", 1311544800030L, 100),
          (0, "NYC-0004", "chris", "BT.L", 1311544800040L, 101),
          (0, "NYC-0005", "chris", "BT.L", 1311544800050L, 102),
          (0, "NYC-0006", "chris", "BT.L", 1311544800060L, 103)
        )
      }

      And("if we expend the selection to include BP.L in the prices table")
      viewPortContainer.changeSelection(session, outQueue, viewPortPrices.id, ViewPortSelectedIndices(Array(1, 2)))

      viewPortContainer.runOnce()

      Then("Check we still maintain the selection")
      assertVpEqWithMeta(combineQs(viewPortOrders).filter(vpu => vpu.vp.id == viewPortOrders.id)) {
        Table(
          ("sel", "orderId", "trader", "ric", "tradeTime", "quantity"),
          (0, "NYC-0007", "chris", "BP.L", 1311544800070L, 100),
          (0, "NYC-0008", "chris", "BP.L", 1311544800080L, 101),
          (0, "NYC-0009", "chris", "BP.L", 1311544800090L, 102),
          (0, "NYC-0010", "chris", "BP.L", 1311544800100L, 103),
          (0, "NYC-0011", "chris", "BP.L", 1311544800110L, 104)
        )
      }

      Then("check we now have 9 keys in the viewport")
      viewPortOrders.getKeys.length shouldEqual 9

      And("if we set selection to none")
      viewPortContainer.changeSelection(session, outQueue, viewPortPrices.id, ViewPortSelectedIndices(Array()))
      viewPortContainer.runOnce()

      Then("we should have nothing available in the viewport")
      viewPortOrders.getKeys.length shouldEqual 0

      Then("Change the viewport to sort by quantity")
      viewPortContainer.change(RequestId.oneNew(), session, viewPortOrders.id, ViewPortRange(0, 10), vpcolumnsOrders, SortSpec(List(SortDef("quantity", 'D'))))
      viewPortContainer.changeSelection(session, outQueue, viewPortPrices.id, ViewPortSelectedIndices(Array(1)))

      viewPortContainer.runOnce()

      Then("Check we still maintain the selection even with a new sort or filter")
      assertVpEqWithMeta(combineQs(viewPortOrders).filter(vpu => vpu.vp.id == viewPortOrders.id)) {
        Table(
          ("sel", "orderId", "trader", "ric", "tradeTime", "quantity"),
          (0, "NYC-0003", "chris", "BT.L", 1311544800030L, 100),
          (0, "NYC-0004", "chris", "BT.L", 1311544800040L, 101),
          (0, "NYC-0005", "chris", "BT.L", 1311544800050L, 102),
          (0, "NYC-0006", "chris", "BT.L", 1311544800060L, 103)
        )
      }

      Then("Check we can remove the visual linking")

      viewPortContainer.unlinkViewPorts(session, outQueue, viewPortOrders.id)

      viewPortContainer.runOnce()

      val combinedUpdates2 = combineQs(viewPortOrders)

      val priceUpdates2 = combinedUpdates2.filter(_.vp.id == viewPortPrices.id)
      val orderUpdates2 = combinedUpdates2.filter(_.vp.id == viewPortOrders.id)

      assertVpEqWithMeta(orderUpdates2) {
        Table(
          ("sel", "orderId", "trader", "ric", "tradeTime", "quantity"),
          (0, "NYC-0000", "chris", "VOD.L", 1311544800000L, 100),
          (0, "NYC-0001", "chris", "VOD.L", 1311544800010L, 101),
          (0, "NYC-0002", "chris", "VOD.L", 1311544800020L, 102),
          (0, "NYC-0004", "chris", "BT.L", 1311544800040L, 101),
          (0, "NYC-0005", "chris", "BT.L", 1311544800050L, 102),
          (0, "NYC-0006", "chris", "BT.L", 1311544800060L, 103),
          (0, "NYC-0008", "chris", "BP.L", 1311544800080L, 101),
          (0, "NYC-0009", "chris", "BP.L", 1311544800090L, 102),
          (0, "NYC-0010", "chris", "BP.L", 1311544800100L, 103),
          (0, "NYC-0011", "chris", "BP.L", 1311544800110L, 104)
        )
      }
    }
  }

  def setupViewPort(tableContainer: TableContainer, providerContainer: ProviderContainer)(implicit clock: Clock, metrics: MetricsProvider): ViewPortContainer = {

    val pluginRegistry = new DefaultPluginRegistry
    pluginRegistry.registerPlugin(new VuuInMemPlugin)

    val viewPortContainer = new ViewPortContainer(tableContainer, providerContainer, pluginRegistry)

    viewPortContainer
  }

}
