package org.finos.vuu.viewport.sessiontable

import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.vuu.api._
import org.finos.vuu.core.table.{Columns, TableContainer}
import org.finos.vuu.net.ClientSessionId
import org.finos.vuu.provider.{JoinTableProviderImpl, MockProvider, ProviderContainer}
import org.finos.vuu.util.OutboundRowPublishQueue
import org.finos.vuu.viewport.AbstractViewPortTestCase
import org.scalatest.GivenWhenThen
import org.scalatest.matchers.should.Matchers

class SessionTableViewportTest extends AbstractViewPortTestCase with Matchers with GivenWhenThen {

  def createDefaultSessionTableInfra() = {
    implicit val lifecycle = new LifecycleContainer

    val dateTime = 1437728400000l //new LocalDateTime(2015, 7, 24, 11, 0).toDateTime.toInstant.getMillis

    val ordersDef = TableDef(
      name = "orders",
      keyField = "orderId",
      columns = Columns.fromNames("orderId:String", "trader:String", "ric:String", "tradeTime:Long", "quantity:Int"),
      links = VisualLinks(
        Link("ric", "prices", "ric")
      ),
      indices = Indices(
        Index("ric")
      ),
      joinFields = "ric", "orderId"
    )

    val pricesDef = TableDef("prices", "ric", Columns.fromNames("ric:String", "bid:Double", "ask:Double", "last:Double", "open:Double", "close:Double", "exchange:String"), "ric")

    val joinDef = JoinTableDef(
      name = "orderPrices",
      baseTable = ordersDef,
      joinColumns = Columns.allFrom(ordersDef) ++ Columns.allFromExcept(pricesDef, "ric"),
      joins =
        JoinTo(
          table = pricesDef,
          joinSpec = JoinSpec(left = "ric", right = "ric", LeftOuterJoin)
        ),
      joinFields = Seq()
    )

    val basketOrders = SessionTableDef(
      name = "basketOrders",
      keyField = "clientOrderId",
      columns = Columns.fromNames("clientOrderId:String", "orderId:String", "ric:String", "lastModifiedTime:Long", "quantity:Int", "price:Long", "priceType:String")
    )

    val basketOrdersPrices = JoinSessionTableDef(
      name = "basketOrdersPrices",
      keyField = "clientOrderId",
      columns = Columns.fromNames("clientOrderId:String", "orderId:String", "ric:String", "lastModifiedTime:Long", "quantity:Int", "price:Long", "priceType:String")
    )

    val joinProvider = JoinTableProviderImpl() // new EsperJoinTableProviderImpl()

    val tableContainer = new TableContainer(joinProvider)

    val orders = tableContainer.createTable(ordersDef)
    val prices = tableContainer.createTable(pricesDef)
    val orderPrices = tableContainer.createJoinTable(joinDef)

    val ordersProvider = new MockProvider(orders)
    val pricesProvider = new MockProvider(prices)

    val providerContainer = new ProviderContainer(joinProvider)

    val viewPortContainer = setupViewPort(tableContainer, providerContainer)

    joinProvider.start()

    joinProvider.runOnce()

    val session = ClientSessionId("sess-01", "chris")

    val outQueue = new OutboundRowPublishQueue()
    val highPriorityQueue = new OutboundRowPublishQueue()

    (viewPortContainer, orders, ordersProvider, prices, pricesProvider, session, outQueue, highPriorityQueue)
  }

  Feature("Viewports on session tables"){

    Scenario("Create a session table when a new viewport is created"){



    }

  }


}
