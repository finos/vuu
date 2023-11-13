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

class CalculatedColumnsViewPortTest extends AbstractViewPortTestCase with Matchers with GivenWhenThen {

  implicit val clock: Clock = new TestFriendlyClock(TestTimeStamp.EPOCH_DEFAULT)
  implicit val metrics: MetricsProvider = new MetricsProviderImpl

  Feature("Create a Viewport with calc on a non-existant column") {

    Scenario("Scenario 1") {

      Given("we've created a viewport with orders in and a calc'd column 2")
      val (viewPortContainer, orders, ordersProvider, session, outQueue) = createDefaultViewPortInfra()

      val viewPortColumns = ViewPortColumnCreator.create(orders, List("orderId", "trader", "tradeTime", "quantity", "ric", "logicTest:String:=if(fooBar = 109, \"Yay\", \"Boo\")"))

      createNOrderRowsNoSleep(ordersProvider, 10)(clock)

      val viewPort = viewPortContainer.create(RequestId.oneNew(), session, outQueue, orders, ViewPortRange(0, 10), viewPortColumns)

      viewPortContainer.runOnce()

      val combinedUpdates = combineQs(viewPort)

      //this result is not ideal, need to fix, logic operators currently 'eat' the error message from the missing column
      //it should return a compound error
      assertVpEq(combinedUpdates) {
        Table(
          ("orderId" ,"trader"  ,"ric"     ,"tradeTime","quantity","logicTest"),
          ("NYC-0000","chris"   ,"VOD.L"   ,1311544800000L,100       ,"Boo"     ),
          ("NYC-0001","chris"   ,"VOD.L"   ,1311544800000L,101       ,"Boo"     ),
          ("NYC-0002","chris"   ,"VOD.L"   ,1311544800000L,102       ,"Boo"     ),
          ("NYC-0003","chris"   ,"VOD.L"   ,1311544800000L,103       ,"Boo"     ),
          ("NYC-0004","chris"   ,"VOD.L"   ,1311544800000L,104       ,"Boo"     ),
          ("NYC-0005","chris"   ,"VOD.L"   ,1311544800000L,105       ,"Boo"     ),
          ("NYC-0006","chris"   ,"VOD.L"   ,1311544800000L,106       ,"Boo"     ),
          ("NYC-0007","chris"   ,"VOD.L"   ,1311544800000L,107       ,"Boo"     ),
          ("NYC-0008","chris"   ,"VOD.L"   ,1311544800000L,108       ,"Boo"     ),
          ("NYC-0009","chris"   ,"VOD.L"   ,1311544800000L,109       ,"Boo"     )
        )
      }
    }
  }


  Feature("Create a Viewport with logical calculated columns in") {

    Scenario("Scenario 2") {

      val (viewPortContainer, orders, ordersProvider, session, outQueue) = createDefaultViewPortInfra()

      val viewPortColumns = ViewPortColumnCreator.create(orders, List("orderId", "trader", "tradeTime", "quantity", "ric", "logicTest:String:=if(quantity = 109, \"Yay\", \"Boo\")"))

      createNOrderRowsNoSleep(ordersProvider, 10)(clock)

      val viewPort = viewPortContainer.create(RequestId.oneNew(), session, outQueue, orders, ViewPortRange(0, 10), viewPortColumns)

      viewPortContainer.runOnce()

      val combinedUpdates = combineQs(viewPort)

      assertVpEq(combinedUpdates) {
        Table(
          ("orderId" ,"trader"  ,"ric"     ,"tradeTime","quantity","logicTest"),
          ("NYC-0000","chris"   ,"VOD.L"   ,1311544800000L,100       ,"Boo"     ),
          ("NYC-0001","chris"   ,"VOD.L"   ,1311544800000L,101       ,"Boo"     ),
          ("NYC-0002","chris"   ,"VOD.L"   ,1311544800000L,102       ,"Boo"     ),
          ("NYC-0003","chris"   ,"VOD.L"   ,1311544800000L,103       ,"Boo"     ),
          ("NYC-0004","chris"   ,"VOD.L"   ,1311544800000L,104       ,"Boo"     ),
          ("NYC-0005","chris"   ,"VOD.L"   ,1311544800000L,105       ,"Boo"     ),
          ("NYC-0006","chris"   ,"VOD.L"   ,1311544800000L,106       ,"Boo"     ),
          ("NYC-0007","chris"   ,"VOD.L"   ,1311544800000L,107       ,"Boo"     ),
          ("NYC-0008","chris"   ,"VOD.L"   ,1311544800000L,108       ,"Boo"     ),
          ("NYC-0009","chris"   ,"VOD.L"   ,1311544800000L,109       ,"Yay"     )
        )
      }
    }
  }

