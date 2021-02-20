package io.venuu.vuu.viewport

import io.venuu.vuu.core.table.TableTestHelper.combineQs
import io.venuu.vuu.net.{SortDef, SortSpec}
import io.venuu.vuu.util.table.TableAsserts.assertVpEqWithMeta
import org.scalatest.prop.Tables.Table
import org.scalatest.{GivenWhenThen, Matchers}

class UpdateSelectionViewPortTest extends AbstractViewPortTestCase with Matchers with GivenWhenThen{

  feature("Check our maintenance of selection on the server side") {

    scenario("create viewport, update selection, see selection come back") {

      Given("we've created a viewport with orders in")
      val (viewPortContainer, orders, ordersProvider, session, outQueue, highPriorityQueue) = createDefaultViewPortInfra()

      val vpcolumns = List("orderId", "trader", "tradeTime", "quantity", "ric").map(orders.getTableDef.columnForName(_)).toList

      createNOrderRows(ordersProvider, 10)(timeProvider)

      val viewPort = viewPortContainer.create(session, outQueue, highPriorityQueue, orders, ViewPortRange(0, 10), vpcolumns)

      viewPortContainer.runOnce()

      val combinedUpdates = combineQs(viewPort)

      assertVpEqWithMeta(combinedUpdates) {
        Table(
            ("sel","orderId" ,"trader"  ,"ric"     ,"tradeTime","quantity"),
            (0         ,"NYC-0000","chris"   ,"VOD.L"   ,1311544800l,100       ),
            (0         ,"NYC-0001","chris"   ,"VOD.L"   ,1311544810l,101       ),
            (0         ,"NYC-0002","chris"   ,"VOD.L"   ,1311544820l,102       ),
            (0         ,"NYC-0003","chris"   ,"VOD.L"   ,1311544830l,103       ),
            (0         ,"NYC-0004","chris"   ,"VOD.L"   ,1311544840l,104       ),
            (0         ,"NYC-0005","chris"   ,"VOD.L"   ,1311544850l,105       ),
            (0         ,"NYC-0006","chris"   ,"VOD.L"   ,1311544860l,106       ),
            (0         ,"NYC-0007","chris"   ,"VOD.L"   ,1311544870l,107       ),
            (0         ,"NYC-0008","chris"   ,"VOD.L"   ,1311544880l,108       ),
            (0         ,"NYC-0009","chris"   ,"VOD.L"   ,1311544890l,109       )
          )
      }

      And("we select some rows in the grid")
      viewPortContainer.changeSelection(session, highPriorityQueue, viewPort.id, ViewPortSelection(Array(0, 2)))

      Then("Check the selected rows is updated")
      assertVpEqWithMeta(combineQs(viewPort)) {
        Table(
          ("sel", "orderId", "trader", "ric", "tradeTime", "quantity"),
          (1, "NYC-0000", "chris", "VOD.L", 1311544800l, 100),
          (1, "NYC-0002", "chris", "VOD.L", 1311544820l, 102),
        )
      }

      viewPortContainer.changeSelection(session, highPriorityQueue, viewPort.id, ViewPortSelection(Array(2)))

      assertVpEqWithMeta(combineQs(viewPort)) {
          Table(
            ("sel","orderId" ,"trader"  ,"ric"     ,"tradeTime","quantity"),
            (1         ,"NYC-0002","chris"   ,"VOD.L"   ,1311544820l,102       ),
            (0         ,"NYC-0000","chris"   ,"VOD.L"   ,1311544800l,100       )
          )
        }

      And("when we apply a sort")
      val viewPortChanged = viewPortContainer.change(session, viewPort.id, viewPort.getRange(), vpcolumns, sort = SortSpec(List(SortDef("quantity", 'A'))))

      viewPortContainer.runOnce()

      Then("Check we still maintain the selection")
      assertVpEqWithMeta(combineQs(viewPortChanged)) {
        Table(
          ("sel","orderId" ,"trader"  ,"ric"     ,"tradeTime","quantity"),
          (0         ,"NYC-0009","chris"   ,"VOD.L"   ,1311544890l,109       ),
          (0         ,"NYC-0008","chris"   ,"VOD.L"   ,1311544880l,108       ),
          (0         ,"NYC-0007","chris"   ,"VOD.L"   ,1311544870l,107       ),
          (0         ,"NYC-0006","chris"   ,"VOD.L"   ,1311544860l,106       ),
          (0         ,"NYC-0005","chris"   ,"VOD.L"   ,1311544850l,105       ),
          (0         ,"NYC-0004","chris"   ,"VOD.L"   ,1311544840l,104       ),
          (0         ,"NYC-0003","chris"   ,"VOD.L"   ,1311544830l,103       ),
          (1         ,"NYC-0002","chris"   ,"VOD.L"   ,1311544820l,102       ),
          (0         ,"NYC-0001","chris"   ,"VOD.L"   ,1311544810l,101       ),
          (0         ,"NYC-0000","chris"   ,"VOD.L"   ,1311544800l,100       )
        )
      }
    }
  }
}
