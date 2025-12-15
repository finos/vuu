package org.finos.vuu.viewport

import org.finos.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import org.finos.toolbox.time.{Clock, TestFriendlyClock}
import org.finos.vuu.client.messages.RequestId
import org.finos.vuu.core.table.TableTestHelper.combineQs
import org.finos.vuu.core.table.ViewPortColumnCreator
import org.finos.vuu.util.table.TableAsserts.assertVpEq
import org.scalatest.GivenWhenThen
import org.scalatest.matchers.should.Matchers
import org.scalatest.prop.Tables.Table

class DeleteViewPortTest extends AbstractViewPortTestCase with Matchers with GivenWhenThen {

  implicit val clock: Clock = new TestFriendlyClock(TestTimeStamp.EPOCH_DEFAULT)
  implicit val metrics: MetricsProvider = new MetricsProviderImpl

  Feature("Check when we delete a viewport, it is removed and no further ticks are sent") {

    Scenario("Create viewport delete it, check no further ticks") {

      val (viewPortContainer, orders, ordersProvider, user, session, outQueue) = createDefaultViewPortInfra()

      val vpcolumns = ViewPortColumnCreator.create(orders, List("orderId", "trader", "tradeTime", "quantity", "ric"))//.map(orders.getTableDef.columnForName(_)).toList

      createNOrderRows(ordersProvider, 10)(clock)

      val viewPort = viewPortContainer.create(RequestId.oneNew(), user, session, outQueue, orders, ViewPortRange(0, 4), vpcolumns)

      viewPortContainer.runOnce()

      val combinedUpdates = combineQs(viewPort)

      combinedUpdates.head.size should equal(10)

      assertVpEq(combinedUpdates) {
        Table(
          ("orderId" ,"trader"  ,"ric"     ,"tradeTime","quantity"),
          ("NYC-0000","chris"   ,"VOD.L"   ,1311544800000L,100       ),
          ("NYC-0001","chris"   ,"VOD.L"   ,1311544800010L,101       ),
          ("NYC-0002","chris"   ,"VOD.L"   ,1311544800020L,102       ),
          ("NYC-0003","chris"   ,"VOD.L"   ,1311544800030L,103       )
        )
      }

      viewPortContainer.removeViewPort(viewPort.id, session)

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
