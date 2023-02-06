package org.finos.vuu.core.groupBy

import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.core.tree.TreeSessionTableImpl
import org.finos.vuu.net.{ClientSessionId, FilterSpec}
import org.finos.vuu.provider.MockProvider
import org.finos.vuu.viewport.{GroupBy, OpenTreeNodeState, TreeBuilder, ViewPortSetup}
import org.joda.time.{DateTime, DateTimeZone}
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers
import org.finos.vuu.viewport.TreeUtils._
import org.finos.toolbox.collection.array.ImmutableArray
import org.finos.toolbox.collection.set.ImmutableUniqueArraySet
import org.finos.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.DefaultClock
import org.finos.vuu.core.table.ViewPortColumnCreator
import org.scalatest.GivenWhenThen

class TreeNodeHashingTest extends AnyFeatureSpec with Matchers with StrictLogging with ViewPortSetup with GivenWhenThen{

  final val dateTime = new DateTime(2015, 7, 24, 11, 0, DateTimeZone.forID("Europe/London")).toDateTime.toInstant.getMillis

  Feature("Verify our ability to has tree updates in the builder") {

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

    Scenario("check we calculate branch hashes correctly") {

      implicit val clock = new DefaultClock
      implicit val lifecycle = new LifecycleContainer
      implicit val metrics: MetricsProvider = new MetricsProviderImpl

      val (joinProvider, orders, prices, orderPrices, ordersProvider, pricesProvider, viewPortContainer) = setup()

      joinProvider.start()

      tickData(ordersProvider, pricesProvider)

      joinProvider.runOnce()

      val sessionTable = new TreeSessionTableImpl(orderPrices, ClientSessionId("A", "B"), joinProvider)

      val vpColumns = ViewPortColumnCreator.create(sessionTable, sessionTable.columns().map(_.name).toList)

      val treeOnce = TreeBuilder.create(sessionTable, GroupBy(orderPrices, vpColumns.getColumnForName("trader").get, vpColumns.getColumnForName("ric").get)
        .withAverage("quantity")
        .asClause(),
        FilterSpec(""),
        vpColumns,
        None,
        None
      ).build()

      val treeTwice = TreeBuilder.create(sessionTable, GroupBy(orderPrices, vpColumns.getColumnForName("trader").get, vpColumns.getColumnForName("ric").get)
        .withAverage("quantity")
        .asClause(),
        FilterSpec(""),
        vpColumns,
        None,
        None
      ).build()

      val diffsOnceAndTwice = diffOldVsNewBranches(treeOnce, treeTwice, Map())

      treeOnce.root.childRowsHash() shouldEqual(treeTwice.root.childRowsHash())

      diffsOnceAndTwice.size shouldEqual(0)

      pricesProvider.tick("BT.L", Map("ric" -> "BT.L", "bid" -> 501.0, "ask" -> 502.0))

      val treeThrice = TreeBuilder.create(sessionTable, GroupBy(orderPrices, vpColumns.getColumnForName("trader").get, vpColumns.getColumnForName("ric").get)
        .withAverage("quantity")
        .asClause(),
        FilterSpec(""),
        vpColumns,
        None,
        None
      ).build()

      val diffsTwiceAndThrice = diffOldVsNewBranches(treeTwice, treeThrice, Map())

      //we discard the root updates, as we never send the root node to the UI, so only the two branch nodes below are updated
      diffsTwiceAndThrice.size shouldEqual(2)

      diffsTwiceAndThrice.toArray shouldEqual Array("$root|steve", "$root|steve|BT.L")

      treeOnce.root.childRowsHash() should not equal treeThrice.root.childRowsHash()
    }

    Scenario("Check we use nodestate correctly"){

      implicit val clock = new DefaultClock
      implicit val lifecycle = new LifecycleContainer
      implicit val metrics: MetricsProvider = new MetricsProviderImpl

      val (joinProvider, orders, prices, orderPrices, ordersProvider, pricesProvider, viewPortContainer) = setup()

      joinProvider.start()

      tickData(ordersProvider, pricesProvider)

      joinProvider.runOnce()

      val sessionTable = new TreeSessionTableImpl(orderPrices, ClientSessionId("A", "B"), joinProvider)

      val vpColumns = ViewPortColumnCreator.create(sessionTable, sessionTable.columns().map(_.name).toList)

      Given("we create a tree")
      val treeOnce = TreeBuilder.create(sessionTable, GroupBy(orderPrices, vpColumns.getColumnForName("trader").get, vpColumns.getColumnForName("ric").get)
        .withAverage("quantity")
        .asClause(),
        FilterSpec(""),
        vpColumns,
        None,
        None
      ).build()

      And("then recreate the same tree, with different node state")
      val treeTwice = TreeBuilder.create(sessionTable, GroupBy(orderPrices, vpColumns.getColumnForName("trader").get, vpColumns.getColumnForName("ric").get)
        .withAverage("quantity")
        .asClause(),
        FilterSpec(""),
        vpColumns,
        None,
        None
      ).build()

      Then("Check we get a diff, oldstate was open")
      val diffsOnceAndTwice = diffOldVsNewBranches(treeOnce, treeTwice, Map("$root|steve" -> OpenTreeNodeState))

      diffsOnceAndTwice.size should be(1)

    }

  }
}
