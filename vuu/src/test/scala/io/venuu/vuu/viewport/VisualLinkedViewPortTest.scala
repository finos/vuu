package io.venuu.vuu.viewport

import io.venuu.vuu.client.messages.RequestId
import io.venuu.vuu.core.table.TableTestHelper.combineQs
import io.venuu.vuu.net.{SortDef, SortSpec}
import io.venuu.vuu.util.table.TableAsserts.assertVpEqWithMeta
import org.scalatest.GivenWhenThen
import org.scalatest.matchers.should.Matchers
import org.scalatest.prop.Tables.Table

class VisualLinkedViewPortTest extends AbstractViewPortTestCase with Matchers with GivenWhenThen {

  Feature("Check our maintenance of selection on the server side") {

    Scenario("create viewport, update selection, see selection come back") {

      Given("we've created a viewport with orders in")
      val (viewPortContainer, orders, ordersProvider, prices, pricesProvider, session, outQueue, highPriorityQueue) = createDefaultOrderPricesViewPortInfra()

      val vpcolumnsOrders = List("orderId", "trader", "tradeTime", "quantity", "ric").map(orders.getTableDef.columnForName(_))
      val vpcolumnsPrices = List("ric", "bid", "ask", "last", "open").map(prices.getTableDef.columnForName(_))

      createPricesRow(pricesProvider, "VOD.L", 100, 101, 100.5, 99.5)
      createPricesRow(pricesProvider, "BT.L", 200, 201, 200.5, 199.5)
      createPricesRow(pricesProvider, "BP.L", 300, 301, 300.5, 299.5)

      createNOrderRows(ordersProvider, 3)(timeProvider)
      createNOrderRows(ordersProvider, 4, ric = "BT.L", idOffset = 3)(timeProvider)
      createNOrderRows(ordersProvider, 5, ric = "BP.L", idOffset = 7)(timeProvider)

      val viewPortOrders = viewPortContainer.create(RequestId.oneNew(), session, outQueue, highPriorityQueue, orders, ViewPortRange(0, 10), vpcolumnsOrders)
      val viewPortPrices = viewPortContainer.create(RequestId.oneNew(), session, outQueue, highPriorityQueue, prices, ViewPortRange(0, 10), vpcolumnsPrices)

      viewPortContainer.runOnce()

      val combinedUpdates = combineQs(viewPortOrders)

      val priceUpdates = combinedUpdates.filter(_.vp.id == viewPortPrices.id)
      val orderUpdates = combinedUpdates.filter(_.vp.id == viewPortOrders.id)

      assertVpEqWithMeta(orderUpdates) {
        Table(
          ("sel"     ,"orderId" ,"trader"  ,"ric"     ,"tradeTime","quantity"),
          (0         ,"NYC-0000","chris"   ,"VOD.L"   ,1311544800L,100       ),
          (0         ,"NYC-0001","chris"   ,"VOD.L"   ,1311544810L,101       ),
          (0         ,"NYC-0002","chris"   ,"VOD.L"   ,1311544820L,102       ),
          (0         ,"NYC-0003","chris"   ,"BT.L"    ,1311544830L,100       ),
          (0         ,"NYC-0004","chris"   ,"BT.L"    ,1311544840L,101       ),
          (0         ,"NYC-0005","chris"   ,"BT.L"    ,1311544850L,102       ),
          (0         ,"NYC-0006","chris"   ,"BT.L"    ,1311544860L,103       ),
          (0         ,"NYC-0007","chris"   ,"BP.L"    ,1311544870L,100       ),
          (0         ,"NYC-0008","chris"   ,"BP.L"    ,1311544880L,101       ),
          (0         ,"NYC-0009","chris"   ,"BP.L"    ,1311544890L,102       )
        )
      }

      assertVpEqWithMeta(priceUpdates) {
        Table(
          ("sel"     ,"ric"     ,"bid"     ,"ask"     ,"last"    ,"open"    ),
          (0         ,"VOD.L"   ,100.0     ,101.0     ,100.5     ,null      ),
          (0         ,"BT.L"    ,200.0     ,201.0     ,200.5     ,null      ),
          (0         ,"BP.L"    ,300.0     ,301.0     ,300.5     ,null      )
        )
      }

      val results = viewPortContainer.getViewPortVisualLinks(session, viewPortOrders.id)
      results.size shouldEqual 1
      results.head._2.table.name shouldEqual "prices"

      Then("we link the viewports, with nothing selected in the parent grid yet")
      viewPortContainer.linkViewPorts(session, highPriorityQueue, childVpId = viewPortOrders.id, parentVpId = viewPortPrices.id, "ric", "ric")

      And("we run the container once through")
      viewPortContainer.runOnce()

      Then("we should have nothing available in the viewport")
      viewPortOrders.getKeys.length shouldEqual 0

      When("we select some rows in the grid")
      viewPortContainer.changeSelection(session, highPriorityQueue, viewPortPrices.id, ViewPortSelectedIndices(Array(1)))

      Then("Check the selected rows is updated in the vp")
      assertVpEqWithMeta(combineQs(viewPortPrices)) {
        Table(
          ("sel"     ,"ric"     ,"bid"     ,"ask"     ,"last"    ,"open"    ),
          (1         ,"BT.L"    ,200.0     ,201.0     ,200.5     ,null      ),
        )
      }

      And("we run the container once through to pick up ")
      viewPortContainer.runOnce()

      assertVpEqWithMeta(combineQs(viewPortOrders)) {
        Table(
          ("sel"     ,"orderId" ,"trader"  ,"ric"     ,"tradeTime","quantity"),
          (0         ,"NYC-0003","chris"   ,"BT.L"    ,1311544830L,100       ),
          (0         ,"NYC-0004","chris"   ,"BT.L"    ,1311544840L,101       ),
          (0         ,"NYC-0005","chris"   ,"BT.L"    ,1311544850L,102       ),
          (0         ,"NYC-0006","chris"   ,"BT.L"    ,1311544860L,103       )
        )
      }

      And("if we expend the selection to include BP.L in the prices table")
      viewPortContainer.changeSelection(session, highPriorityQueue, viewPortPrices.id, ViewPortSelectedIndices(Array(1, 2)))

      viewPortContainer.runOnce()

      Then("Check we still maintain the selection")
      assertVpEqWithMeta(combineQs(viewPortOrders).filter(vpu => vpu.vp.id == viewPortOrders.id)) {
        Table(
          ("sel"     ,"orderId" ,"trader"  ,"ric"     ,"tradeTime","quantity"),
          (0         ,"NYC-0007","chris"   ,"BP.L"    ,1311544870L,100       ),
          (0         ,"NYC-0008","chris"   ,"BP.L"    ,1311544880L,101       ),
          (0         ,"NYC-0009","chris"   ,"BP.L"    ,1311544890L,102       ),
          (0         ,"NYC-0010","chris"   ,"BP.L"    ,1311544900L,103       ),
          (0         ,"NYC-0011","chris"   ,"BP.L"    ,1311544910L,104       )
        )
      }

      Then("check we now have 9 keys in the viewport")
      viewPortOrders.getKeys.length shouldEqual 9

      And("if we set selection to none")
      viewPortContainer.changeSelection(session, highPriorityQueue, viewPortPrices.id, ViewPortSelectedIndices(Array()))
      viewPortContainer.runOnce()

      Then("we should have nothing available in the viewport")
      viewPortOrders.getKeys.length shouldEqual 0

      Then("Change the viewport to sort by quantity")
      viewPortContainer.change(RequestId.oneNew(), session, viewPortOrders.id, ViewPortRange(0, 10), vpcolumnsOrders, SortSpec(List(SortDef("quantity", 'A'))))
      viewPortContainer.changeSelection(session, highPriorityQueue, viewPortPrices.id, ViewPortSelectedIndices(Array(1)))

      viewPortContainer.runOnce()

      Then("Check we still maintain the selection even with a new sort or filter")
      assertVpEqWithMeta(combineQs(viewPortOrders).filter(vpu => vpu.vp.id == viewPortOrders.id)) {
        Table(
          ("sel"     ,"orderId" ,"trader"  ,"ric"     ,"tradeTime","quantity"),
          (0         ,"NYC-0006","chris"   ,"BT.L"    ,1311544860L,103       ),
          (0         ,"NYC-0005","chris"   ,"BT.L"    ,1311544850L,102       ),
          (0         ,"NYC-0004","chris"   ,"BT.L"    ,1311544840L,101       ),
          (0         ,"NYC-0003","chris"   ,"BT.L"    ,1311544830L,100       )
        )
      }
    }
  }
}
