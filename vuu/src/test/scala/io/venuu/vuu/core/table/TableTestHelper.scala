package io.venuu.vuu.core.table

import io.venuu.toolbox.jmx.MetricsProviderImpl
import io.venuu.toolbox.lifecycle.LifecycleContainer
import io.venuu.toolbox.time.TestFriendlyClock
import io.venuu.vuu.api._
import io.venuu.vuu.provider.{JoinTableProviderImpl, MockProvider}
import io.venuu.vuu.util.{OutboundRowPublishQueue, PublishQueue}
import io.venuu.vuu.viewport.{ViewPort, ViewPortUpdate}

/**
  * Created by chris on 22/12/2015.
  */
object TableTestHelper {

  def emptyQueues(viewPort: ViewPort) = {
    viewPort.highPriorityQ.popUpTo(1000)
    viewPort.outboundQ.popUpTo(1000)
  }

  def combineQs(queue: PublishQueue[ViewPortUpdate], highPriorityQueue: PublishQueue[ViewPortUpdate]) = {
    highPriorityQueue.popUpTo(20) ++ queue.popUpTo(20)
  }

  def combineQs(viewPort: ViewPort) = {
    viewPort.highPriorityQ.popUpTo(20) ++ viewPort.outboundQ.popUpTo(20)
  }

  def getQueues = {
    val outQueue          = new OutboundRowPublishQueue()
    val highPriorityQueue = new OutboundRowPublishQueue()
    (outQueue, highPriorityQueue)
  }

  def createOrderPricesScenario() = {

    implicit val lifecycle = new LifecycleContainer
    implicit val timeProvider = new TestFriendlyClock(100001l)
    implicit val metrics = new MetricsProviderImpl

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
    val prices = tableContainer.createAutoSubscribeTable(pricesDef)
    val orderPrices = tableContainer.createJoinTable(joinDef)

    val ordersProvider = new MockProvider(orders)
    val pricesProvider = new MockProvider(prices)

    orders.setProvider(ordersProvider)
    prices.setProvider(pricesProvider)

    (orders, prices, orderPrices, ordersProvider, pricesProvider, joinProvider)
  }

}
