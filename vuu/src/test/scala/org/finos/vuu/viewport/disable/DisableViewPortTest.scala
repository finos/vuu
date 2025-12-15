package org.finos.vuu.viewport.disable

import org.finos.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import org.finos.toolbox.time.{Clock, TestFriendlyClock}
import org.finos.vuu.client.messages.RequestId
import org.finos.vuu.core.table.TableTestHelper._
import org.finos.vuu.core.table.ViewPortColumnCreator
import org.finos.vuu.util.table.TableAsserts._
import org.finos.vuu.viewport.{AbstractViewPortTestCase, TestTimeStamp, ViewPortRange}
import org.scalatest.GivenWhenThen
import org.scalatest.matchers.should.Matchers
import org.scalatest.prop.Tables.Table

class DisableViewPortTest extends AbstractViewPortTestCase with Matchers with GivenWhenThen {

  implicit val clock: Clock = new TestFriendlyClock(TestTimeStamp.EPOCH_DEFAULT)
  implicit val metrics: MetricsProvider = new MetricsProviderImpl

  Feature("Disable Viewport example") {

    Scenario("Check that a viewport is not emptied when disabled") {

      Given("we've created a viewport with orders in and a calc'd column 2")
      val (viewPortContainer, orders, ordersProvider, user, session, outQueue) = createDefaultViewPortInfra()

      val viewPortColumns = ViewPortColumnCreator.create(orders, List("orderId", "trader", "tradeTime", "quantity", "ric"))

      createNOrderRowsNoSleep(ordersProvider, 10)(clock)

      val viewPort = viewPortContainer.create(RequestId.oneNew(), user, session, outQueue, orders, ViewPortRange(0, 10), viewPortColumns)

      viewPortContainer.runOnce()

      val combinedUpdates = combineQs(viewPort)

      //this result is not ideal, need to fix, logic operators currently 'eat' the error message from the missing column
      //it should return a compound error
      assertVpEq(combinedUpdates) {
        Table(
          ("orderId" ,"trader"  ,"ric"     ,"tradeTime","quantity"),
          ("NYC-0000","chris"   ,"VOD.L"   ,1311544800000L,100       ),
          ("NYC-0001","chris"   ,"VOD.L"   ,1311544800000L,101       ),
          ("NYC-0002","chris"   ,"VOD.L"   ,1311544800000L,102       ),
          ("NYC-0003","chris"   ,"VOD.L"   ,1311544800000L,103       ),
          ("NYC-0004","chris"   ,"VOD.L"   ,1311544800000L,104       ),
          ("NYC-0005","chris"   ,"VOD.L"   ,1311544800000L,105       ),
          ("NYC-0006","chris"   ,"VOD.L"   ,1311544800000L,106       ),
          ("NYC-0007","chris"   ,"VOD.L"   ,1311544800000L,107       ),
          ("NYC-0008","chris"   ,"VOD.L"   ,1311544800000L,108       ),
          ("NYC-0009","chris"   ,"VOD.L"   ,1311544800000L,109       )
        )
      }

      viewPortContainer.disableViewPort(viewPort.id, session)

      viewPortContainer.runOnce()

      val combinedUpdates2 = combineQs(viewPort)

      combinedUpdates2.size should equal(0)

    }
  }
}
