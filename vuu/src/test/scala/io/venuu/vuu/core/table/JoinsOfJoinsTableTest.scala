/**
  * Copyright Whitebox Software Ltd. 2014
  * All Rights Reserved.

  * Created by chris on 06/01/2016.

  */
package io.venuu.vuu.core.table

import io.venuu.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import io.venuu.toolbox.lifecycle.LifecycleContainer
import io.venuu.toolbox.time.{DefaultClock, Clock}
import io.venuu.vuu.api._
import io.venuu.vuu.net.ClientSessionId
import io.venuu.vuu.provider.{JoinTableProviderImpl, MockProvider}
import io.venuu.vuu.util.OutboundRowPublishQueue
import io.venuu.vuu.viewport.{DefaultRange, RowProcessor, RowUpdateType, ViewPortContainer}
import org.joda.time.LocalDateTime
import org.scalatest._

/**
  * This fixture deals with the scenario where we want to create a table
  * that is the join of Instruments and Prices (InstrumentPrices)
  * and then we want to create a subsequent join which is InstrumentPrices to FxRates.
  * This involves being able to base join tables onto of existing Join tables.
  *
  */
class JoinsOfJoinsTableTest extends FeatureSpec with Matchers {

  implicit val lifecycle = new LifecycleContainer
  implicit val timeProvider: Clock = new DefaultClock
  implicit val metrics: MetricsProvider = new MetricsProviderImpl

  import TableTestHelper._

  def setupViewPort(tableContainer: TableContainer) = {

    val viewPortContainer = new ViewPortContainer(tableContainer)

    viewPortContainer
  }

  scenario("check a tick all the way through from source to join table"){

    val dateTime = new LocalDateTime(2015, 7, 24, 11, 0).toDateTime.toInstant.getMillis

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
      baseTable     = joinDef,
      joinColumns   = Columns.allFrom(joinDef) ++ Columns.allFrom(fxDef),
      joins  =
        JoinTo(
          table = fxDef,
          joinSpec = JoinSpec( left = "ccyCross", right = "cross", LeftOuterJoin)
        ),
      joinFields = Seq()
    )

    val joinProvider   = new JoinTableProviderImpl()

    val tableContainer = new TableContainer(joinProvider)

    val orders = tableContainer.createTable(ordersDef)
    val prices = tableContainer.createTable(pricesDef)
    val fx = tableContainer.createTable(fxDef)

    val orderPrices = tableContainer.createJoinTable(joinDef)
    val orderPricesFx = tableContainer.createJoinTable(joinDefFx)

    val ordersProvider = new MockProvider(orders)
    val pricesProvider = new MockProvider(prices)
    val fxProvider = new MockProvider(fx)

    val viewPortContainer = setupViewPort(tableContainer)

    joinProvider.start()

    fxProvider.tick("USDGBP", Map("cross" -> "USDGBP", "fxbid" -> 0.703, "fxask" -> 0.703))
    fxProvider.tick("USDEUR", Map("cross" -> "USDEUR", "fxbid" -> 1.213, "fxask" -> 1.223))

    ordersProvider.tick("NYC-0001", Map("orderId" -> "NYC-0001", "trader" -> "chris", "tradeTime" -> dateTime, "quantity" -> 100, "ric" -> "VOD.L", "ccyCross" -> "USDGBP"))
    pricesProvider.tick("VOD.L", Map("ric" -> "VOD.L", "bid" -> 220.0, "ask" -> 222.0))

    pricesProvider.tick("BT.L", Map("ric" -> "BT.L", "bid" -> 500.0, "ask" -> 501.0))
    ordersProvider.tick("NYC-0002", Map("orderId" -> "NYC-0002", "trader" -> "chris", "tradeTime" -> dateTime, "quantity" -> 100, "ric" -> "BT.L", "ccyCross" -> "USDEUR"))

    joinProvider.runOnce()
    joinProvider.runOnce()

    val session = new ClientSessionId("sess-01", "chris")

    val outQueue = new OutboundRowPublishQueue()
    val highPriorityQueue = new OutboundRowPublishQueue()

    val vpcolumns = List("orderId", "trader", "tradeTime", "quantity", "ric", "fxbid", "fxask").map(orderPrices.getTableDef.columnForName(_)).toList

    val viewPort = viewPortContainer.create(session, outQueue, highPriorityQueue, orderPricesFx, DefaultRange, vpcolumns)

    viewPortContainer.runOnce()

    val combinedUpdates = combineQs(viewPort)

    combinedUpdates.length should be (3)

    val updates = combinedUpdates.take(2)

    val printToConsoleProcessor = new RowProcessor {
      override def processColumn(column: Column, value: Any): Unit = println(s"Column: ${column.name} = $value")
      override def missingRow(): Unit = println("missing row")

      override def missingRowData(rowKey: String, column: Column): Unit = {
        assert(true == false, s"Column ${column.name} not found in results for $rowKey, that means a problem has occured.")
      }
    }

    updates.filter( vp => vp.vpUpdate == RowUpdateType).foreach(update => update.table.readRow(update.key.key, List("orderId", "trader", "tradeTime", "ric", "bid", "ask", "fxbid", "fxask"), printToConsoleProcessor ))
  }

}
