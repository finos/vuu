package org.finos.vuu.viewport

import org.finos.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import org.finos.toolbox.time.{Clock, TestFriendlyClock}
import org.finos.vuu.client.messages.RequestId
import org.finos.vuu.core.table.TableTestHelper.combineQs
import org.finos.vuu.core.table.ViewPortColumnCreator
import org.finos.vuu.util.table.TableAsserts.assertVpEqWithMeta
import org.scalatest.GivenWhenThen
import org.scalatest.matchers.should.Matchers
import org.scalatest.prop.Tables.Table

class VisualLinkedTreeViewPortTest extends AbstractViewPortTestCase with Matchers with GivenWhenThen {

  implicit val clock: Clock = new TestFriendlyClock(TestTimeStamp.EPOCH_DEFAULT)
  implicit val metrics: MetricsProvider = new MetricsProviderImpl

  Feature("Check our maintenance of selection on the server side") {

    Scenario("create viewport, update selection, see selection come back") {

      Given("we've created a viewport with orders in")
      val (viewPortContainer, orders, ordersProvider, prices, pricesProvider, session, outQueue) = createDefaultOrderPricesViewPortInfra()

      val vpcolumnsOrders = ViewPortColumnCreator.create(orders, List("orderId", "trader", "tradeTime", "quantity", "ric"))
      val vpcolumnsPrices = ViewPortColumnCreator.create(prices, List("ric", "bid", "ask", "last", "open", "exchange"))

      createPricesRow(pricesProvider, "VOD.L", 100, 101, 100.5, 99.5, "XLON")
      createPricesRow(pricesProvider, "BT.L", 200, 201, 200.5, 199.5, "NYSE")
      createPricesRow(pricesProvider, "BP.L", 300, 301, 300.5, 299.5, "XAMS")

      createNOrderRows(ordersProvider, 3)(clock)
      createNOrderRows(ordersProvider, 4, ric = "BT.L", idOffset = 3)(clock)
      createNOrderRows(ordersProvider, 5, ric = "BP.L", idOffset = 7)(clock)

      val viewPortOrders = viewPortContainer.create(RequestId.oneNew(), session, outQueue, orders, ViewPortRange(0, 10), vpcolumnsOrders)
      val viewPortPricesGroupBy = viewPortContainer.create(RequestId.oneNew(), session, outQueue, prices, ViewPortRange(0, 10), vpcolumnsPrices, groupBy = GroupBy(List(vpcolumnsPrices.getColumnForName("exchange").get), List()))

      viewPortContainer.runOnce()
      viewPortContainer.runGroupByOnce()

      val combinedUpdates = combineQs(viewPortOrders)

      val priceUpdates = combinedUpdates.filter(_.vp.id == viewPortPricesGroupBy.id)
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
          ("sel", "_isOpen", "_depth", "_treeKey", "_isLeaf", "_childCount", "_caption", "ric", "bid", "ask", "last", "open", "exchange"),
          (0, false, 1, "$root|NYSE", false, 0, "NYSE", "", "", "", "", "", "NYSE"),
          (0, false, 1, "$root|XAMS", false, 0, "XAMS", "", "", "", "", "", "XAMS"),
          (0, false, 1, "$root|XLON", false, 0, "XLON", "", "", "", "", "", "XLON")
        )
      }

      val results = viewPortContainer.getViewPortVisualLinks(session, viewPortOrders.id)
      results.size shouldEqual 1
      results.head._2.table.linkableName shouldEqual "prices"

      viewPortContainer.openNode(viewPortPricesGroupBy.id, "$root|XLON")
      viewPortContainer.openNode(viewPortPricesGroupBy.id, "$root|NYSE")
      viewPortContainer.openNode(viewPortPricesGroupBy.id, "$root|XAMS")

      Then("we link the viewports, with nothing selected in the parent grid yet")
      viewPortContainer.linkViewPorts(session, outQueue, childVpId = viewPortOrders.id, parentVpId = viewPortPricesGroupBy.id, "ric", "ric")

      And("we run the container once through")
      viewPortContainer.runOnce()

      Then("we should show all by default in the viewport")
      viewPortOrders.getKeys.length shouldEqual 12

