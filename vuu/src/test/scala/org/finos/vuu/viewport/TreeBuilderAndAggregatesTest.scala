package org.finos.vuu.viewport

import org.finos.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.DefaultClock
import org.finos.vuu.core.filter.`type`.AllowAllPermissionFilter
import org.finos.vuu.core.table.ViewPortColumnCreator
import org.finos.vuu.core.tree.TreeSessionTableImpl
import org.finos.vuu.net.{ClientSessionId, FilterSpec}
import org.finos.vuu.provider.MockProvider
import org.finos.vuu.viewport.tree.{BuildEntireTree, OnlyRecalculateTreeKeys, TreeBuilder, TreeNodeStateStore}
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

import java.time.{LocalDateTime, ZoneId}
import scala.collection.convert.ImplicitConversions.`list asScalaBuffer`

class TreeBuilderAndAggregatesTest extends AnyFeatureSpec with Matchers with ViewPortSetup {

  val dateTime: Long = LocalDateTime.of(2015, 7, 24, 11, 0).atZone(ZoneId.of("Europe/London")).toInstant.toEpochMilli

  Feature("check tree building"){

    def tickData(ordersProvider: MockProvider, pricesProvider: MockProvider): Unit = {

      ordersProvider.tick("NYC-0001", Map("orderId" -> "NYC-0001", "trader" -> "chris", "tradeTime" -> dateTime, "quantity" -> 100, "ric" -> "VOD.L"))
      ordersProvider.tick("NYC-0002", Map("orderId" -> "NYC-0002", "trader" -> "chris", "tradeTime" -> dateTime, "quantity" -> 200, "ric" -> "VOD.L"))
      ordersProvider.tick("NYC-0003", Map("orderId" -> "NYC-0003", "trader" -> "chris", "tradeTime" -> dateTime, "quantity" -> 300, "ric" -> "VOD.L"))
      ordersProvider.tick("NYC-0004", Map("orderId" -> "NYC-0004", "trader" -> "chris", "tradeTime" -> dateTime, "quantity" -> 400, "ric" -> "VOD.L"))
      ordersProvider.tick("NYC-0005", Map("orderId" -> "NYC-0005", "trader" -> "chris", "tradeTime" -> dateTime, "quantity" -> 500, "ric" -> "VOD.L"))
      ordersProvider.tick("NYC-0006", Map("orderId" -> "NYC-0006", "trader" -> "steve", "tradeTime" -> dateTime, "quantity" -> 600, "ric" -> "VOD.L"))
      ordersProvider.tick("NYC-0007", Map("orderId" -> "NYC-0007", "trader" -> "steve", "tradeTime" -> dateTime, "quantity" -> 1000, "ric" -> "BT.L"))
      ordersProvider.tick("NYC-0008", Map("orderId" -> "NYC-0008", "trader" -> "steve", "tradeTime" -> dateTime, "quantity" -> 500, "ric" -> "BT.L"))

      pricesProvider.tick("VOD.L", Map("ric" -> "VOD.L", "bid" -> 220.0, "ask" -> 222.0))
      pricesProvider.tick("BT.L", Map("ric" -> "BT.L", "bid" -> 500.0, "ask" -> 501.0))

    }

    Scenario("Test average aggregate"){
      implicit val clock: DefaultClock = new DefaultClock
      implicit val lifecycle: LifecycleContainer = new LifecycleContainer
      implicit val metrics: MetricsProvider = new MetricsProviderImpl

      val (joinProvider, orders, prices, orderPrices, ordersProvider, pricesProvider, viewPortContainer) = setup()

      joinProvider.start()

      tickData(ordersProvider, pricesProvider)

      joinProvider.runOnce()

      val sessionTable = new TreeSessionTableImpl(orderPrices, ClientSessionId("A", "C"), joinProvider)

      val columns = ViewPortColumnCreator.create(sessionTable, sessionTable.getTableDef.getColumns.map(_.name).toList)

      val nodeState = TreeNodeStateStore(Map())

      val tree = TreeBuilder.create(sessionTable,
        GroupBy(orderPrices, columns.getColumnForName("trader").get, columns.getColumnForName("ric").get)
          .withAverage("quantity")
          .asClause(),
        FilterSpec(""),
        columns,
        nodeState,
        None,
        None,
        BuildEntireTree(sessionTable, None),
        AllowAllPermissionFilter,
        None
      ).buildEntireTree()

      tree.root.getAggregationFor(orderPrices.columnForName("quantity")) should equal(450.0)
      tree.root.getChildren.head.getAggregationFor(orderPrices.columnForName("quantity")) should equal(300.0)
      tree.root.getChildren(1).getAggregationFor(orderPrices.columnForName("quantity")) should equal(700.0)
    }

    Scenario("Test high"){
      implicit val clock: DefaultClock = new DefaultClock
      implicit val lifecycle: LifecycleContainer = new LifecycleContainer
      implicit val metrics: MetricsProvider = new MetricsProviderImpl

      val (joinProvider, orders, prices, orderPrices, ordersProvider, pricesProvider, viewPortContainer) = setup()

      joinProvider.start()

      tickData(ordersProvider, pricesProvider)

      joinProvider.runOnce()

      val sessionTable = new TreeSessionTableImpl(orderPrices, ClientSessionId("A", "C"), joinProvider)

      val columns = ViewPortColumnCreator.create(sessionTable, sessionTable.getTableDef.getColumns.map(_.name).toList)

      val nodeState = TreeNodeStateStore(Map())

      val tree = TreeBuilder.create(sessionTable,
        GroupBy(orderPrices, columns.getColumnForName("trader").get, columns.getColumnForName("ric").get)
          .withHigh("quantity")
          .asClause(),
        FilterSpec(""),
        columns,
        nodeState,
        None,
        None,
        BuildEntireTree(sessionTable, None),
        AllowAllPermissionFilter,
        None
      ).buildEntireTree()

      tree.root.getAggregationFor(orderPrices.columnForName("quantity")) should equal(1000.0)
      tree.root.getChildren.head.getAggregationFor(orderPrices.columnForName("quantity")) should equal(500.0)
      tree.root.getChildren(1).getAggregationFor(orderPrices.columnForName("quantity")) should equal(1000.0)
    }

    Scenario("Test low"){
      implicit val clock: DefaultClock = new DefaultClock
      implicit val lifecycle: LifecycleContainer = new LifecycleContainer
      implicit val metrics: MetricsProvider = new MetricsProviderImpl

      val (joinProvider, orders, prices, orderPrices, ordersProvider, pricesProvider, viewPortContainer) = setup()

      joinProvider.start()

      tickData(ordersProvider, pricesProvider)

      joinProvider.runOnce()

      val sessionTable = new TreeSessionTableImpl(orderPrices, ClientSessionId("A", "C"), joinProvider)

      val columns = ViewPortColumnCreator.create(sessionTable, sessionTable.getTableDef.getColumns.map(_.name).toList)

      val nodeState = TreeNodeStateStore(Map())

      val tree = TreeBuilder.create(sessionTable,
        GroupBy(orderPrices, columns.getColumnForName("trader").get, columns.getColumnForName("ric").get)
          .withLow("quantity")
          .asClause(),
        FilterSpec(""),
        columns,
        nodeState,
        None,
        None,
        BuildEntireTree(sessionTable, None),
        AllowAllPermissionFilter,
        None
      ).buildEntireTree()

      tree.root.getAggregationFor(orderPrices.columnForName("quantity")) should equal(100.0)
      tree.root.getChildren.head.getAggregationFor(orderPrices.columnForName("quantity")) should equal(100.0)
      tree.root.getChildren(1).getAggregationFor(orderPrices.columnForName("quantity")) should equal(500.0)
    }

    Scenario("build simple groupby tree"){

      implicit val clock: DefaultClock = new DefaultClock
      implicit val lifecycle: LifecycleContainer = new LifecycleContainer
      implicit val metrics: MetricsProvider = new MetricsProviderImpl

      val (joinProvider, orders, prices, orderPrices, ordersProvider, pricesProvider, viewPortContainer) = setup()

      joinProvider.start()

      tickData(ordersProvider, pricesProvider)

      joinProvider.runOnce()

      val sessionTable = new TreeSessionTableImpl(orderPrices, ClientSessionId("A", "C"), joinProvider)

      val columns = ViewPortColumnCreator.create(sessionTable, sessionTable.getTableDef.getColumns.map(_.name).toList)

      val nodeState = TreeNodeStateStore(Map())

      val tree = TreeBuilder.create(sessionTable,
        GroupBy(orderPrices, columns.getColumnForName("trader").get, columns.getColumnForName("ric").get)
          .withSum("quantity")
          .withCount("trader")
          .asClause(),
        FilterSpec(""),
        columns,
        nodeState,
        None,
        None,
        BuildEntireTree(sessionTable, None),
        AllowAllPermissionFilter,
        None
      ).buildEntireTree()

      tree.root.getAggregationFor(orderPrices.columnForName("quantity")) should equal(3600.0)
      tree.root.getAggregationFor(orderPrices.columnForName("trader")) should equal(2)

      tree.root.getChildren.head.getAggregationFor(orderPrices.columnForName("quantity")) should equal(1500.0)
      tree.root.getChildren.head.getAggregationFor(orderPrices.columnForName("trader")) should equal(1)

      tree.root.getChildren(1).getAggregationFor(orderPrices.columnForName("quantity")) should equal(2100.0)
      tree.root.getChildren(1).getAggregationFor(orderPrices.columnForName("trader")) should equal(1)

      //CJS FIXME
      val updatedState = tree.nodeState.openAll(tree)

      val newTree = tree.applyNewNodeState(updatedState, OnlyRecalculateTreeKeys(sessionTable, Some(tree)))

      val keys = newTree.toKeys()

      //Array("root", "$chris", "$VOD.L", "$NYC-0001", "$NYC-0002", "$NYC-0003", "$NYC-0004", "$NYC-0005", "$NYC-0006", "$steve", "$BT.L", "$NYC-0007", "$NYC-0008")
      val expected = Array("$root|chris", "$root|chris|VOD.L", "$root|chris|VOD.L|NYC-0001", "$root|chris|VOD.L|NYC-0002", "$root|chris|VOD.L|NYC-0003", "$root|chris|VOD.L|NYC-0004", "$root|chris|VOD.L|NYC-0005", "$root|steve", "$root|steve|VOD.L", "$root|steve|VOD.L|NYC-0006", "$root|steve|BT.L", "$root|steve|BT.L|NYC-0007", "$root|steve|BT.L|NYC-0008")

      keys.toArray should equal (expected)

      val tree2 = TreeBuilder.create(sessionTable,
        GroupBy(orderPrices, columns.getColumnForName("trader").get, columns.getColumnForName("ric").get)
          .withSum("quantity")
          .withCount("trader")
          .asClause(),
        FilterSpec(""),
        columns,
        nodeState,
        Some(tree),
        None,
        BuildEntireTree(sessionTable, None),
        AllowAllPermissionFilter,
        None
      ).buildEntireTree()

      val tree2Ns = tree2.nodeState.closeAll(tree2).open("$root|chris").open("$root|chris|VOD.L")

      val tree3 = tree2.applyNewNodeState(tree2Ns, OnlyRecalculateTreeKeys(sessionTable, Some(tree2)))

      //Array("$root", "$root/chris", "$root/chris/VOD.L", "$root/chris/VOD.L/NYC-0001", "$root/chris/VOD.L/NYC-0002", "$root/chris/VOD.L/NYC-0003", "$root/chris/VOD.L/NYC-0004", "$root/chris/VOD.L/NYC-0005", "$root/steve")
      val expected3 = Array("$root|chris", "$root|chris|VOD.L", "$root|chris|VOD.L|NYC-0001", "$root|chris|VOD.L|NYC-0002", "$root|chris|VOD.L|NYC-0003", "$root|chris|VOD.L|NYC-0004", "$root|chris|VOD.L|NYC-0005", "$root|steve")

      val keys3 = tree3.toKeys()

      keys3.toArray should equal(expected3)
    }
  }

}
