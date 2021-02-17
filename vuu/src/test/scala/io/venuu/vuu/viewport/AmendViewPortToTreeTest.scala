package io.venuu.vuu.viewport

import io.venuu.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import io.venuu.toolbox.lifecycle.LifecycleContainer
import io.venuu.toolbox.time.{Clock, DefaultClock}
import io.venuu.vuu.api._
import io.venuu.vuu.core.table.TableTestHelper._
import io.venuu.vuu.core.table.{Columns, TableContainer}
import io.venuu.vuu.net.{ClientSessionId, FilterSpec, SortSpec}
import io.venuu.vuu.provider.{JoinTableProviderImpl, MockProvider}
import io.venuu.vuu.util.OutboundRowPublishQueue
import io.venuu.vuu.util.table.TableAsserts._
import org.scalatest.FeatureSpec
import org.scalatest.prop.Tables.Table

/**
  * Created by chris on 02/09/2016.
  */
class AmendViewPortToTreeTest extends FeatureSpec {

  import ViewPortTestFns._

  def runTest(): Unit = {

    implicit val timeProvider: Clock = new DefaultClock
    implicit val metrics: MetricsProvider = new MetricsProviderImpl

    implicit val lifecycle = new LifecycleContainer

    val dateTime = 1437728400000l //new LocalDateTime(2015, 7, 24, 11, 0).toDateTime.toInstant.getMillis


    val ordersDef = TableDef(
      name = "orders",
      keyField = "orderId",
      columns = Columns.fromNames("orderId:String", "trader:String", "ric:String", "tradeTime:Long", "quantity:Double"),
      joinFields = "ric", "orderId")

    val pricesDef = TableDef("prices", "ric", Columns.fromNames("ric:String", "bid:Double", "ask:Double", "last:Double", "open:Double", "close:Double"), "ric")

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

    val joinProvider = new JoinTableProviderImpl()

    val tableContainer = new TableContainer(joinProvider)

    val orders = tableContainer.createTable(ordersDef)
    val prices = tableContainer.createTable(pricesDef)
    val orderPrices = tableContainer.createJoinTable(joinDef)

    val ordersProvider = new MockProvider(orders)
    val pricesProvider = new MockProvider(prices)

    val (viewPortContainer) = setupViewPort(tableContainer)

    joinProvider.start()

    ordersProvider.tick("NYC-0001", Map("orderId" -> "NYC-0001", "trader" -> "chris", "tradeTime" -> dateTime, "quantity" -> 100, "ric" -> "VOD.L"))
    pricesProvider.tick("VOD.L", Map("ric" -> "VOD.L", "bid" -> 220.0, "ask" -> 222.0, "last" -> 30))

    pricesProvider.tick("BT.L", Map("ric" -> "BT.L", "bid" -> 500.0, "ask" -> 501.0, "last" -> 40))
    ordersProvider.tick("NYC-0002", Map("orderId" -> "NYC-0002", "trader" -> "chris", "tradeTime" -> dateTime, "quantity" -> 100, "ric" -> "BT.L"))

    joinProvider.runOnce()

    val session = new ClientSessionId("sess-01", "chris")

    val outQueue = new OutboundRowPublishQueue()
    val highPriorityQueue = new OutboundRowPublishQueue()

    val vpcolumns = List("orderId", "trader", "tradeTime", "quantity", "ric", "bid", "ask").map(orderPrices.getTableDef.columnForName(_)).toList

    val viewPort = viewPortContainer.create(session, outQueue, highPriorityQueue, orderPrices, DefaultRange, vpcolumns)

    viewPortContainer.runOnce()
    viewPortContainer.runGroupByOnce()

    val combinedUpdates = combineQs(viewPort)

    assertVpEq(combinedUpdates) {
      Table(
        ("orderId", "trader", "ric", "tradeTime", "quantity", "bid", "ask"),
        ("NYC-0001", "chris", "VOD.L", 1437728400000l, 100, 220.0, 222.0),
        ("NYC-0002", "chris", "BT.L", 1437728400000l, 100, 500.0, 501.0)
      )
    }

    val vpcolumns2 = List("orderId", "trader", "tradeTime", "quantity", "ric", "bid", "ask", "last", "open").map(orderPrices.getTableDef.columnForName(_)).toList

    val groupByColumns = List(orderPrices.columnForName("trader"))

    val viewPort2 = viewPortContainer.change(session, viewPort.id, DefaultRange, vpcolumns2,
      SortSpec(List()),
      FilterSpec(""),
      GroupBy(groupByColumns, List()))

    emptyQueues(viewPort);

    viewPortContainer.closeNode(viewPort2.id, "$root/chris")
    viewPortContainer.runGroupByOnce()
    viewPortContainer.runOnce()

    val combinedUpdates2 = combineQs(viewPort2)

    assertVpEq(combinedUpdates2) {
      Table(
        ("_depth", "_isOpen", "_treeKey", "_isLeaf", "_isOpen", "_caption", "_childCount", "orderId", "trader", "ric", "tradeTime", "quantity", "bid", "ask", "last", "open"),
        (0, true, "$root", false, true, "", 1, "", "", "", "", "", "", "", "", ""),
        (1, false, "$root/chris", false, false, "chris", 2, "", "chris", "", "", "", "", "", "", "")
      )
    }

    val groupByColumns3 = List(orderPrices.columnForName("ric"))

    val viewPort3 = viewPortContainer.change(session, viewPort2.id, DefaultRange, vpcolumns2,
      SortSpec(List()),
      FilterSpec(""),
      GroupBy(groupByColumns3, List()))

    viewPortContainer.runGroupByOnce()
    viewPortContainer.runOnce()

    val combinedUpdates3 = combineQs(viewPort3)

    assertVpEq(combinedUpdates3) {
      Table(
        ("_depth", "_isOpen", "_treeKey", "_isLeaf", "_isOpen", "_caption", "_childCount", "orderId", "trader", "ric", "tradeTime", "quantity", "bid", "ask", "last", "open"),
        (0, true, "$root", false, true, "", 2, "", "", "", "", "", "", "", "", ""),
        (1, false, "$root/VOD.L", false, false, "VOD.L", 1, "", "", "VOD.L", "", "", "", "", "", ""),
        (1, false, "$root/BT.L", false, false, "BT.L", 1, "", "", "BT.L", "", "", "", "", "", "")
      )
    }

  }

  feature("test amending a view port from normal to tree and back") {

    scenario("create view port (flat) then tree it, then return to flat") {
      runTest()
    }

  }

}
