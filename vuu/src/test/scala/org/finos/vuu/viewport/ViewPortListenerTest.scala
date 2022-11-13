package org.finos.vuu.viewport

import org.finos.vuu.client.messages.RequestId
import org.finos.vuu.core.table.TableTestHelper.combineQs
import org.finos.vuu.util.table.TableAsserts.assertVpEq
import org.scalatest.GivenWhenThen
import org.scalatest.matchers.should.Matchers
import org.scalatest.prop.Tables.Table

class ViewPortListenerTest extends AbstractViewPortTestCase with Matchers with GivenWhenThen{

  Feature("Check that when we move a viewport range around in vp, the keys are correctly subscribed"){

    Scenario("Check when we move vp down and back and tick, rows come through"){

      val (viewPortContainer, orders, ordersProvider, session, outQueue, highPriorityQueue) = createDefaultViewPortInfra()

      val vpcolumns = List("orderId", "trader", "tradeTime", "quantity", "ric").map(orders.getTableDef.columnForName(_)).toList

      createNOrderRows(ordersProvider, 30)(timeProvider)

      val viewPort = viewPortContainer.create(RequestId.oneNew(), session, outQueue, highPriorityQueue, orders, ViewPortRange(0, 10), vpcolumns)

      viewPortContainer.runOnce()

      val combinedUpdates = combineQs(viewPort)

      assertVpEq(combinedUpdates){
        Table(
          ("orderId" ,"trader"  ,"ric"     ,"tradeTime","quantity"),
          ("NYC-0000","chris"   ,"VOD.L"   ,1311544800l,100       ),
          ("NYC-0001","chris"   ,"VOD.L"   ,1311544810l,101       ),
          ("NYC-0002","chris"   ,"VOD.L"   ,1311544820l,102       ),
          ("NYC-0003","chris"   ,"VOD.L"   ,1311544830l,103       ),
          ("NYC-0004","chris"   ,"VOD.L"   ,1311544840l,104       ),
          ("NYC-0005","chris"   ,"VOD.L"   ,1311544850l,105       ),
          ("NYC-0006","chris"   ,"VOD.L"   ,1311544860l,106       ),
          ("NYC-0007","chris"   ,"VOD.L"   ,1311544870l,107       ),
          ("NYC-0008","chris"   ,"VOD.L"   ,1311544880l,108       ),
          ("NYC-0009","chris"   ,"VOD.L"   ,1311544890l,109       )
        )
      }

      val viewPortv2 = viewPortContainer.changeRange(session, highPriorityQueue, viewPort.id, ViewPortRange(15, 25))

      viewPortContainer.runOnce()

      val combinedUpdates2 = combineQs(viewPortv2)

      assertVpEq(combinedUpdates2){
        Table(
          ("orderId" ,"trader"  ,"ric"     ,"tradeTime","quantity"),
          ("NYC-0015","chris"   ,"VOD.L"   ,1311544950l,115       ),
          ("NYC-0016","chris"   ,"VOD.L"   ,1311544960l,116       ),
          ("NYC-0017","chris"   ,"VOD.L"   ,1311544970l,117       ),
          ("NYC-0018","chris"   ,"VOD.L"   ,1311544980l,118       ),
          ("NYC-0019","chris"   ,"VOD.L"   ,1311544990l,119       ),
          ("NYC-0020","chris"   ,"VOD.L"   ,1311545000l,120       ),
          ("NYC-0021","chris"   ,"VOD.L"   ,1311545010l,121       ),
          ("NYC-0022","chris"   ,"VOD.L"   ,1311545020l,122       ),
          ("NYC-0023","chris"   ,"VOD.L"   ,1311545030l,123       ),
          ("NYC-0024","chris"   ,"VOD.L"   ,1311545040l,124       )
        )
      }

      val viewPortv3 = viewPortContainer.changeRange(session, highPriorityQueue, viewPort.id, ViewPortRange(5, 15))

      viewPortContainer.runOnce()

      val combinedUpdates3 = combineQs(viewPortv3)

      assertVpEq(combinedUpdates3){
        Table(
          ("orderId" ,"trader"  ,"ric"     ,"tradeTime","quantity"),
          ("NYC-0005","chris"   ,"VOD.L"   ,1311544850l,105       ),
          ("NYC-0006","chris"   ,"VOD.L"   ,1311544860l,106       ),
          ("NYC-0007","chris"   ,"VOD.L"   ,1311544870l,107       ),
          ("NYC-0008","chris"   ,"VOD.L"   ,1311544880l,108       ),
          ("NYC-0009","chris"   ,"VOD.L"   ,1311544890l,109       ),
          ("NYC-0010","chris"   ,"VOD.L"   ,1311544900l,110       ),
          ("NYC-0011","chris"   ,"VOD.L"   ,1311544910l,111       ),
          ("NYC-0012","chris"   ,"VOD.L"   ,1311544920l,112       ),
          ("NYC-0013","chris"   ,"VOD.L"   ,1311544930l,113       ),
          ("NYC-0014","chris"   ,"VOD.L"   ,1311544940l,114       )
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
          ("NYC-0005","chris"   ,"VOD.L"   ,1311544850l,1005      ),
          ("NYC-0006","chris"   ,"VOD.L"   ,1311544860l,1006      ),
          ("NYC-0007","chris"   ,"VOD.L"   ,1311544870l,1007      ),
          ("NYC-0008","chris"   ,"VOD.L"   ,1311544880l,1008      ),
          ("NYC-0009","chris"   ,"VOD.L"   ,1311544890l,1009      ),
          ("NYC-0010","chris"   ,"VOD.L"   ,1311544900l,1010      ),
          ("NYC-0011","chris"   ,"VOD.L"   ,1311544910l,1011      ),
          ("NYC-0012","chris"   ,"VOD.L"   ,1311544920l,1012      ),
          ("NYC-0013","chris"   ,"VOD.L"   ,1311544930l,1013      ),
          ("NYC-0014","chris"   ,"VOD.L"   ,1311544940l,1014      )
        )
      }

      viewPortv3.table.isKeyObserved("NYC-0004") shouldEqual(false)
      viewPortv3.table.isKeyObserved("NYC-0005") shouldEqual(true)
      viewPortv3.table.isKeyObserved("NYC-0006") shouldEqual(true)
      viewPortv3.table.isKeyObserved("NYC-0007") shouldEqual(true)
      viewPortv3.table.isKeyObserved("NYC-0008") shouldEqual(true)
      viewPortv3.table.isKeyObserved("NYC-0009") shouldEqual(true)
      viewPortv3.table.isKeyObserved("NYC-0010") shouldEqual(true)
      viewPortv3.table.isKeyObserved("NYC-0011") shouldEqual(true)
      viewPortv3.table.isKeyObserved("NYC-0012") shouldEqual(true)
      viewPortv3.table.isKeyObserved("NYC-0013") shouldEqual(true)
      viewPortv3.table.isKeyObserved("NYC-0014") shouldEqual(true)
      viewPortv3.table.isKeyObserved("NYC-0015") shouldEqual(false)
    }
  }

}
