package org.finos.vuu.viewport

import org.finos.vuu.client.messages.RequestId
import org.finos.vuu.core.table.ViewPortColumnCreator
import org.finos.vuu.core.table.TableTestHelper.combineQs
import org.finos.vuu.util.table.TableAsserts.{assertVpEq, assertVpEqWithMeta}
import org.scalatest.{GivenWhenThen, Ignore}
import org.scalatest.matchers.should.Matchers
import org.scalatest.prop.Tables.Table

class CalculatedColumnsViewPortTest extends AbstractViewPortTestCase with Matchers with GivenWhenThen {

  Feature("Create a Viewport with calc on a non-existant column") {

    Given("we've created a viewport with orders in and a calc'd column 2")
    val (viewPortContainer, orders, ordersProvider, session, outQueue, highPriorityQueue) = createDefaultViewPortInfra()

    val viewPortColumns = ViewPortColumnCreator.create(orders, List("orderId", "trader", "tradeTime", "quantity", "ric", "logicTest:String:=if(fooBar = 109, \"Yay\", \"Boo\")"))

    createNOrderRowsNoSleep(ordersProvider, 10)(timeProvider)

    val viewPort = viewPortContainer.create(RequestId.oneNew(), session, outQueue, highPriorityQueue, orders, ViewPortRange(0, 10), viewPortColumns)

    viewPortContainer.runOnce()

    val combinedUpdates = combineQs(viewPort)

    //this result is not ideal, need to fix, logic operators currently 'eat' the error message from the missing column
    //it should return a compound error
    assertVpEq(combinedUpdates) {
      Table(
        ("orderId" ,"trader"  ,"ric"     ,"tradeTime","quantity","logicTest"),
        ("NYC-0000","chris"   ,"VOD.L"   ,1311544800L,100       ,"Boo"     ),
        ("NYC-0001","chris"   ,"VOD.L"   ,1311544800L,101       ,"Boo"     ),
        ("NYC-0002","chris"   ,"VOD.L"   ,1311544800L,102       ,"Boo"     ),
        ("NYC-0003","chris"   ,"VOD.L"   ,1311544800L,103       ,"Boo"     ),
        ("NYC-0004","chris"   ,"VOD.L"   ,1311544800L,104       ,"Boo"     ),
        ("NYC-0005","chris"   ,"VOD.L"   ,1311544800L,105       ,"Boo"     ),
        ("NYC-0006","chris"   ,"VOD.L"   ,1311544800L,106       ,"Boo"     ),
        ("NYC-0007","chris"   ,"VOD.L"   ,1311544800L,107       ,"Boo"     ),
        ("NYC-0008","chris"   ,"VOD.L"   ,1311544800L,108       ,"Boo"     ),
        ("NYC-0009","chris"   ,"VOD.L"   ,1311544800L,109       ,"Boo"     )
      )
    }
  }

  Feature("Create a Viewport with logical calculated columns in") {

    Given("we've created a viewport with orders in and a calc'd column")
    val (viewPortContainer, orders, ordersProvider, session, outQueue, highPriorityQueue) = createDefaultViewPortInfra()

    val viewPortColumns = ViewPortColumnCreator.create(orders, List("orderId", "trader", "tradeTime", "quantity", "ric", "logicTest:String:=if(quantity = 109, \"Yay\", \"Boo\")"))

    createNOrderRowsNoSleep(ordersProvider, 10)(timeProvider)

    val viewPort = viewPortContainer.create(RequestId.oneNew(), session, outQueue, highPriorityQueue, orders, ViewPortRange(0, 10), viewPortColumns)

    viewPortContainer.runOnce()

    val combinedUpdates = combineQs(viewPort)

    assertVpEq(combinedUpdates) {
      Table(
        ("orderId" ,"trader"  ,"ric"     ,"tradeTime","quantity","logicTest"),
        ("NYC-0000","chris"   ,"VOD.L"   ,1311544800L,100       ,"Boo"     ),
        ("NYC-0001","chris"   ,"VOD.L"   ,1311544800L,101       ,"Boo"     ),
        ("NYC-0002","chris"   ,"VOD.L"   ,1311544800L,102       ,"Boo"     ),
        ("NYC-0003","chris"   ,"VOD.L"   ,1311544800L,103       ,"Boo"     ),
        ("NYC-0004","chris"   ,"VOD.L"   ,1311544800L,104       ,"Boo"     ),
        ("NYC-0005","chris"   ,"VOD.L"   ,1311544800L,105       ,"Boo"     ),
        ("NYC-0006","chris"   ,"VOD.L"   ,1311544800L,106       ,"Boo"     ),
        ("NYC-0007","chris"   ,"VOD.L"   ,1311544800L,107       ,"Boo"     ),
        ("NYC-0008","chris"   ,"VOD.L"   ,1311544800L,108       ,"Boo"     ),
        ("NYC-0009","chris"   ,"VOD.L"   ,1311544800L,109       ,"Yay"     )
      )
    }
  }

