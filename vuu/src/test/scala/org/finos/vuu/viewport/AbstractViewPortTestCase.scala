package org.finos.vuu.viewport

import org.finos.toolbox.jmx.MetricsProvider
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.Clock
import org.finos.vuu.api._
import org.finos.vuu.core.table.{Columns, DataTable, TableContainer}
import org.finos.vuu.feature.inmem.VuuInMemPlugin
import org.finos.vuu.net.ClientSessionId
import org.finos.vuu.plugin.DefaultPluginRegistry
import org.finos.vuu.provider.{JoinTableProviderImpl, MockProvider, ProviderContainer}
import org.finos.vuu.util.OutboundRowPublishQueue
import org.scalatest.featurespec.AnyFeatureSpec

object TestTimeStamp {
  def EPOCH_DEFAULT = 1311544800000L
}

class AbstractViewPortTestCase extends AnyFeatureSpec {


  def filterByVpId(vpUps: Seq[ViewPortUpdate], vp: ViewPort): Seq[ViewPortUpdate] = {
    vpUps.filter(vpu => vpu.vp.id == vp.id)
  }

  def setupViewPort(tableContainer: TableContainer, providerContainer: ProviderContainer)(implicit clock: Clock, metrics: MetricsProvider): ViewPortContainer = {

    val pluginRegistry = new DefaultPluginRegistry
    pluginRegistry.registerPlugin(new VuuInMemPlugin)

    val viewPortContainer = new ViewPortContainer(tableContainer, providerContainer, pluginRegistry)

    viewPortContainer
  }

  def createDefaultViewPortInfra()(implicit clock: Clock, metrics: MetricsProvider): (ViewPortContainer, DataTable, MockProvider, ClientSessionId, OutboundRowPublishQueue) = {
    implicit val lifecycle: LifecycleContainer = new LifecycleContainer

    val ordersDef = TableDef(
      name = "orders",
      keyField = "orderId",
      columns = Columns.fromNames("orderId:String", "trader:String", "ric:String", "tradeTime:Long", "quantity:Int"),
      joinFields = "ric", "orderId")

    val pricesDef = TableDef("prices", "ric", Columns.fromNames("ric:String", "bid:Double", "ask:Double", "last:Double", "open:Double", "close:Double"), "ric")

    val joinDef = JoinTableDef(
      name = "orderPrices",
      visibility = Public,
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

    joinProvider.runOnce()

    val session = ClientSessionId("sess-01", "chris")

    val outQueue = new OutboundRowPublishQueue()

    (viewPortContainer, orders, ordersProvider, session, outQueue)
  }

  def createDefaultViewPortInfraWithPrivateTable()(implicit clock: Clock, metrics: MetricsProvider): (ViewPortContainer, DataTable, MockProvider, ClientSessionId, OutboundRowPublishQueue) = {
    implicit val lifecycle: LifecycleContainer = new LifecycleContainer

    val ordersDef = TableDef(
      name = "orders",
      keyField = "orderId",
      columns = Columns.fromNames("orderId:String", "trader:String", "ric:String", "tradeTime:Long", "quantity:Int"),
      visibility = Private,
      joinFields = "ric", "orderId"
    )

    val pricesDef = TableDef(
      "prices",
      "ric",
      Columns.fromNames("ric:String", "bid:Double", "ask:Double", "last:Double", "open:Double", "close:Double"),
      visibility = Private,
      "ric")

    val joinDef = JoinTableDef(
      name = "orderPrices",
      visibility = Private,
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

    joinProvider.runOnce()

    val session = ClientSessionId("sess-01", "chris")

    val outQueue = new OutboundRowPublishQueue()

    (viewPortContainer, orders, ordersProvider, session, outQueue)
  }

  def createDefaultOrderPricesViewPortInfra()(implicit clock: Clock, metrics: MetricsProvider): (ViewPortContainer, DataTable, MockProvider, DataTable, MockProvider, ClientSessionId, OutboundRowPublishQueue) = {
    implicit val lifecycle: LifecycleContainer = new LifecycleContainer

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
      visibility = Public,
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

    joinProvider.runOnce()

    val session = ClientSessionId("sess-01", "chris")

    val outQueue = new OutboundRowPublishQueue()

    (viewPortContainer, orders, ordersProvider, prices, pricesProvider, session, outQueue)
  }

  def createPricesRow(pricesProvider: MockProvider, ric: String, bid: Double, ask: Double, last: Double, close: Double): Unit = {
    pricesProvider.tick(ric, Map("ric" -> ric, "bid" -> bid, "ask" -> ask, "last" -> last, "close" -> close))
  }

  def createPricesRow(pricesProvider: MockProvider, ric: String, bid: Double, ask: Double, last: Double, close: Double, exchange: String): Unit = {
    pricesProvider.tick(ric, Map("ric" -> ric, "bid" -> bid, "ask" -> ask, "last" -> last, "close" -> close, "exchange" -> exchange))
  }

  def createNOrderRows(ordersProvider: MockProvider, n: Int, ric: String = "VOD.L", idOffset: Int = 0)(implicit clock: Clock): Unit = {
    (0 until n).foreach(i => {
      val iAsString = (idOffset + i).toString
      val orderId = "NYC-" + "0".padTo(4 - iAsString.length, "0").mkString + iAsString
      val quantity = 100 + i
      ordersProvider.tick(orderId, Map("orderId" -> orderId, "trader" -> "chris", "tradeTime" -> clock.now(), "quantity" -> quantity, "ric" -> ric))
      clock.sleep(10)
    })
  }

  def createNOrderRows(ordersProvider: MockProvider, n: Int)(implicit clock: Clock): Unit = {
    (0 until n).foreach(i => {
      val iAsString = i.toString
      val orderId = "NYC-" + "0".padTo(4 - iAsString.length, "0").mkString + iAsString
      val quantity = 100 + i
      ordersProvider.tick(orderId, Map("orderId" -> orderId, "trader" -> "chris", "tradeTime" -> clock.now(), "quantity" -> quantity, "ric" -> "VOD.L"))
      clock.sleep(10)
    })
  }

  def createNOrderRowsNoSleep(ordersProvider: MockProvider, n: Int)(implicit clock: Clock): Unit = {
    (0 until n).foreach(i => {
      val iAsString = i.toString
      val orderId = "NYC-" + "0".padTo(4 - iAsString.length, "0").mkString + iAsString
      val quantity = 100 + i
      ordersProvider.tick(orderId, Map("orderId" -> orderId, "trader" -> "chris", "tradeTime" -> clock.now(), "quantity" -> quantity, "ric" -> "VOD.L"))
      //clock.sleep(10)
    })
  }

  def buildOrderRowUpdate(i: Int, quantity: Int): (String, Map[String, Any]) = {
    val iAsString = i.toString
    val orderId = "NYC-" + "0".padTo(4 - iAsString.length, "0").mkString + iAsString
    val update = Map("orderId" -> orderId, "quantity" -> quantity)
    (orderId, update)
  }


}
