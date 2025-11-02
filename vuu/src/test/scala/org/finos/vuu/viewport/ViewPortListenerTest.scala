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

class ViewPortListenerTest extends AbstractViewPortTestCase with Matchers with GivenWhenThen{

  implicit val clock: Clock = new TestFriendlyClock(TestTimeStamp.EPOCH_DEFAULT)
  implicit val metrics: MetricsProvider = new MetricsProviderImpl

  Feature("Check that when we move a viewport range around in vp, the keys are correctly subscribed"){

    Scenario("Check when we move vp down and back and tick, rows come through"){

      val (viewPortContainer, orders, ordersProvider, user, session, outQueue) = createDefaultViewPortInfra()

      val vpcolumns = ViewPortColumnCreator.create(orders, List("orderId", "trader", "tradeTime", "quantity", "ric"))

      //val vpcolumns = List("orderId", "trader", "tradeTime", "quantity", "ric").map(orders.getTableDef.columnForName(_)).toList

      createNOrderRows(ordersProvider, 30)(clock)

      val viewPort = viewPortContainer.create(RequestId.oneNew(), user, session, outQueue, orders, ViewPortRange(0, 10), vpcolumns)

      viewPortContainer.runOnce()

      val combinedUpdates = combineQs(viewPort)

      assertVpEq(combinedUpdates){
        Table(
          ("orderId" ,"trader"  ,"ric"     ,"tradeTime","quantity"),
          ("NYC-0000","chris"   ,"VOD.L"   ,1311544800000L,100       ),
          ("NYC-0001","chris"   ,"VOD.L"   ,1311544800010L,101       ),
          ("NYC-0002","chris"   ,"VOD.L"   ,1311544800020L,102       ),
          ("NYC-0003","chris"   ,"VOD.L"   ,1311544800030L,103       ),
          ("NYC-0004","chris"   ,"VOD.L"   ,1311544800040L,104       ),
          ("NYC-0005","chris"   ,"VOD.L"   ,1311544800050L,105       ),
          ("NYC-0006","chris"   ,"VOD.L"   ,1311544800060L,106       ),
          ("NYC-0007","chris"   ,"VOD.L"   ,1311544800070L,107       ),
          ("NYC-0008","chris"   ,"VOD.L"   ,1311544800080L,108       ),
          ("NYC-0009","chris"   ,"VOD.L"   ,1311544800090L,109       )
        )
      }

      val viewPortv2 = viewPortContainer.changeRange(session, outQueue, viewPort.id, ViewPortRange(15, 25))

      viewPortContainer.runOnce()

      val combinedUpdates2 = combineQs(viewPortv2)

      assertVpEq(combinedUpdates2){
        Table(
          ("orderId" ,"trader"  ,"ric"     ,"tradeTime","quantity"),
          ("NYC-0015","chris"   ,"VOD.L"   ,1311544800150L,115       ),
          ("NYC-0016","chris"   ,"VOD.L"   ,1311544800160L,116       ),
          ("NYC-0017","chris"   ,"VOD.L"   ,1311544800170L,117       ),
          ("NYC-0018","chris"   ,"VOD.L"   ,1311544800180L,118       ),
          ("NYC-0019","chris"   ,"VOD.L"   ,1311544800190L,119       ),
          ("NYC-0020","chris"   ,"VOD.L"   ,1311544800200L,120       ),
          ("NYC-0021","chris"   ,"VOD.L"   ,1311544800210L,121       ),
          ("NYC-0022","chris"   ,"VOD.L"   ,1311544800220L,122       ),
          ("NYC-0023","chris"   ,"VOD.L"   ,1311544800230L,123       ),
          ("NYC-0024","chris"   ,"VOD.L"   ,1311544800240L,124       )
        )
      }

      val viewPortv3 = viewPortContainer.changeRange(session, outQueue, viewPort.id, ViewPortRange(5, 15))

      viewPortContainer.runOnce()

      val combinedUpdates3 = combineQs(viewPortv3)

      assertVpEq(combinedUpdates3){
        Table(
          ("orderId" ,"trader"  ,"ric"     ,"tradeTime","quantity"),
          ("NYC-0005","chris"   ,"VOD.L"   ,1311544800050L,105       ),
          ("NYC-0006","chris"   ,"VOD.L"   ,1311544800060L,106       ),
          ("NYC-0007","chris"   ,"VOD.L"   ,1311544800070L,107       ),
          ("NYC-0008","chris"   ,"VOD.L"   ,1311544800080L,108       ),
          ("NYC-0009","chris"   ,"VOD.L"   ,1311544800090L,109       ),
          ("NYC-0010","chris"   ,"VOD.L"   ,1311544800100L,110       ),
          ("NYC-0011","chris"   ,"VOD.L"   ,1311544800110L,111       ),
          ("NYC-0012","chris"   ,"VOD.L"   ,1311544800120L,112       ),
          ("NYC-0013","chris"   ,"VOD.L"   ,1311544800130L,113       ),
          ("NYC-0014","chris"   ,"VOD.L"   ,1311544800140L,114       )
        )
      }

      (5 to 14).foreach( i => {
        val (key,data) = buildOrderRowUpdate(i, 1000 + i)
        ordersProvider.tick(key, data)
      })

      viewPortContainer.runOnce()

      val combinedUpdates4 = combineQs(viewPortv3)

      assertVpEq(combinedUpdates4){
        Table(
          ("orderId" ,"trader"  ,"ric"     ,"tradeTime","quantity"),
          ("NYC-0014","chris"   ,"VOD.L"   ,1311544800140L,1014      ),
          ("NYC-0005","chris"   ,"VOD.L"   ,1311544800050L,1005      ),
          ("NYC-0006","chris"   ,"VOD.L"   ,1311544800060L,1006      ),
          ("NYC-0007","chris"   ,"VOD.L"   ,1311544800070L,1007      ),
          ("NYC-0008","chris"   ,"VOD.L"   ,1311544800080L,1008      ),
          ("NYC-0009","chris"   ,"VOD.L"   ,1311544800090L,1009      ),
          ("NYC-0010","chris"   ,"VOD.L"   ,1311544800100L,1010      ),
          ("NYC-0011","chris"   ,"VOD.L"   ,1311544800110L,1011      ),
          ("NYC-0012","chris"   ,"VOD.L"   ,1311544800120L,1012      ),
          ("NYC-0013","chris"   ,"VOD.L"   ,1311544800130L,1013      )
        )
      }

      viewPortv3.table.isKeyObserved("NYC-0004") shouldEqual false
      viewPortv3.table.isKeyObserved("NYC-0005") shouldEqual true
      viewPortv3.table.isKeyObserved("NYC-0006") shouldEqual true
      viewPortv3.table.isKeyObserved("NYC-0007") shouldEqual true
      viewPortv3.table.isKeyObserved("NYC-0008") shouldEqual true
      viewPortv3.table.isKeyObserved("NYC-0009") shouldEqual true
      viewPortv3.table.isKeyObserved("NYC-0010") shouldEqual true
      viewPortv3.table.isKeyObserved("NYC-0011") shouldEqual true
      viewPortv3.table.isKeyObserved("NYC-0012") shouldEqual true
      viewPortv3.table.isKeyObserved("NYC-0013") shouldEqual true
      viewPortv3.table.isKeyObserved("NYC-0014") shouldEqual true
      viewPortv3.table.isKeyObserved("NYC-0015") shouldEqual false
    }
  }

}