    Feature("Create a Viewport with calculated columns in"){

    Given("we've created a viewport with orders in and a calc'd column")
    val (viewPortContainer, orders, ordersProvider, session, outQueue, highPriorityQueue) = createDefaultViewPortInfra()

    val viewPortColumns = ViewPortColumnCreator.create(orders, List("orderId", "trader", "tradeTime", "quantity", "ric", "quantityTimes100:Long:=quantity*100"))

    createNOrderRowsNoSleep(ordersProvider, 10)(timeProvider)

    val viewPort = viewPortContainer.create(RequestId.oneNew(), session, outQueue, highPriorityQueue, orders, ViewPortRange(0, 10), viewPortColumns)

    viewPortContainer.runOnce()

    val combinedUpdates = combineQs(viewPort)

    assertVpEq(combinedUpdates) {
      Table(
        ("orderId" ,"trader"  ,"ric"     ,"tradeTime","quantity","quantityTimes100"),
        ("NYC-0000","chris"   ,"VOD.L"   ,1311544800L,100       ,10000     ),
        ("NYC-0001","chris"   ,"VOD.L"   ,1311544800L,101       ,10100     ),
        ("NYC-0002","chris"   ,"VOD.L"   ,1311544800L,102       ,10200     ),
        ("NYC-0003","chris"   ,"VOD.L"   ,1311544800L,103       ,10300     ),
        ("NYC-0004","chris"   ,"VOD.L"   ,1311544800L,104       ,10400     ),
        ("NYC-0005","chris"   ,"VOD.L"   ,1311544800L,105       ,10500     ),
        ("NYC-0006","chris"   ,"VOD.L"   ,1311544800L,106       ,10600     ),
        ("NYC-0007","chris"   ,"VOD.L"   ,1311544800L,107       ,10700     ),
        ("NYC-0008","chris"   ,"VOD.L"   ,1311544800L,108       ,10800     ),
        ("NYC-0009","chris"   ,"VOD.L"   ,1311544800L,109       ,10900     )
      )
    }


    val viewPortColumns2 = ViewPortColumnCreator.create(orders, List("orderId", "trader", "tradeTime", "quantity", "ric", "textConcat:String:=concatenate(orderId, ric)"))

    val viewPort2 = viewPortContainer.change(RequestId.oneNew(), session, viewPort.id,  ViewPortRange(0, 10), viewPortColumns2)

    viewPortContainer.runOnce()

    val combinedUpdates2 = combineQs(viewPort2)

    assertVpEq(combinedUpdates2) {
      Table(
        ("orderId" ,"trader"  ,"ric"     ,"tradeTime","quantity","textConcat"),
        ("NYC-0000","chris"   ,"VOD.L"   ,1311544800L,100       ,"NYC-0000VOD.L"),
        ("NYC-0001","chris"   ,"VOD.L"   ,1311544800L,101       ,"NYC-0001VOD.L"),
        ("NYC-0002","chris"   ,"VOD.L"   ,1311544800L,102       ,"NYC-0002VOD.L"),
        ("NYC-0003","chris"   ,"VOD.L"   ,1311544800L,103       ,"NYC-0003VOD.L"),
        ("NYC-0004","chris"   ,"VOD.L"   ,1311544800L,104       ,"NYC-0004VOD.L"),
        ("NYC-0005","chris"   ,"VOD.L"   ,1311544800L,105       ,"NYC-0005VOD.L"),
        ("NYC-0006","chris"   ,"VOD.L"   ,1311544800L,106       ,"NYC-0006VOD.L"),
        ("NYC-0007","chris"   ,"VOD.L"   ,1311544800L,107       ,"NYC-0007VOD.L"),
        ("NYC-0008","chris"   ,"VOD.L"   ,1311544800L,108       ,"NYC-0008VOD.L"),
        ("NYC-0009","chris"   ,"VOD.L"   ,1311544800L,109       ,"NYC-0009VOD.L")
      )
    }

  }

}
