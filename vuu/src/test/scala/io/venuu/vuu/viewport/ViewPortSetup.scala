package io.venuu.vuu.viewport

import io.venuu.toolbox.jmx.MetricsProvider
import io.venuu.toolbox.lifecycle.LifecycleContainer
import io.venuu.toolbox.time.Clock
import io.venuu.vuu.api._
import io.venuu.vuu.core.table.{Columns, TableContainer}
import io.venuu.vuu.provider.{JoinTableProvider, JoinTableProviderImpl, MockProvider, ProviderContainer}
import io.venuu.vuu.util.{OutboundRowPublishQueue, PublishQueue}
import org.joda.time.LocalDateTime

trait ViewPortSetup {

  import TestTimeStamp.EPOCH_DEFAULT

  def emptyQueues(viewPort: ViewPort) = {
    viewPort.highPriorityQ.popUpTo(1000)
    viewPort.outboundQ.popUpTo(1000)
  }

  def combineQs(queue: PublishQueue[ViewPortUpdate], highPriorityQueue: PublishQueue[ViewPortUpdate]) = {
    highPriorityQueue.popUpTo(20) ++ queue.popUpTo(20)
  }

  def combineQs(viewPort: ViewPort) = {
    (viewPort.highPriorityQ.popUpTo(20) ++ viewPort.outboundQ.popUpTo(20))
  }

  def getQueues = {
    val outQueue          = new OutboundRowPublishQueue()
    val highPriorityQueue = new OutboundRowPublishQueue()
    (outQueue, highPriorityQueue)
  }


  def filterByVpId(vpUps: Seq[ViewPortUpdate], vp: ViewPort): Seq[ViewPortUpdate] = {
    vpUps.filter( vpu => vpu.vp.id == vp.id )
  }

  def runContainersOnce(viewPortContainer: ViewPortContainer, joinProvider : JoinTableProvider) = {
    joinProvider.runOnce()
    viewPortContainer.runOnce()
    viewPortContainer.runGroupByOnce()
  }

  def tickInData(ordersProvider: MockProvider, pricesProvider: MockProvider): Unit = {
    ordersProvider.tick("NYC-0001", Map("orderId" -> "NYC-0001", "trader" -> "chris", "tradeTime" -> EPOCH_DEFAULT, "quantity" -> 100, "ric" -> "VOD.L"))
    ordersProvider.tick("NYC-0002", Map("orderId" -> "NYC-0002", "trader" -> "chris", "tradeTime" -> EPOCH_DEFAULT, "quantity" -> 200, "ric" -> "VOD.L"))
    ordersProvider.tick("NYC-0003", Map("orderId" -> "NYC-0003", "trader" -> "chris", "tradeTime" -> EPOCH_DEFAULT, "quantity" -> 300, "ric" -> "VOD.L"))
    ordersProvider.tick("NYC-0004", Map("orderId" -> "NYC-0004", "trader" -> "chris", "tradeTime" -> EPOCH_DEFAULT, "quantity" -> 400, "ric" -> "VOD.L"))
    ordersProvider.tick("NYC-0005", Map("orderId" -> "NYC-0005", "trader" -> "chris", "tradeTime" -> EPOCH_DEFAULT, "quantity" -> 500, "ric" -> "VOD.L"))
    ordersProvider.tick("NYC-0006", Map("orderId" -> "NYC-0006", "trader" -> "steve", "tradeTime" -> EPOCH_DEFAULT, "quantity" -> 600, "ric" -> "VOD.L"))
    ordersProvider.tick("NYC-0007", Map("orderId" -> "NYC-0007", "trader" -> "steve", "tradeTime" -> EPOCH_DEFAULT, "quantity" -> 1000, "ric" -> "BT.L"))
    ordersProvider.tick("NYC-0008", Map("orderId" -> "NYC-0008", "trader" -> "steve", "tradeTime" -> EPOCH_DEFAULT, "quantity" -> 500, "ric" -> "BT.L"))

    pricesProvider.tick("VOD.L", Map("ric" -> "VOD.L", "bid" -> 220.0, "ask" -> 222.0))
    pricesProvider.tick("BT.L", Map("ric" -> "BT.L", "bid" -> 500.0, "ask" -> 501.0))
  }

  def setup()(implicit lifecycleContainer: LifecycleContainer, timeProvider: Clock, metrics : MetricsProvider) = {

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

    val joinProvider   = JoinTableProviderImpl()//new EsperJoinTableProviderImpl()

    val tableContainer = new TableContainer(joinProvider)

    val orders = tableContainer.createTable(ordersDef)
    val prices = tableContainer.createTable(pricesDef)
    val orderPrices = tableContainer.createJoinTable(joinDef)

    val ordersProvider = new MockProvider(orders)
    val pricesProvider = new MockProvider(prices)

    val providerContainer = new ProviderContainer(joinProvider)

    val viewPortContainer = new ViewPortContainer(tableContainer, providerContainer)

    //val viewPortContainer = setupViewPort()

    //joinProvider.start()

    (joinProvider, orders, prices, orderPrices, ordersProvider, pricesProvider, viewPortContainer)
  }

}
