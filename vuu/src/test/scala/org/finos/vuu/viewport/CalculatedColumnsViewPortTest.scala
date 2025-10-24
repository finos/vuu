package org.finos.vuu.viewport

import org.finos.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.{Clock, TestFriendlyClock}
import org.finos.vuu.api.{JoinSpec, JoinTableDef, JoinTo, LeftOuterJoin, TableDef, VisualLinks}
import org.finos.vuu.client.messages.RequestId
import org.finos.vuu.core.table.TableTestHelper.combineQs
import org.finos.vuu.core.table.{Columns, TableContainer, ViewPortColumnCreator}
import org.finos.vuu.net.ClientSessionId
import org.finos.vuu.provider.{JoinTableProviderImpl, MockProvider, ProviderContainer}
import org.finos.vuu.util.OutboundRowPublishQueue
import org.finos.vuu.util.table.TableAsserts.{assertVpEq}
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
          ("orderId", "trader", "ric", "tradeTime", "quantity", "logicTest"),
          ("NYC-0000", "chris", "VOD.L", 1311544800000L, 100, null),
          ("NYC-0001", "chris", "VOD.L", 1311544800000L, 101, null),
          ("NYC-0002", "chris", "VOD.L", 1311544800000L, 102, null),
          ("NYC-0003", "chris", "VOD.L", 1311544800000L, 103, null),
          ("NYC-0004", "chris", "VOD.L", 1311544800000L, 104, null),
          ("NYC-0005", "chris", "VOD.L", 1311544800000L, 105, null),
          ("NYC-0006", "chris", "VOD.L", 1311544800000L, 106, null),
          ("NYC-0007", "chris", "VOD.L", 1311544800000L, 107, null),
          ("NYC-0008", "chris", "VOD.L", 1311544800000L, 108, null),
          ("NYC-0009", "chris", "VOD.L", 1311544800000L, 109, null)
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
          ("orderId", "trader", "ric", "tradeTime", "quantity", "logicTest"),
          ("NYC-0000", "chris", "VOD.L", 1311544800000L, 100, "Boo"),
          ("NYC-0001", "chris", "VOD.L", 1311544800000L, 101, "Boo"),
          ("NYC-0002", "chris", "VOD.L", 1311544800000L, 102, "Boo"),
          ("NYC-0003", "chris", "VOD.L", 1311544800000L, 103, "Boo"),
          ("NYC-0004", "chris", "VOD.L", 1311544800000L, 104, "Boo"),
          ("NYC-0005", "chris", "VOD.L", 1311544800000L, 105, "Boo"),
          ("NYC-0006", "chris", "VOD.L", 1311544800000L, 106, "Boo"),
          ("NYC-0007", "chris", "VOD.L", 1311544800000L, 107, "Boo"),
          ("NYC-0008", "chris", "VOD.L", 1311544800000L, 108, "Boo"),
          ("NYC-0009", "chris", "VOD.L", 1311544800000L, 109, "Yay")
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
          ("orderId", "trader", "ric", "tradeTime", "quantity", "quantityTimes100"),
          ("NYC-0000", "chris", "VOD.L", 1311544800000L, 100, 10000),
          ("NYC-0001", "chris", "VOD.L", 1311544800000L, 101, 10100),
          ("NYC-0002", "chris", "VOD.L", 1311544800000L, 102, 10200),
          ("NYC-0003", "chris", "VOD.L", 1311544800000L, 103, 10300),
          ("NYC-0004", "chris", "VOD.L", 1311544800000L, 104, 10400),
          ("NYC-0005", "chris", "VOD.L", 1311544800000L, 105, 10500),
          ("NYC-0006", "chris", "VOD.L", 1311544800000L, 106, 10600),
          ("NYC-0007", "chris", "VOD.L", 1311544800000L, 107, 10700),
          ("NYC-0008", "chris", "VOD.L", 1311544800000L, 108, 10800),
          ("NYC-0009", "chris", "VOD.L", 1311544800000L, 109, 10900)
        )
      }


      val viewPortColumns2 = ViewPortColumnCreator.create(orders, List("orderId", "trader", "tradeTime", "quantity", "ric", "textConcat:String:=concatenate(orderId, ric)"))

      val viewPort2 = viewPortContainer.change(RequestId.oneNew(), session, viewPort.id, ViewPortRange(0, 10), viewPortColumns2)

      viewPortContainer.runOnce()

      val combinedUpdates2 = combineQs(viewPort2)

      assertVpEq(combinedUpdates2) {
        Table(
          ("orderId", "trader", "ric", "tradeTime", "quantity", "textConcat"),
          ("NYC-0000", "chris", "VOD.L", 1311544800000L, 100, "NYC-0000VOD.L"),
          ("NYC-0001", "chris", "VOD.L", 1311544800000L, 101, "NYC-0001VOD.L"),
          ("NYC-0002", "chris", "VOD.L", 1311544800000L, 102, "NYC-0002VOD.L"),
          ("NYC-0003", "chris", "VOD.L", 1311544800000L, 103, "NYC-0003VOD.L"),
          ("NYC-0004", "chris", "VOD.L", 1311544800000L, 104, "NYC-0004VOD.L"),
          ("NYC-0005", "chris", "VOD.L", 1311544800000L, 105, "NYC-0005VOD.L"),
          ("NYC-0006", "chris", "VOD.L", 1311544800000L, 106, "NYC-0006VOD.L"),
          ("NYC-0007", "chris", "VOD.L", 1311544800000L, 107, "NYC-0007VOD.L"),
          ("NYC-0008", "chris", "VOD.L", 1311544800000L, 108, "NYC-0008VOD.L"),
          ("NYC-0009", "chris", "VOD.L", 1311544800000L, 109, "NYC-0009VOD.L")
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
          ("orderId", "trader", "ric", "tradeTime", "quantity"),
          ("NYC-0000", "chris", "VOD.L", 1311544800000L, 100),
          ("NYC-0001", "chris", "VOD.L", 1311544800000L, 101),
          ("NYC-0002", "chris", "VOD.L", 1311544800000L, 102),
          ("NYC-0003", "chris", "VOD.L", 1311544800000L, 103),
          ("NYC-0004", "chris", "VOD.L", 1311544800000L, 104),
          ("NYC-0005", "chris", "VOD.L", 1311544800000L, 105),
          ("NYC-0006", "chris", "VOD.L", 1311544800000L, 106),
          ("NYC-0007", "chris", "VOD.L", 1311544800000L, 107),
          ("NYC-0008", "chris", "VOD.L", 1311544800000L, 108),
          ("NYC-0009", "chris", "VOD.L", 1311544800000L, 109)
        )
      }

      val amendViewPortColumns = ViewPortColumnCreator.create(orders, List("orderId", "trader", "tradeTime", "quantity", "ric", "textConcat:String:=concatenate(orderId, ric)"))

      val amendViewPort = viewPortContainer.change(RequestId.oneNew(), session, viewPort.id, ViewPortRange(0, 10), amendViewPortColumns)

      val combinedUpdates2 = combineQs(amendViewPort)

      assertVpEq(combinedUpdates2) {
        Table(
          ("orderId", "trader", "ric", "tradeTime", "quantity", "textConcat"),
          ("NYC-0000", "chris", "VOD.L", 1311544800000L, 100, "NYC-0000VOD.L"),
          ("NYC-0001", "chris", "VOD.L", 1311544800000L, 101, "NYC-0001VOD.L"),
          ("NYC-0002", "chris", "VOD.L", 1311544800000L, 102, "NYC-0002VOD.L"),
          ("NYC-0003", "chris", "VOD.L", 1311544800000L, 103, "NYC-0003VOD.L"),
          ("NYC-0004", "chris", "VOD.L", 1311544800000L, 104, "NYC-0004VOD.L"),
          ("NYC-0005", "chris", "VOD.L", 1311544800000L, 105, "NYC-0005VOD.L"),
          ("NYC-0006", "chris", "VOD.L", 1311544800000L, 106, "NYC-0006VOD.L"),
          ("NYC-0007", "chris", "VOD.L", 1311544800000L, 107, "NYC-0007VOD.L"),
          ("NYC-0008", "chris", "VOD.L", 1311544800000L, 108, "NYC-0008VOD.L"),
          ("NYC-0009", "chris", "VOD.L", 1311544800000L, 109, "NYC-0009VOD.L")
        )
      }

    }

    Scenario("Check calc columns on joined tables") {

      implicit val lifecycle: LifecycleContainer = new LifecycleContainer

      val dateTime = 1437728400000L

      val ordersDef = TableDef(
        name = "orders",
        keyField = "orderId",
        columns = Columns.fromNames("orderId:String", "trader:String", "ric:String", "tradeTime:Long", "quantity:Double"),
        joinFields = "ric", "orderId")

      val pricesDef = TableDef("prices", "ric", Columns.fromNames("ric:String", "bid:Double", "ask:Double", "last:Double", "open:Double", "close:Double"), "ric")

      val joinDef = JoinTableDef(
        name = "orderPrices",
        baseTable = ordersDef,
        joinColumns = Columns.allFrom(ordersDef) ++ Columns.allFromExcept(pricesDef, "ric"),
        joins =
          JoinTo(
            table = pricesDef,
            joinSpec = JoinSpec(left = "ric", right = "ric", LeftOuterJoin)
          ),
        links = VisualLinks(),
        joinFields = Seq()
      )

      val joinProvider = JoinTableProviderImpl()

      val tableContainer = new TableContainer(joinProvider)

      val orders = tableContainer.createTable(ordersDef)
      val prices = tableContainer.createTable(pricesDef)
      val orderPrices = tableContainer.createJoinTable(joinDef)

      val ordersProvider = new MockProvider(orders)
      val pricesProvider = new MockProvider(prices)

      val providerContainer = new ProviderContainer(joinProvider)

      val viewPortContainer = setupViewPort(tableContainer, providerContainer)

      joinProvider.start()

      ordersProvider.tick("NYC-0001", Map("orderId" -> "NYC-0001", "trader" -> "chris", "tradeTime" -> dateTime, "quantity" -> 100D, "ric" -> "VOD.L"))
      pricesProvider.tick("VOD.L", Map("ric" -> "VOD.L", "bid" -> 220.0, "ask" -> 222.0, "last" -> 30))

      pricesProvider.tick("BT.L", Map("ric" -> "BT.L", "bid" -> 500.0, "ask" -> 501.0, "last" -> 40))
      ordersProvider.tick("NYC-0002", Map("orderId" -> "NYC-0002", "trader" -> "chris", "tradeTime" -> dateTime, "quantity" -> 100D, "ric" -> "BT.L"))

      joinProvider.runOnce()

      val session = ClientSessionId("sess-01", "chris", "channel")

      val outQueue = new OutboundRowPublishQueue()

      val vpcolumns = ViewPortColumnCreator.create(orderPrices, List("orderId", "trader", "tradeTime", "quantity", "ric", "bid", "ask", "qtyBid:Double:=quantity * bid")) //.map(orderPrices.getTableDef.columnForName(_)).toList

      val viewPort = viewPortContainer.create(RequestId.oneNew(), session, outQueue, orderPrices, DefaultRange, vpcolumns)

      viewPortContainer.runOnce()

      val combinedUpdates = combineQs(viewPort)

      When("we pull rows with a calc column as array we don't get a failure")
      val rows = combinedUpdates
        .filter(vpu => vpu.vpUpdate == RowUpdateType)
        .map(vpu => orderPrices.pullRowAsArray(vpu.key.key, vpcolumns).toList )
        .toList

      rows should equal(List(
        List("NYC-0001", "chris", 1437728400000L, 100.0D, "VOD.L", 220.0D, 222.0D, 22000.0D),
        List("NYC-0002", "chris", 1437728400000L, 100.0D, "BT.L", 500.0D, 501.0D, 50000.0D),
      ))
    }
  }
}