      When("we select some rows in the grid")
      viewPortContainer.selectRow(viewPortPricesGroupBy.id, "NYC-0004", preserveExistingSelection = false)
      viewPortContainer.runGroupByOnce()
      viewPortContainer.runOnce()

      val combinedUpdates2 = combineQs(viewPortPricesGroupBy)

      Then("Check the selected rows is updated in the vp")
      assertVpEqWithMeta(filterByVpId(combinedUpdates2, viewPortPricesGroupBy)) {
        Table(
          ("sel", "_isOpen", "_depth", "_treeKey", "_isLeaf", "_childCount", "_caption", "ric", "bid", "ask", "last", "open", "exchange"),
          (0, true, 1, "$root|NYSE", false, 1, "NYSE", "", "", "", "", "", "NYSE"),
          (0, false, 2, "$root|NYSE|BT.L", true, 0, "BT.L", "BT.L", 200.0, 201.0, 200.5, null, "NYSE"),
          (0, true, 1, "$root|XAMS", false, 1, "XAMS", "", "", "", "", "", "XAMS"),
          (0, false, 2, "$root|XAMS|BP.L", true, 0, "BP.L", "BP.L", 300.0, 301.0, 300.5, null, "XAMS"),
          (0, true, 1, "$root|XLON", false, 1, "XLON", "", "", "", "", "", "XLON"),
          (0, false, 2, "$root|XLON|VOD.L", true, 0, "VOD.L", "VOD.L", 100.0, 101.0, 100.5, null, "XLON")
        )
      }

      And("if we expend the selection to include BP.L in the prices table")
      viewPortContainer.selectRowRange(viewPortPricesGroupBy.id, "NYC-0002", "NYC-0004", preserveExistingSelection = false)

      viewPortContainer.runOnce()
      viewPortContainer.runGroupByOnce()

      val updates = combineQs(viewPortPricesGroupBy)

      Then("Check we have an update in the tree")
      assertVpEqWithMeta(filterByVpId(updates, viewPortPricesGroupBy)) {
        Table(
          ("sel", "_isOpen", "_depth", "_treeKey", "_isLeaf", "_childCount", "_caption", "ric", "bid", "ask", "last", "open", "exchange"),
          (1, false, 2, "$root|NYSE|BT.L", true, 0, "BT.L", "BT.L", 200.0, 201.0, 200.5, null, "NYSE"),
          (1, false, 2, "$root|XAMS|BP.L", true, 0, "BP.L", "BP.L", 300.0, 301.0, 300.5, null, "XAMS")
        )
      }

      Then("Check we still maintain the selection")
      assertVpEqWithMeta(filterByVpId(updates, viewPortOrders)) {
        Table(
          ("sel"     ,"orderId" ,"trader"  ,"ric"     ,"tradeTime","quantity"),
          (0         ,"NYC-0003","chris"   ,"BT.L"    ,1311544800030L,100       ),
          (0         ,"NYC-0004","chris"   ,"BT.L"    ,1311544800040L,101       ),
          (0         ,"NYC-0005","chris"   ,"BT.L"    ,1311544800050L,102       ),
          (0         ,"NYC-0006","chris"   ,"BT.L"    ,1311544800060L,103       ),
          (0         ,"NYC-0007","chris"   ,"BP.L"    ,1311544800070L,100       ),
          (0         ,"NYC-0008","chris"   ,"BP.L"    ,1311544800080L,101       ),
          (0         ,"NYC-0009","chris"   ,"BP.L"    ,1311544800090L,102       ),
          (0         ,"NYC-0010","chris"   ,"BP.L"    ,1311544800100L,103       ),
          (0         ,"NYC-0011","chris"   ,"BP.L"    ,1311544800110L,104       )
        )
      }

      Then("check we now have 9 keys in the viewport")
      viewPortOrders.getKeys.length shouldEqual 9

      And("if we set selection to none")
      viewPortContainer.deselectAll(viewPortPricesGroupBy.id)
      viewPortContainer.runOnce()

      Then("we should show all by default in the viewport")
      viewPortOrders.getKeys.length shouldEqual 12
    }
  }
}
