package io.venuu.vuu.viewport

import io.venuu.vuu.core.table.TableTestHelper.{combineQs, emptyQueues}
import io.venuu.vuu.util.table.TableAsserts.assertVpEq
import org.scalatest.GivenWhenThen
import org.scalatest.matchers.should.Matchers
import org.scalatest.prop.Tables.Table

class DeleteViewPortTest extends AbstractViewPortTestCase with Matchers with GivenWhenThen {

  Feature("Check when we delete a viewport, it is removed and no further ticks are sent") {

    Scenario("Create viewport delete it, check no further ticks") {

      val (viewPortContainer, orders, ordersProvider, session, outQueue, highPriorityQueue) = createDefaultViewPortInfra()

      val vpcolumns = List("orderId", "trader", "tradeTime", "quantity", "ric").map(orders.getTableDef.columnForName(_)).toList

      createNOrderRows(ordersProvider, 10)(timeProvider)

      val viewPort = viewPortContainer.create(session, outQueue, highPriorityQueue, orders, ViewPortRange(0, 4), vpcolumns)

      viewPortContainer.runOnce()

      val combinedUpdates = combineQs(viewPort)

      combinedUpdates(0).size should equal(10)

      assertVpEq(combinedUpdates) {
        Table(
          ("orderId", "trader", "ric", "tradeTime", "quantity"),
          ("NYC-0000", "chris", "VOD.L", 1311544800l, 100),
          ("NYC-0001", "chris", "VOD.L", 1311544810l, 101),
          ("NYC-0002", "chris", "VOD.L", 1311544820l, 102),
          ("NYC-0003", "chris", "VOD.L", 1311544830l, 103)
        )
      }

      viewPortContainer.removeViewPort(viewPort.id)

      (0 to 3).foreach( i => {
        val orderId = "NYC-000" + i
        ordersProvider.tick(orderId, Map("orderId" -> orderId, "trader" -> "steve", "quantity" -> (200 + i)))
      })

      val combinedUpdates2 = combineQs(viewPort)

      assertVpEq(combinedUpdates2) {
        Table(
          ("orderId", "trader", "ric", "tradeTime", "quantity")
        )
      }

    }
  }
}