  Feature("Create a Viewport with calculated columns in") {

    Scenario("Scenario 3") {

      val (viewPortContainer, orders, ordersProvider, session, outQueue) = createDefaultViewPortInfra()

      val viewPortColumns = ViewPortColumnCreator.create(orders, List("orderId", "trader", "tradeTime", "quantity", "ric", "quantityTimes100:Long:=quantity*100"))

      createNOrderRowsNoSleep(ordersProvider, 10)(clock)

      val viewPort = viewPortContainer.create(RequestId.oneNew(), session, outQueue, orders, ViewPortRange(0, 10), viewPortColumns)

      viewPortContainer.runOnce()

      val combinedUpdates = combineQs(viewPort)

      assertVpEq(combinedUpdates) {
        Table(
          ("orderId" ,"trader"  ,"ric"     ,"tradeTime","quantity","quantityTimes100"),
          ("NYC-0000","chris"   ,"VOD.L"   ,1311544800000L,100       ,10000     ),
          ("NYC-0001","chris"   ,"VOD.L"   ,1311544800000L,101       ,10100     ),
          ("NYC-0002","chris"   ,"VOD.L"   ,1311544800000L,102       ,10200     ),
          ("NYC-0003","chris"   ,"VOD.L"   ,1311544800000L,103       ,10300     ),
          ("NYC-0004","chris"   ,"VOD.L"   ,1311544800000L,104       ,10400     ),
          ("NYC-0005","chris"   ,"VOD.L"   ,1311544800000L,105       ,10500     ),
          ("NYC-0006","chris"   ,"VOD.L"   ,1311544800000L,106       ,10600     ),
          ("NYC-0007","chris"   ,"VOD.L"   ,1311544800000L,107       ,10700     ),
          ("NYC-0008","chris"   ,"VOD.L"   ,1311544800000L,108       ,10800     ),
          ("NYC-0009","chris"   ,"VOD.L"   ,1311544800000L,109       ,10900     )
        )
      }


      val viewPortColumns2 = ViewPortColumnCreator.create(orders, List("orderId", "trader", "tradeTime", "quantity", "ric", "textConcat:String:=concatenate(orderId, ric)"))

      val viewPort2 = viewPortContainer.change(RequestId.oneNew(), session, viewPort.id, ViewPortRange(0, 10), viewPortColumns2)

      viewPortContainer.runOnce()

      val combinedUpdates2 = combineQs(viewPort2)

      assertVpEq(combinedUpdates2) {
        Table(
          ("orderId" ,"trader"  ,"ric"     ,"tradeTime","quantity","textConcat"),
          ("NYC-0000","chris"   ,"VOD.L"   ,1311544800000L,100       ,"NYC-0000VOD.L"),
          ("NYC-0001","chris"   ,"VOD.L"   ,1311544800000L,101       ,"NYC-0001VOD.L"),
          ("NYC-0002","chris"   ,"VOD.L"   ,1311544800000L,102       ,"NYC-0002VOD.L"),
          ("NYC-0003","chris"   ,"VOD.L"   ,1311544800000L,103       ,"NYC-0003VOD.L"),
          ("NYC-0004","chris"   ,"VOD.L"   ,1311544800000L,104       ,"NYC-0004VOD.L"),
          ("NYC-0005","chris"   ,"VOD.L"   ,1311544800000L,105       ,"NYC-0005VOD.L"),
          ("NYC-0006","chris"   ,"VOD.L"   ,1311544800000L,106       ,"NYC-0006VOD.L"),
          ("NYC-0007","chris"   ,"VOD.L"   ,1311544800000L,107       ,"NYC-0007VOD.L"),
          ("NYC-0008","chris"   ,"VOD.L"   ,1311544800000L,108       ,"NYC-0008VOD.L"),
          ("NYC-0009","chris"   ,"VOD.L"   ,1311544800000L,109       ,"NYC-0009VOD.L")
        )
      }
    }

  }

  Feature("Amend a Viewport to include a calculated columns in") {

    Scenario("Scenario 4") {

      val (viewPortContainer, orders, ordersProvider, session, outQueue) = createDefaultViewPortInfra()

      val viewPortColumns = ViewPortColumnCreator.create(orders, List("orderId", "trader", "tradeTime", "quantity", "ric"))

      createNOrderRowsNoSleep(ordersProvider, 10)(clock)

      val viewPort = viewPortContainer.create(RequestId.oneNew(), session, outQueue, orders, ViewPortRange(0, 10), viewPortColumns)

      viewPortContainer.runOnce()

      val combinedUpdates = combineQs(viewPort)

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

      val amendViewPortColumns = ViewPortColumnCreator.create(orders, List("orderId", "trader", "tradeTime", "quantity", "ric", "textConcat:String:=concatenate(orderId, ric)"))

      val amendViewPort = viewPortContainer.change(RequestId.oneNew(), session, viewPort.id, ViewPortRange(0, 10), amendViewPortColumns)

      val combinedUpdates2 = combineQs(amendViewPort)

      assertVpEq(combinedUpdates2) {
        Table(
          ("orderId" ,"trader"  ,"ric"     ,"tradeTime","quantity","textConcat"),
          ("NYC-0000","chris"   ,"VOD.L"   ,1311544800000L,100       ,"NYC-0000VOD.L"),
          ("NYC-0001","chris"   ,"VOD.L"   ,1311544800000L,101       ,"NYC-0001VOD.L"),
          ("NYC-0002","chris"   ,"VOD.L"   ,1311544800000L,102       ,"NYC-0002VOD.L"),
          ("NYC-0003","chris"   ,"VOD.L"   ,1311544800000L,103       ,"NYC-0003VOD.L"),
          ("NYC-0004","chris"   ,"VOD.L"   ,1311544800000L,104       ,"NYC-0004VOD.L"),
          ("NYC-0005","chris"   ,"VOD.L"   ,1311544800000L,105       ,"NYC-0005VOD.L"),
          ("NYC-0006","chris"   ,"VOD.L"   ,1311544800000L,106       ,"NYC-0006VOD.L"),
          ("NYC-0007","chris"   ,"VOD.L"   ,1311544800000L,107       ,"NYC-0007VOD.L"),
          ("NYC-0008","chris"   ,"VOD.L"   ,1311544800000L,108       ,"NYC-0008VOD.L"),
          ("NYC-0009","chris"   ,"VOD.L"   ,1311544800000L,109       ,"NYC-0009VOD.L")
        )
      }

    }
  }
}
