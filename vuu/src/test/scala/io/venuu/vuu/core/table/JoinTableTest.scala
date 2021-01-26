/**
 * Copyright Whitebox Software Ltd. 2014
 * All Rights Reserved.

 * Created by chris on 25/08/15.

 */
package io.venuu.vuu.core.table

import io.venuu.toolbox.jmx.MetricsProviderImpl
import io.venuu.toolbox.lifecycle.LifecycleContainer
import io.venuu.toolbox.time.{DefaultClock, Clock}
import io.venuu.vuu.api._
import io.venuu.vuu.core.table.TableTestHelper._
import io.venuu.vuu.net.ClientSessionId
import io.venuu.vuu.provider.{JoinTableProviderImpl, MockProvider}
import io.venuu.vuu.util.OutboundRowPublishQueue
import io.venuu.vuu.viewport.{DefaultRange, RowProcessor, RowUpdateType, ViewPortContainer}
import org.joda.time.LocalDateTime
import org.scalatest.{FeatureSpec, Matchers}


class JoinTableTest extends FeatureSpec with Matchers {

  implicit val timeProvider: Clock = new DefaultClock
  implicit val metrics = new MetricsProviderImpl

  case class NamedKeyObserver(name: String) extends KeyObserver[RowKeyUpdate]{
    override def onUpdate(update: RowKeyUpdate): Unit = {}
    override def hashCode(): Int = name.hashCode
    override def equals(obj: scala.Any): Boolean = {
      obj.isInstanceOf[NamedKeyObserver] && obj.asInstanceOf[NamedKeyObserver].name == this.name
    }
  }

