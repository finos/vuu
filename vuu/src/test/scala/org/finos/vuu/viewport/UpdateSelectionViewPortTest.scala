package org.finos.vuu.viewport

import org.finos.vuu.client.messages.RequestId
import org.finos.vuu.core.table.TableTestHelper.combineQs
import org.finos.vuu.core.table.ViewPortColumnCreator
import org.finos.vuu.net.{SortDef, SortSpec}
import org.finos.vuu.util.table.TableAsserts.assertVpEqWithMeta
import org.scalatest.GivenWhenThen
import org.scalatest.matchers.should.Matchers
import org.scalatest.prop.Tables.Table

class UpdateSelectionViewPortTest extends AbstractViewPortTestCase with Matchers with GivenWhenThen{

  Feature("Check our maintenance of selection on the server side") {

    Scenario("create viewport, update selection, see selection come back") {

      Given("we've created a viewport with orders in")
      val (viewPortContainer, orders, ordersProvider, session, outQueue, highPriorityQueue) = createDefaultViewPortInfra()

      val vpcolumns = ViewPortColumnCreator.create(orders, List("orderId", "trader", "tradeTime", "quantity", "ric"))

      createNOrderRows(ordersProvider, 10)(timeProvider)

      val viewPort = viewPortContainer.create(RequestId.oneNew(), session, outQueue, highPriorityQueue, orders, ViewPortRange(0, 10), vpcolumns)

      viewPortContainer.runOnce()

      val combinedUpdates = combineQs(viewPort)

      assertVpEqWithMeta(combinedUpdates) {
        Table(
            ("sel","orderId" ,"trader"  ,"ric"     ,"tradeTime","quantity"),
            (0         ,"NYC-0000","chris"   ,"VOD.L"   ,1311544800L,100       ),
            (0         ,"NYC-0001","chris"   ,"VOD.L"   ,1311544810L,101       ),
            (0         ,"NYC-0002","chris"   ,"VOD.L"   ,1311544820L,102       ),
            (0         ,"NYC-0003","chris"   ,"VOD.L"   ,1311544830L,103       ),
            (0         ,"NYC-0004","chris"   ,"VOD.L"   ,1311544840L,104       ),
            (0         ,"NYC-0005","chris"   ,"VOD.L"   ,1311544850L,105       ),
            (0         ,"NYC-0006","chris"   ,"VOD.L"   ,1311544860L,106       ),
            (0         ,"NYC-0007","chris"   ,"VOD.L"   ,1311544870L,107       ),
            (0         ,"NYC-0008","chris"   ,"VOD.L"   ,1311544880L,108       ),
            (0         ,"NYC-0009","chris"   ,"VOD.L"   ,1311544890L,109       )
          )
      }

      And("we select some rows in the grid")
      viewPortContainer.changeSelection(session, highPriorityQueue, viewPort.id, ViewPortSelectedIndices(Array(0, 2)))

      Then("Check the selected rows is updated")
      assertVpEqWithMeta(combineQs(viewPort)) {
        Table(
          ("sel", "orderId", "trader", "ric", "tradeTime", "quantity"),
          (1, "NYC-0000", "chris", "VOD.L", 1311544800L, 100),
          (1, "NYC-0002", "chris", "VOD.L", 1311544820L, 102),
        )
      }

      viewPortContainer.changeSelection(session, highPriorityQueue, viewPort.id, ViewPortSelectedIndices(Array(2)))

      assertVpEqWithMeta(combineQs(viewPort)) {
          Table(
            ("sel","orderId" ,"trader"  ,"ric"     ,"tradeTime","quantity"),
            (1         ,"NYC-0002","chris"   ,"VOD.L"   ,1311544820L,102       ),
            (0         ,"NYC-0000","chris"   ,"VOD.L"   ,1311544800L,100       )
          )
        }

      And("when we apply a sort")
      val viewPortChanged = viewPortContainer.change(RequestId.oneNew(), session, viewPort.id, viewPort.getRange, vpcolumns, sort = SortSpec(List(SortDef("quantity", 'A'))))

      viewPortContainer.runOnce()

      Then("Check we still maintain the selection")
      assertVpEqWithMeta(combineQs(viewPortChanged)) {
        Table(
          ("sel","orderId" ,"trader"  ,"ric"     ,"tradeTime","quantity"),
          (0         ,"NYC-0009","chris"   ,"VOD.L"   ,1311544890L,109       ),
          (0         ,"NYC-0008","chris"   ,"VOD.L"   ,1311544880L,108       ),
          (0         ,"NYC-0007","chris"   ,"VOD.L"   ,1311544870L,107       ),
          (0         ,"NYC-0006","chris"   ,"VOD.L"   ,1311544860L,106       ),
          (0         ,"NYC-0005","chris"   ,"VOD.L"   ,1311544850L,105       ),
          (0         ,"NYC-0004","chris"   ,"VOD.L"   ,1311544840L,104       ),
          (0         ,"NYC-0003","chris"   ,"VOD.L"   ,1311544830L,103       ),
          (1         ,"NYC-0002","chris"   ,"VOD.L"   ,1311544820L,102       ),
          (0         ,"NYC-0001","chris"   ,"VOD.L"   ,1311544810L,101       ),
          (0         ,"NYC-0000","chris"   ,"VOD.L"   ,1311544800L,100       )
        )
      }
    }
  }
}
