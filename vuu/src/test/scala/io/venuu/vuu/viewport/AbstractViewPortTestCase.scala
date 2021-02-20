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

    joinProvider.runOnce()

    val session = new ClientSessionId("sess-01", "chris")

    val outQueue = new OutboundRowPublishQueue()
    val highPriorityQueue = new OutboundRowPublishQueue()

    (viewPortContainer, orders, ordersProvider, session, outQueue, highPriorityQueue)
  }

  def createDefaultOrderPricesViewPortInfra() = {
    implicit val lifecycle = new LifecycleContainer

    val dateTime = 1437728400000l//new LocalDateTime(2015, 7, 24, 11, 0).toDateTime.toInstant.getMillis

    val ordersDef = TableDef(
      name = "orders",
      keyField = "orderId",
      columns = Columns.fromNames("orderId:String", "trader:String", "ric:String", "tradeTime:Long", "quantity:Int"),
      links = VisualLinks(
        Link("ric", "prices", "ric")
      ),
      joinFields =  "ric", "orderId"
    )

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

    joinProvider.runOnce()

    val session = new ClientSessionId("sess-01", "chris")

    val outQueue = new OutboundRowPublishQueue()
    val highPriorityQueue = new OutboundRowPublishQueue()

    (viewPortContainer, orders, ordersProvider, prices, pricesProvider, session, outQueue, highPriorityQueue)
  }

  def createPricesRow(pricesProvider: MockProvider, ric: String, bid: Double, ask: Double, last: Double, close: Double) = {
    pricesProvider.tick(ric, Map("ric" -> ric, "bid" -> bid, "ask" -> ask, "last" -> last, "close" -> close))
  }

  def createNOrderRows(ordersProvider: MockProvider, n: Int, ric: String = "VOD.L", idOffset: Int = 0)(implicit clock: Clock) = {
    (0 to n - 1).foreach( i=>{
      val iAsString = (idOffset + i).toString
      val orderId = "NYC-" + "0".padTo(4 - iAsString.length, "0").mkString + iAsString
      val quantity = 100 + i
      ordersProvider.tick(orderId, Map("orderId" -> orderId, "trader" -> "chris", "tradeTime" -> clock.now(), "quantity" -> quantity, "ric" -> ric))
      clock.sleep(10)
    })
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

  def buildOrderRowUpdate(i : Int, quantity: Int): (String, Map[String, Any]) = {
    val iAsString = i.toString
    val orderId = "NYC-" + "0".padTo(4 - iAsString.length, "0").mkString + iAsString
    val update = Map("orderId" -> orderId, "quantity" -> quantity)
    (orderId, update)
  }


}
