package org.finos.vuu.viewport.disable

import org.finos.vuu.api._
import org.finos.vuu.client.messages.RequestId
import org.finos.vuu.core.table.TableTestHelper._
import org.finos.vuu.core.table.{Columns, TableContainer, ViewPortColumnCreator}
import org.finos.vuu.net.{ClientSessionId, FilterSpec}
import org.finos.vuu.provider.{JoinTableProviderImpl, MockProvider, ProviderContainer}
import org.finos.vuu.util.OutboundRowPublishQueue
import org.finos.vuu.util.table.TableAsserts._
import org.finos.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.{Clock, DefaultClock}
import org.finos.vuu.viewport.{AbstractViewPortTestCase, ViewPortRange}
import org.scalatest.GivenWhenThen
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers
import org.scalatest.prop.Tables.Table

class DisableViewPortTest extends AbstractViewPortTestCase with Matchers with GivenWhenThen {

  Feature("Disable Viewport example") {

    Scenario("Check that a viewport is not emptied when disabled") {

      Given("we've created a viewport with orders in and a calc'd column 2")
      val (viewPortContainer, orders, ordersProvider, session, outQueue, highPriorityQueue) = createDefaultViewPortInfra()

      val viewPortColumns = ViewPortColumnCreator.create(orders, List("orderId", "trader", "tradeTime", "quantity", "ric"))

      createNOrderRowsNoSleep(ordersProvider, 10)(timeProvider)

      val viewPort = viewPortContainer.create(RequestId.oneNew(), session, outQueue, highPriorityQueue, orders, ViewPortRange(0, 10), viewPortColumns)

      viewPortContainer.runOnce()

      val combinedUpdates = combineQs(viewPort)

      //this result is not ideal, need to fix, logic operators currently 'eat' the error message from the missing column
      //it should return a compound error
      assertVpEq(combinedUpdates) {
        Table(
          ("orderId", "trader", "ric", "tradeTime", "quantity"),
          ("NYC-0000", "chris", "VOD.L", 1311544800L, 100),
          ("NYC-0001", "chris", "VOD.L", 1311544800L, 101),
          ("NYC-0002", "chris", "VOD.L", 1311544800L, 102),
          ("NYC-0003", "chris", "VOD.L", 1311544800L, 103),
          ("NYC-0004", "chris", "VOD.L", 1311544800L, 104),
          ("NYC-0005", "chris", "VOD.L", 1311544800L, 105),
          ("NYC-0006", "chris", "VOD.L", 1311544800L, 106),
          ("NYC-0007", "chris", "VOD.L", 1311544800L, 107),
          ("NYC-0008", "chris", "VOD.L", 1311544800L, 108),
          ("NYC-0009", "chris", "VOD.L", 1311544800L, 109)
        )
      }

      viewPortContainer.disableViewPort(viewPort.id)

      viewPortContainer.runOnce()

      val combinedUpdates2 = combineQs(viewPort)

      combinedUpdates2.size should equal(0)

    }
  }
}
