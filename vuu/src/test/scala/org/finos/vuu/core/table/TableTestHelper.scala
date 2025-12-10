package org.finos.vuu.core.table

import org.finos.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.{Clock, TestFriendlyClock}
import org.finos.vuu.api._
import org.finos.vuu.provider.{JoinTableProvider, JoinTableProviderImpl, MockProvider}
import org.finos.vuu.util.{OutboundRowPublishQueue, PublishQueue}
import org.finos.vuu.viewport.{ViewPort, ViewPortUpdate}

object TableTestHelper {

  def emptyQueues(viewPort: ViewPort): Seq[ViewPortUpdate] = {
    viewPort.outboundQ.popUpTo(1000)
  }

  def combineQs(queue: PublishQueue[ViewPortUpdate]): Seq[ViewPortUpdate] = {
    queue.popUpTo(100)
  }

  def combineQs(viewPort: ViewPort): Seq[ViewPortUpdate] = {
    viewPort.outboundQ.popUpTo(100)
  }

  def getQueues: OutboundRowPublishQueue = {
    val outQueue = new OutboundRowPublishQueue()
    outQueue
  }

  def createOrderPricesScenario(): (DataTable, DataTable, DataTable, MockProvider, MockProvider, JoinTableProvider) = {

    implicit val clock: Clock = new TestFriendlyClock(100000000L)
    implicit val lifecycle: LifecycleContainer = new LifecycleContainer
    implicit val metrics: MetricsProvider = new MetricsProviderImpl

    val ordersDef = TableDef(
      name = "orders",
      keyField = "orderId",
      columns = Columns.fromNames("orderId:String", "trader:String", "ric:String", "tradeTime:Long", "quantity:Double"),
      joinFields = "ric", "orderId")

    val pricesDef = TableDef("prices", "ric", Columns.fromNames("ric:String", "bid:Double", "ask:Double", "last:Double", "open:Double", "close:Double"), "ric")

    val joinDef = JoinTableDef(
      name = "orderPrices",
      baseTable = ordersDef,
      joinColumns = Columns.allFrom(ordersDef) ++ Columns.allFromExceptDefaultAnd(pricesDef, "ric"),
      joins =
        JoinTo(
          table = pricesDef,
          joinSpec = JoinSpec(left = "ric", right = "ric", LeftOuterJoin)
        ),
      links = VisualLinks(),
      joinFields = Seq()
    )

    //val joinDef =  JoinTableDef("ordersPrices", ordersDef, pricesDef, JoinSpec("ric", "ric"), Columns.allFrom(ordersDef) ++ Columns.allFromExcept(pricesDef, "ric") )

    val joinProvider = JoinTableProviderImpl()

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