  feature("check we can create join tables and tick data through"){

    def setupViewPort(tableContainer: TableContainer) = {

      val viewPortContainer = new ViewPortContainer(tableContainer)

      viewPortContainer
    }

    scenario("check a tick all the way through from source to join table"){

      implicit val lifecycle = new LifecycleContainer

      val dateTime = new LocalDateTime(2015, 7, 24, 11, 0).toDateTime.toInstant.getMillis

      val ordersDef = TableDef(
        name = "orders",
        keyField = "orderId",
        columns = Columns.fromNames("orderId:String", "trader:String", "ric:String", "tradeTime:Long", "quantity:Double"),
        joinFields =  "ric", "orderId")

      val pricesDef = TableDef("prices", "ric", Columns.fromNames("ric:String", "bid:Double", "ask:Double", "last:Double", "open:Double", "close:Double"), "ric")

      val joinDef = JoinTableDef(
        name          = "orderPrices",
        baseTable     = ordersDef,
        joinColumns   = Columns.allFrom(ordersDef) ++ Columns.allFromExcept(pricesDef, "ric"),
        joins  =
          JoinTo(
            table = pricesDef,
            joinSpec = JoinSpec( left = "ric", right = "ric", LeftOuterJoin)
          ),
        joinFields = Seq()
      )

      //val joinDef =  JoinTableDef("ordersPrices", ordersDef, pricesDef, JoinSpec("ric", "ric"), Columns.allFrom(ordersDef) ++ Columns.allFromExcept(pricesDef, "ric") )

      val joinProvider   = new JoinTableProviderImpl()

      val tableContainer = new TableContainer(joinProvider)

      val orders = tableContainer.createTable(ordersDef)
      val prices = tableContainer.createTable(pricesDef)
      val orderPrices = tableContainer.createJoinTable(joinDef)

      val ordersProvider = new MockProvider(orders)
      val pricesProvider = new MockProvider(prices)

      val viewPortContainer = setupViewPort(tableContainer)

      joinProvider.start()

      ordersProvider.tick("NYC-0001", Map("orderId" -> "NYC-0001", "trader" -> "chris", "tradeTime" -> dateTime, "quantity" -> 100, "ric" -> "VOD.L"))
      pricesProvider.tick("VOD.L", Map("ric" -> "VOD.L", "bid" -> 220.0, "ask" -> 222.0))

      pricesProvider.tick("BT.L", Map("ric" -> "BT.L", "bid" -> 500.0, "ask" -> 501.0))
      ordersProvider.tick("NYC-0002", Map("orderId" -> "NYC-0002", "trader" -> "chris", "tradeTime" -> dateTime, "quantity" -> 100, "ric" -> "BT.L"))

      joinProvider.runOnce()

      val session = new ClientSessionId("sess-01", "chris")

      val outQueue = new OutboundRowPublishQueue()
      val highPriorityQueue = new OutboundRowPublishQueue()

      val vpcolumns = List("orderId", "trader", "tradeTime", "quantity", "ric").map(orderPrices.getTableDef.columnForName(_)).toList

      val viewPort = viewPortContainer.create(session, outQueue, highPriorityQueue, orderPrices, DefaultRange, vpcolumns)

      viewPortContainer.runOnce()

      val combinedUpdates = combineQs(viewPort)

      combinedUpdates.length should be (3)

      val updates = combinedUpdates.take(2)

      val printToConsoleProcessor = new RowProcessor {
        override def processColumn(column: Column, value: Any): Unit = println(s"Column: ${column.name} = $value")
        override def missingRow(): Unit = println("missing row")

        override def missingRowData(rowKey: String, column: Column): Unit = {}
      }

      updates.filter( vp => vp.vpUpdate == RowUpdateType).foreach(update => update.table.readRow(update.key.key, List("orderId", "trader", "tradeTime", "ric", "bid", "ask"), printToConsoleProcessor ))
    }

    scenario("check that registering and deregistering listeners on join table propagates to source tables"){

      import io.venuu.vuu.viewport.OrdersAndPricesScenarioFixture._

      implicit val lifecycle = new LifecycleContainer

      val dateTime = new LocalDateTime(2015, 7, 24, 11, 0).toDateTime.toInstant.getMillis

      val (joinProvider, orders, prices, orderPrices, ordersProvider, pricesProvider, _) = setup()

      joinProvider.start()

      ordersProvider.tick("NYC-0001", Map("orderId" -> "NYC-0001", "trader" -> "chris", "tradeTime" -> dateTime, "quantity" -> 100, "ric" -> "VOD.L"))
      pricesProvider.tick("VOD.L", Map("ric" -> "VOD.L", "bid" -> 220.0, "ask" -> 222.0))

      pricesProvider.tick("BT.L", Map("ric" -> "BT.L", "bid" -> 500.0, "ask" -> 501.0))
      ordersProvider.tick("NYC-0002", Map("orderId" -> "NYC-0002", "trader" -> "chris", "tradeTime" -> dateTime, "quantity" -> 100, "ric" -> "BT.L"))

      joinProvider.runOnce()

      //this simulates 2 that RDX
      val ko1 = NamedKeyObserver("ko-1")
      val ko2 = NamedKeyObserver("ko-2")

      //first check we don't barf when regsitering a subscriber for a key that doesn't exist
      orderPrices.addKeyObserver("NYC-001", ko1) should be (true)

      orderPrices.addKeyObserver("NYC-0001", ko1) should be (true)
      orderPrices.addKeyObserver("NYC-0001", ko2) should be (false)

      orders.isKeyObservedBy("NYC-0001", ko1) should be (true)
      orders.isKeyObservedBy("NYC-0001", ko2) should be (true)

      orders.isKeyObservedBy("NYC-0002", ko2) should be (false)

      prices.isKeyObservedBy("VOD.L", ko1) should be (true)
      prices.isKeyObservedBy("VOD.L", ko2) should be (true)

      orderPrices.removeKeyObserver("NYC-0001", ko1)
      orders.isKeyObservedBy("NYC-0001", ko1) should be (false)
      prices.isKeyObservedBy("VOD.L", ko1) should be (false)

      orderPrices.addKeyObserver("NYC-0002", ko2)

      ordersProvider.tick("NYC-0002", Map("orderId" -> "NYC-0002", "trader" -> "chris", "tradeTime" -> dateTime, "quantity" -> 100, "ric" -> "VOD.L"))

      joinProvider.runOnce()

      prices.isKeyObservedBy("BT.L", ko2) should be (false)
      prices.isKeyObservedBy("VOD.L", ko2) should be (true)
    }

  }

}
