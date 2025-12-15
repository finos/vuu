package org.finos.vuu.viewport

import org.finos.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import org.finos.toolbox.time.{Clock, TestFriendlyClock}
import org.finos.vuu.client.messages.RequestId
import org.finos.vuu.core.table.TableTestHelper.{combineQs, emptyQueues}
import org.finos.vuu.core.table.ViewPortColumnCreator
import org.finos.vuu.util.table.TableAsserts.assertVpEq
import org.scalatest.GivenWhenThen
import org.scalatest.matchers.should.Matchers
import org.scalatest.prop.Tables.Table

/**
 * When we update a viewport range, moving from say 0-20 to 10-30, we only want to send updates for the additional rows,
 * no the whole content of the viewport. In this example it would be rows 20-30.
 */
class OnlySendDiffRowsViewPortTest extends AbstractViewPortTestCase with Matchers with GivenWhenThen{

  implicit val clock: Clock = new TestFriendlyClock(TestTimeStamp.EPOCH_DEFAULT)
  implicit val metrics: MetricsProvider = new MetricsProviderImpl

  Feature("Check when we update view port ranges, we only send the new rows"){

    Scenario("Change viewport from 0-20 to 10-30 and check we only get 10 rows"){

      val (viewPortContainer, orders, ordersProvider, user, session, outQueue) = createDefaultViewPortInfra()

      val vpcolumns = ViewPortColumnCreator.create(orders, List("orderId", "trader", "tradeTime", "quantity", "ric"))//.map(orders.getTableDef.columnForName(_)).toList

      createNOrderRows(ordersProvider, 10)(clock)

      val viewPort = viewPortContainer.create(RequestId.oneNew(), user, session, outQueue, orders, ViewPortRange(0, 4), vpcolumns)

      viewPortContainer.runOnce()

      val combinedUpdates = combineQs(viewPort)

      combinedUpdates.head.size should equal(10)

      assertVpEq(combinedUpdates){
        Table(
          ("orderId" ,"trader"  ,"ric"     ,"tradeTime","quantity"),
          ("NYC-0000","chris"   ,"VOD.L"   ,1311544800000L,100       ),
          ("NYC-0001","chris"   ,"VOD.L"   ,1311544800010L,101       ),
          ("NYC-0002","chris"   ,"VOD.L"   ,1311544800020L,102       ),
          ("NYC-0003","chris"   ,"VOD.L"   ,1311544800030L,103       )
        )
      }

      val viewPortv2 = viewPortContainer.changeRange(session, viewPort.id, ViewPortRange(2, 6))

      viewPortContainer.runOnce()

      assertVpEq(combineQs(viewPortv2)){
        Table(
          ("orderId" ,"trader"  ,"ric"     ,"tradeTime","quantity"),
          ("NYC-0004","chris"   ,"VOD.L"   ,1311544800040L,104       ),
          ("NYC-0005","chris"   ,"VOD.L"   ,1311544800050L,105       )
        )
      }

      emptyQueues(viewPortv2)

      viewPortContainer.runOnce()

      assertVpEq(combineQs(viewPortv2)){
        Table(
          ("orderId" ,"trader"  ,"ric"     ,"tradeTime","quantity")
        )
      }

      viewPortContainer.runOnce()

      assertVpEq(combineQs(viewPortv2)){
        Table(
          ("orderId" ,"trader"  ,"ric"     ,"tradeTime","quantity")
        )
      }
    }

  }

}
