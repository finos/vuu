package org.finos.vuu.viewport.performance

import org.finos.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.{Clock, DefaultClock}
import org.finos.vuu.api._
import org.finos.vuu.client.messages.RequestId
import org.finos.vuu.core.table.{Columns, TableContainer, ViewPortColumnCreator}
import org.finos.vuu.net.{ClientSessionId, FilterSpec, SortSpec}
import org.finos.vuu.provider.{JoinTableProviderImpl, MockProvider, ProviderContainer}
import org.finos.vuu.util.OutboundRowPublishQueue
import org.finos.vuu.util.table.TableAsserts._
import org.finos.vuu.viewport.ViewPortTestFns.setupViewPort
import org.finos.vuu.viewport.{DefaultRange, GroupBy, ViewPortSetup}
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.prop.Tables.Table

class CalculateTreeOptimizationTest extends AnyFeatureSpec with ViewPortSetup {

  implicit val timeProvider: Clock = new DefaultClock
  implicit val metrics: MetricsProvider = new MetricsProviderImpl
  implicit val lifecycle: LifecycleContainer = new LifecycleContainer
  val dateTime = 1437728400000L //new LocalDateTime(2015, 7, 24, 11, 0).toDateTime.toInstant.getMillis
  val joinProvider = JoinTableProviderImpl()
  val tableContainer = new TableContainer(joinProvider)
  val ordersDef = TableDef(
    name = "orders",
    keyField = "orderId",
    columns = Columns.fromNames("orderId:String", "trader:String", "ric:String", "tradeTime:Long", "quantity:Double"),
    joinFields = "ric", "orderId")

  Feature("tree optimization test") {

    Scenario("create tree and check rebuild of it") {


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

      val orders = tableContainer.createTable(ordersDef)
      val prices = tableContainer.createTable(pricesDef)
      val orderPrices = tableContainer.createJoinTable(joinDef)

      val ordersProvider = new MockProvider(orders)
      val pricesProvider = new MockProvider(prices)

      val providerContainer = new ProviderContainer(joinProvider)

      val viewPortContainer = setupViewPort(tableContainer, providerContainer)

      joinProvider.start()

      ordersProvider.tick("NYC-0001", Map("orderId" -> "NYC-0001", "trader" -> "chris", "tradeTime" -> dateTime, "quantity" -> 100, "ric" -> "VOD.L"))
      pricesProvider.tick("VOD.L", Map("ric" -> "VOD.L", "bid" -> 220.0, "ask" -> 222.0, "last" -> 30))

    val outQueue = new OutboundRowPublishQueue()

      joinProvider.runOnce()

    val viewPort = viewPortContainer.create(RequestId.oneNew(), session, outQueue, orderPrices, DefaultRange, vpcolumns)

      val outQueue = new OutboundRowPublishQueue()
      val highPriorityQueue = new OutboundRowPublishQueue()

      val vpcolumns = ViewPortColumnCreator.create(orderPrices, List("orderId", "trader", "tradeTime", "quantity", "ric", "bid", "ask"))

      val viewPort = viewPortContainer.create(RequestId.oneNew(), session, outQueue, highPriorityQueue, orderPrices, DefaultRange, vpcolumns)

      runContainersOnce(viewPortContainer, joinProvider)

      assertVpEq(combineQs(viewPort)) {
        Table(
          ("orderId", "trader", "ric", "tradeTime", "quantity", "bid", "ask"),
          ("NYC-0001", "chris", "VOD.L", 1437728400000L, 100, 220.0, 222.0),
          ("NYC-0002", "chris", "BT.L", 1437728400000L, 100, 500.0, 501.0)
        )
      }

      val vpcolumns2 = ViewPortColumnCreator.create(orderPrices, List("orderId", "trader", "tradeTime", "quantity", "ric", "bid", "ask", "last", "open"))

      val groupByColumns = List(orderPrices.columnForName("trader"))

      val viewPort2 = viewPortContainer.change(RequestId.oneNew(), session, viewPort.id, DefaultRange, vpcolumns2,
        SortSpec(List()),
        FilterSpec(""),
        GroupBy(groupByColumns, List()))

      runContainersOnce(viewPortContainer, joinProvider)

      assertVpEq(filterByVpId(combineQs(viewPort), viewPort)) {
        Table(
          ("_depth", "_isOpen", "_treeKey", "_isLeaf", "_isOpen", "_caption", "_childCount", "orderId", "trader", "ric", "tradeTime", "quantity", "bid", "ask", "last", "open"),
          (1, false, "$root|chris", false, false, "chris", 0, "", "chris", "", "", "", "", "", "", "")
        )
      }

      emptyQueues(viewPort)

      runContainersOnce(viewPortContainer, joinProvider)
      viewPortContainer.runGroupByOnce()

      assertVpEq(filterByVpId(combineQs(viewPort), viewPort)) {
        Table(
          ("_depth", "_isOpen", "_treeKey", "_isLeaf", "_isOpen", "_caption", "_childCount", "orderId", "trader", "ric", "tradeTime", "quantity", "bid", "ask", "last", "open"),
          (1, false, "$root|chris", false, false, "chris", 2, "", "chris", "", "", "", "", "", "", "")
        )
      }

      val groupByColumns3 = List(orderPrices.columnForName("ric"))

    assertVpEq(combinedUpdates3) {
      Table(
        ("_depth", "_isOpen", "_treeKey", "_isLeaf", "_isOpen", "_caption", "_childCount", "orderId", "trader", "ric", "tradeTime", "quantity", "bid", "ask", "last", "open"),
        (1, false, "$root|BT.L", false, false, "BT.L", 0, "", "", "BT.L", "", "", "", "", "", ""),
        (1, false, "$root|VOD.L", false, false, "VOD.L", 0, "", "", "VOD.L", "", "", "", "", "", "")
      )
    }

      viewPortContainer.runGroupByOnce()
      viewPortContainer.runOnce()

      val combinedUpdates3 = combineQs(viewPort3)

      assertVpEq(combinedUpdates3) {
        Table(
          ("_depth", "_isOpen", "_treeKey", "_isLeaf", "_isOpen", "_caption", "_childCount", "orderId", "trader", "ric", "tradeTime", "quantity", "bid", "ask", "last", "open"),
          //(0, true, "$root", false, true, "", 2, "", "", "", "", "", "", "", "", ""),
          (1, false, "$root|VOD.L", false, false, "VOD.L", 0, "", "", "VOD.L", "", "", "", "", "", ""),
          (1, false, "$root|BT.L", false, false, "BT.L", 0, "", "", "BT.L", "", "", "", "", "", "")
        )
      }
    }

  }

}
