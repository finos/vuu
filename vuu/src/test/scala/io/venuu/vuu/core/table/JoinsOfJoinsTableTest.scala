package io.venuu.vuu.core.table

import io.venuu.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import io.venuu.toolbox.lifecycle.LifecycleContainer
import io.venuu.toolbox.time.{Clock, DefaultClock}
import io.venuu.vuu.api._
import io.venuu.vuu.client.messages.RequestId
import io.venuu.vuu.net.ClientSessionId
import io.venuu.vuu.provider.{JoinTableProviderImpl, MockProvider, ProviderContainer}
import io.venuu.vuu.util.OutboundRowPublishQueue
import io.venuu.vuu.util.table.TableAsserts.assertVpEq
import io.venuu.vuu.viewport.{DefaultRange, RowProcessor, RowUpdateType, ViewPortContainer, ViewPortSetup}
import org.joda.time.LocalDateTime
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers
import org.scalatest.prop.Tables.Table

/**
  * This fixture deals with the scenario where we want to create a table
  * that is the join of Instruments and Prices (InstrumentPrices)
  * and then we want to create a subsequent join which is InstrumentPrices to FxRates.
  * This involves being able to base join tables onto of existing Join tables.
  *
  */
class JoinsOfJoinsTableTest extends AnyFeatureSpec with Matchers with ViewPortSetup{

  implicit val timeProvider: Clock = new DefaultClock
  implicit val lifecycle: LifecycleContainer = new LifecycleContainer
  implicit val metrics: MetricsProvider = new MetricsProviderImpl

  import TableTestHelper._

  def setupViewPort(tableContainer: TableContainer, providerContainer: ProviderContainer): ViewPortContainer = {

    val viewPortContainer = new ViewPortContainer(tableContainer, providerContainer)

    viewPortContainer
  }

  Scenario("check a tick all the way through from source to join table"){

    val dateTime = 1437728400000L

    val ordersDef = TableDef(
      name = "orders",
      keyField = "orderId",
      columns = Columns.fromNames("orderId:String", "trader:String", "ric:String", "tradeTime:Long", "quantity:Double", "ccyCross:String"),
      joinFields =  "ric", "orderId", "ccyCross")

    val pricesDef = TableDef("prices", "ric", Columns.fromNames("ric:String", "bid:Double", "ask:Double", "last:Double", "open:Double", "close:Double"), "ric")

    val fxDef = TableDef("fx", "cross", Columns.fromNames("cross:String", "fxbid:Double", "fxask:Double"), "cross")

    val joinDef = JoinTableDef(
      name          = "orderPrices",
      baseTable     = ordersDef,
      joinColumns   = Columns.allFrom(ordersDef) ++ Columns.allFromExcept(pricesDef, "ric"),
      joins  =
        JoinTo(
          table = pricesDef,
          joinSpec = JoinSpec( left = "ric", right = "ric", LeftOuterJoin)
      ),
      joinFields = Seq("ccyCross", "orderId")
    )

    val joinDefFx = JoinTableDef(
      name          = "orderPricesFx",
      baseTable     = ordersDef,
      joinColumns   = Columns.allFrom(ordersDef) ++ Columns.allFromExcept(pricesDef, "ric") ++ Columns.allFrom(fxDef),
      joinFields = Seq("ccyCross", "orderId"),
        JoinTo(
          table = pricesDef,
          joinSpec = JoinSpec( left = "ric", right = "ric", LeftOuterJoin)
        ),
      JoinTo(
        table = fxDef,
        joinSpec = JoinSpec( left = "ccyCross", right = "cross", LeftOuterJoin)
      )
    )

    val joinProvider   = JoinTableProviderImpl()

    val tableContainer = new TableContainer(joinProvider)

    val orders = tableContainer.createTable(ordersDef)
    val prices = tableContainer.createTable(pricesDef)
    val fx = tableContainer.createTable(fxDef)

    val orderPrices = tableContainer.createJoinTable(joinDef)
    val orderPricesFx = tableContainer.createJoinTable(joinDefFx)

    val ordersProvider = new MockProvider(orders)
    val pricesProvider = new MockProvider(prices)
    val fxProvider = new MockProvider(fx)

    val providerContainer = new ProviderContainer(joinProvider)

    val viewPortContainer = setupViewPort(tableContainer, providerContainer)

    joinProvider.start()

    fxProvider.tick("USDGBP", Map("cross" -> "USDGBP", "fxbid" -> 0.703, "fxask" -> 0.703))
    fxProvider.tick("USDEUR", Map("cross" -> "USDEUR", "fxbid" -> 1.213, "fxask" -> 1.223))

    ordersProvider.tick("NYC-0001", Map("orderId" -> "NYC-0001", "trader" -> "chris", "tradeTime" -> dateTime, "quantity" -> 100, "ric" -> "VOD.L", "ccyCross" -> "USDGBP"))
    pricesProvider.tick("VOD.L", Map("ric" -> "VOD.L", "bid" -> 220.0, "ask" -> 222.0))

    pricesProvider.tick("BT.L", Map("ric" -> "BT.L", "bid" -> 500.0, "ask" -> 501.0))
    ordersProvider.tick("NYC-0002", Map("orderId" -> "NYC-0002", "trader" -> "chris", "tradeTime" -> dateTime, "quantity" -> 100, "ric" -> "BT.L", "ccyCross" -> "USDEUR"))

    joinProvider.runOnce()

    val session = ClientSessionId("sess-01", "chris")

    val outQueue = new OutboundRowPublishQueue()
    val highPriorityQueue = new OutboundRowPublishQueue()

    val vpcolumns = List("orderId", "trader", "tradeTime", "quantity", "ric", "fxbid", "fxask").map(orderPricesFx.getTableDef.columnForName(_))

    val viewPort = viewPortContainer.create(RequestId.oneNew(), session, outQueue, highPriorityQueue, orderPricesFx, DefaultRange, vpcolumns)

    viewPortContainer.runOnce()

    assertVpEq(filterByVpId(combineQs(viewPort), viewPort)){
      Table(
        ("orderId" ,"trader"  ,"tradeTime","quantity","ric"     ,"fxbid"   ,"fxask"   ),
        ("NYC-0001","chris"   ,1437728400000L,100       ,"VOD.L"   ,0.703     ,0.703     ),
        ("NYC-0002","chris"   ,1437728400000L,100       ,"BT.L"    ,1.213     ,1.223     )
      )
    }
  }

}
