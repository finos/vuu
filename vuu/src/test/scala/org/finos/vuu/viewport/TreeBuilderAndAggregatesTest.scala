package org.finos.vuu.viewport

import org.finos.vuu.core.tree.TreeSessionTableImpl
import org.finos.vuu.net.{ClientSessionId, FilterSpec}
import org.finos.vuu.provider.MockProvider
import org.finos.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.DefaultClock
import org.joda.time.{DateTime, DateTimeZone}
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class TreeBuilderAndAggregatesTest extends AnyFeatureSpec with Matchers with ViewPortSetup {

  final val dateTime = new DateTime(2015, 7, 24, 11, 0, DateTimeZone.forID("Europe/London")).toDateTime.toInstant.getMillis

  Feature("check tree building"){

    def tickData(ordersProvider: MockProvider, pricesProvider: MockProvider) = {

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
      implicit val clock = new DefaultClock
      implicit val lifecycle = new LifecycleContainer
      implicit val metrics: MetricsProvider = new MetricsProviderImpl

      val (joinProvider, orders, prices, orderPrices, ordersProvider, pricesProvider, viewPortContainer) = setup()

      joinProvider.start()

      tickData(ordersProvider, pricesProvider)

      joinProvider.runOnce()

      val sessionTable = new TreeSessionTableImpl(orderPrices, ClientSessionId("A", "B"), joinProvider)

      val tree = TreeBuilder.create(sessionTable, GroupBy(orderPrices, "trader", "ric")
        .withAverage("quantity")
        .asClause(),
        FilterSpec(""),
        None,
        None
      ).build()

      tree.root.getAggregationFor(orderPrices.columnForName("quantity")) should equal("450.0")
      tree.root.getChildren(0).getAggregationFor(orderPrices.columnForName("quantity")) should equal("300.0")
      tree.root.getChildren(1).getAggregationFor(orderPrices.columnForName("quantity")) should equal("700.0")
    }

    Scenario("Test high"){
      implicit val clock = new DefaultClock
      implicit val lifecycle = new LifecycleContainer
      implicit val metrics: MetricsProvider = new MetricsProviderImpl

      val (joinProvider, orders, prices, orderPrices, ordersProvider, pricesProvider, viewPortContainer) = setup()

      joinProvider.start()

      tickData(ordersProvider, pricesProvider)

      joinProvider.runOnce()

      val sessionTable = new TreeSessionTableImpl(orderPrices, ClientSessionId("A", "B"), joinProvider)

      val tree = TreeBuilder.create(sessionTable, GroupBy(orderPrices, "trader", "ric")
        .withHigh("quantity")
        .asClause(),
        FilterSpec(""),
        None,
        None
      ).build()

      tree.root.getAggregationFor(orderPrices.columnForName("quantity")) should equal("1000.0")
      tree.root.getChildren(0).getAggregationFor(orderPrices.columnForName("quantity")) should equal("500.0")
      tree.root.getChildren(1).getAggregationFor(orderPrices.columnForName("quantity")) should equal("1000.0")
    }

    Scenario("Test low"){
      implicit val clock = new DefaultClock
      implicit val lifecycle = new LifecycleContainer
      implicit val metrics: MetricsProvider = new MetricsProviderImpl

      val (joinProvider, orders, prices, orderPrices, ordersProvider, pricesProvider, viewPortContainer) = setup()

      joinProvider.start()

      tickData(ordersProvider, pricesProvider)

      joinProvider.runOnce()

      val sessionTable = new TreeSessionTableImpl(orderPrices, ClientSessionId("A", "B"), joinProvider)

      val tree = TreeBuilder.create(sessionTable, GroupBy(orderPrices, "trader", "ric")
        .withLow("quantity")
        .asClause(),
        FilterSpec(""),
        None,
        None
      ).build()

      tree.root.getAggregationFor(orderPrices.columnForName("quantity")) should equal("100.0")
      tree.root.getChildren(0).getAggregationFor(orderPrices.columnForName("quantity")) should equal("100.0")
      tree.root.getChildren(1).getAggregationFor(orderPrices.columnForName("quantity")) should equal("500.0")
    }

    Scenario("build simple groupby tree"){

      implicit val clock = new DefaultClock
      implicit val lifecycle = new LifecycleContainer
      implicit val metrics: MetricsProvider = new MetricsProviderImpl

      val (joinProvider, orders, prices, orderPrices, ordersProvider, pricesProvider, viewPortContainer) = setup()

      joinProvider.start()

      tickData(ordersProvider, pricesProvider)

      joinProvider.runOnce()

      val sessionTable = new TreeSessionTableImpl(orderPrices, ClientSessionId("A", "B"), joinProvider)

      val tree = TreeBuilder.create(sessionTable, GroupBy(orderPrices, "trader", "ric")
        .withSum("quantity")
        .withCount("trader")
        .asClause(),
        FilterSpec(""),
        None,
        None
      ).build()

      tree.root.getAggregationFor(orderPrices.columnForName("quantity")) should equal("3600.0")
      tree.root.getAggregationFor(orderPrices.columnForName("trader")) should equal("2")

      tree.root.getChildren(0).getAggregationFor(orderPrices.columnForName("quantity")) should equal("1500.0")
      tree.root.getChildren(0).getAggregationFor(orderPrices.columnForName("trader")) should equal("1")

      tree.root.getChildren(1).getAggregationFor(orderPrices.columnForName("quantity")) should equal("2100.0")
      tree.root.getChildren(1).getAggregationFor(orderPrices.columnForName("trader")) should equal("1")

      tree.openAll()

      val keys = tree.toKeys()

      //Array("root", "$chris", "$VOD.L", "$NYC-0001", "$NYC-0002", "$NYC-0003", "$NYC-0004", "$NYC-0005", "$NYC-0006", "$steve", "$BT.L", "$NYC-0007", "$NYC-0008")
      val expected = Array("$root|chris", "$root|chris|VOD.L", "$root|chris|VOD.L|NYC-0001", "$root|chris|VOD.L|NYC-0002", "$root|chris|VOD.L|NYC-0003", "$root|chris|VOD.L|NYC-0004", "$root|chris|VOD.L|NYC-0005", "$root|steve", "$root|steve|VOD.L", "$root|steve|VOD.L|NYC-0006", "$root|steve|BT.L", "$root|steve|BT.L|NYC-0007", "$root|steve|BT.L|NYC-0008")

      keys.toArray should equal (expected)

      val tree2 = TreeBuilder.create(sessionTable, GroupBy(orderPrices, "trader", "ric")
        .withSum("quantity")
        .withCount("trader")
        .asClause(),
        FilterSpec(""),
        Some(tree),
        None).build()

      tree2.closeAll()
      tree2.open("$root|chris")
      tree2.open("$root|chris|VOD.L")

      //Array("$root", "$root/chris", "$root/chris/VOD.L", "$root/chris/VOD.L/NYC-0001", "$root/chris/VOD.L/NYC-0002", "$root/chris/VOD.L/NYC-0003", "$root/chris/VOD.L/NYC-0004", "$root/chris/VOD.L/NYC-0005", "$root/steve")
      val expected2 = Array("$root|chris", "$root|chris|VOD.L", "$root|chris|VOD.L|NYC-0001", "$root|chris|VOD.L|NYC-0002", "$root|chris|VOD.L|NYC-0003", "$root|chris|VOD.L|NYC-0004", "$root|chris|VOD.L|NYC-0005", "$root|steve")

      val keys2 = tree2.toKeys()

      keys2.toArray should equal(expected2)
    }
  }

}
