package io.venuu.vuu.viewport

import io.venuu.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import io.venuu.toolbox.lifecycle.LifecycleContainer
import io.venuu.toolbox.time.{Clock, TestFriendlyClock}
import io.venuu.vuu.api._
import io.venuu.vuu.core.table.{Columns, TableContainer}
import io.venuu.vuu.net.ClientSessionId
import io.venuu.vuu.provider.{JoinTableProviderImpl, MockProvider}
import io.venuu.vuu.util.OutboundRowPublishQueue
import org.scalatest.FeatureSpec


class AbstractViewPortTestCase extends FeatureSpec {

  implicit val timeProvider: Clock = new TestFriendlyClock(1311544800)
  implicit val metrics: MetricsProvider = new MetricsProviderImpl

  def setupViewPort(tableContainer: TableContainer) = {

    val viewPortContainer = new ViewPortContainer(tableContainer)

    viewPortContainer
  }

  def createDefaultViewPortInfra() = {
    implicit val lifecycle = new LifecycleContainer

    val dateTime = 1437728400000l//new LocalDateTime(2015, 7, 24, 11, 0).toDateTime.toInstant.getMillis

    val ordersDef = TableDef(
    name = "orders",
    keyField = "orderId",
    columns = Columns.fromNames("orderId:String", "trader:String", "ric:String", "tradeTime:Long", "quantity:Int"),
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

    val joinProvider   = new JoinTableProviderImpl()

    val tableContainer = new TableContainer(joinProvider)

    val orders = tableContainer.createTable(ordersDef)
    val prices = tableContainer.createTable(pricesDef)
    val orderPrices = tableContainer.createJoinTable(joinDef)

    val ordersProvider = new MockProvider(orders)
    val pricesProvider = new MockProvider(prices)

    val viewPortContainer = setupViewPort(tableContainer)

    joinProvider.start()

//    ordersProvider.tick("NYC-0001", Map("orderId" -> "NYC-0001", "trader" -> "chris", "tradeTime" -> dateTime, "quantity" -> 100, "ric" -> "VOD.L"))
//    pricesProvider.tick("VOD.L", Map("ric" -> "VOD.L", "bid" -> 220.0, "ask" -> 222.0, "last" -> 30))
//
//    pricesProvider.tick("BT.L", Map("ric" -> "BT.L", "bid" -> 500.0, "ask" -> 501.0, "last" -> 40))
//    ordersProvider.tick("NYC-0002", Map("orderId" -> "NYC-0002", "trader" -> "chris", "tradeTime" -> dateTime, "quantity" -> 100, "ric" -> "BT.L"))

    joinProvider.runOnce()

    val session = new ClientSessionId("sess-01", "chris")

    val outQueue = new OutboundRowPublishQueue()
    val highPriorityQueue = new OutboundRowPublishQueue()

    (viewPortContainer, orders, ordersProvider, session, outQueue, highPriorityQueue)
  }

  def createNOrderRows(ordersProvider: MockProvider, n: Int)(implicit clock: Clock) = {
    (0 to n - 1).foreach( i=>{
      val iAsString = i.toString
      val orderId = "NYC-" + "0".padTo(4 - iAsString.length, "0").mkString + iAsString
      val quantity = 100 + i
      ordersProvider.tick(orderId, Map("orderId" -> orderId, "trader" -> "chris", "tradeTime" -> clock.now(), "quantity" -> quantity, "ric" -> "VOD.L"))
      clock.sleep(10)
    })

  }


}
