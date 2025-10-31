package org.finos.vuu.viewport

import org.finos.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.{Clock, DefaultClock}
import org.finos.vuu.client.messages.RequestId
import org.finos.vuu.core.auths.VuuUser
import org.finos.vuu.core.table.ViewPortColumnCreator
import org.finos.vuu.net.{ClientSessionId, FilterSpec, SortSpec}
import org.finos.vuu.util.OutboundRowPublishQueue
import org.finos.vuu.util.table.TableAsserts.*
import org.finos.vuu.viewport.tree.{OnlyRecalculateTreeKeys, TreeBuildOptimizer}
import org.scalatest.GivenWhenThen
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers
import org.scalatest.prop.Tables.Table

import java.time.{LocalDateTime, ZoneId}

class TreeAndAggregate2Test extends AnyFeatureSpec with Matchers with GivenWhenThen with ViewPortSetup {

  val dateTime: Long = LocalDateTime.of(2015, 7, 24, 11, 0).atZone(ZoneId.of("Europe/London")).toInstant.toEpochMilli

  Feature("Test trees and aggregates, 2nd set of scenaros") {

    Scenario("test groupBy tree structure update") {

      implicit val clock: Clock = new DefaultClock
      implicit val lifeCycle: LifecycleContainer = new LifecycleContainer
      implicit val metrics: MetricsProvider = new MetricsProviderImpl

      val (joinProvider, orders, prices, orderPrices, ordersProvider, pricesProvider, viewPortContainer) = setup()

      joinProvider.start()

      tickInData(ordersProvider, pricesProvider)

      joinProvider.runOnce()

      val queue = new OutboundRowPublishQueue()

      val columns = ViewPortColumnCreator.create(orderPrices, orderPrices.getTableDef.columns.map(_.name).toList)

      val viewport = viewPortContainer.create(RequestId.oneNew(),
        VuuUser("B"),
        ClientSessionId("A", "B", "C"),
        queue, orderPrices, ViewPortRange(0, 20), columns,
        SortSpec(List()),
        FilterSpec(""),
        GroupBy(orderPrices, columns.getColumnForName("trader").get, columns.getColumnForName("ric").get)
          .withSum("quantity")
          .withCount("trader")
          .asClause()
      )

      //expect nothing
      runContainersOnce(viewPortContainer, joinProvider)

      assertVpEq(filterByVpId(combineQs(viewport), viewport)) {
        Table(
          ("_isOpen" ,"_depth"  ,"_treeKey","_isLeaf" ,"_childCount","_caption","orderId" ,"trader"  ,"ric"     ,"tradeTime","quantity","bid"     ,"ask"     ,"last"    ,"open"    ,"close"   ),
          (false     ,1         ,"$root|chris",false     ,1         ,"chris"   ,""        ,1         ,""        ,""        ,1500.0    ,""        ,""        ,""        ,""        ,""        ),
          (false     ,1         ,"$root|steve",false     ,2         ,"steve"   ,""        ,1         ,""        ,""        ,2100.0    ,""        ,""        ,""        ,""        ,""        )
        )
      }

      viewPortContainer.openNode(viewport.id, "$root|chris")
      viewPortContainer.openNode(viewport.id, "$root|chris|VOD.L")
      viewPortContainer.openNode(viewport.id, "$root|steve")
      viewPortContainer.closeNode(viewport.id, "$root|steve|BT.L")

      /*
      val currentStructureHash = viewPort.getStructuralHashCode()
      val currentUpdateCount = viewPort.getTableUpdateCount()
       */

      TreeBuildOptimizer.optimize(viewport, viewPortContainer.getTreeNodeStateByVp(viewport.id)).getClass should be (classOf[OnlyRecalculateTreeKeys])

      //viewPortContainer.shouldRebuildTree(viewport, viewport.getStructuralHashCode(), viewport.getTableUpdateCount()) should be(false)

//      val previousNodeState = viewport.table.asTable.asInstanceOf[TreeSessionTableImpl].getTree.nodeState
//
//      val currentNodeState = viewPortContainer.getTreeNodeStateByVp(viewport.id)
//
//      viewPortContainer.shouldRecalcKeys(currentNodeState, previousNodeState) should be(true)

      runContainersOnce(viewPortContainer, joinProvider)

      assertVpEq(filterByVpId(combineQs(viewport), viewport)) {
        Table(
          ("_isOpen", "_depth", "_treeKey", "_isLeaf", "_childCount", "_caption", "orderId", "trader", "ric", "tradeTime", "quantity", "bid", "ask", "last", "open", "close"),
          (true, 1, "$root|chris", false, 1, "chris", "", 1, "", "", 1500.0, "", "", "", "", ""),
          (true, 2, "$root|chris|VOD.L", false, 5, "VOD.L", "", 1, "VOD.L", "", 1500.0, "", "", "", "", ""),
          (false, 3, "$root|chris|VOD.L|NYC-0001", true, 0, "NYC-0001", "NYC-0001", "chris", "VOD.L", 1311544800000L, 100, 220.0, 222.0, null, null, null),
          (false, 3, "$root|chris|VOD.L|NYC-0002", true, 0, "NYC-0002", "NYC-0002", "chris", "VOD.L", 1311544800000L, 200, 220.0, 222.0, null, null, null),
          (false, 3, "$root|chris|VOD.L|NYC-0003", true, 0, "NYC-0003", "NYC-0003", "chris", "VOD.L", 1311544800000L, 300, 220.0, 222.0, null, null, null),
          (false, 3, "$root|chris|VOD.L|NYC-0004", true, 0, "NYC-0004", "NYC-0004", "chris", "VOD.L", 1311544800000L, 400, 220.0, 222.0, null, null, null),
          (false, 3, "$root|chris|VOD.L|NYC-0005", true, 0, "NYC-0005", "NYC-0005", "chris", "VOD.L", 1311544800000L, 500, 220.0, 222.0, null, null, null),
          (true, 1, "$root|steve", false, 2, "steve", "", 1, "", "", 2100.0, "", "", "", "", ""),
          (false, 2, "$root|steve|BT.L", false, 2, "BT.L", "", 1, "BT.L", "", 1500.0, "", "", "", "", ""),
          (false, 2, "$root|steve|VOD.L", false, 1, "VOD.L", "", 1, "VOD.L", "", 600.0, "", "", "", "", "")
        )
      }

      emptyQueues(viewport)

      runContainersOnce(viewPortContainer, joinProvider)

      ordersProvider.tick("NYC-0008", Map("orderId" -> "NYC-0008", "trader" -> "chris", "tradeTime" -> dateTime, "quantity" -> 700, "ric" -> "BT.L"))

      runContainersOnce(viewPortContainer, joinProvider)

      val updates = combineQs(viewport)

      assertVpEq(updates) {
        Table(
          ("_isOpen", "_depth", "_treeKey", "_isLeaf", "_childCount", "_caption", "orderId", "trader", "ric", "tradeTime", "quantity", "bid", "ask", "last", "open", "close"),
          (true, 1, "$root|chris", false, 2, "chris", "", 1, "", "", 2200.0, "", "", "", "", ""),
          (false, 2, "$root|chris|BT.L", false, 1, "BT.L", "", 1, "BT.L", "", 700.0, "", "", "", "", ""),
          (true, 1, "$root|steve", false, 2, "steve", "", 1, "", "", 1600.0, "", "", "", "", ""),
          (false, 2, "$root|steve|BT.L", false, 1, "BT.L", "", 1, "BT.L", "", 1000.0, "", "", "", "", ""),
          (false, 2, "$root|steve|VOD.L", false, 1, "VOD.L", "", 1, "VOD.L", "", 600.0, "", "", "", "", "")
        )

      }

      Given("A change in the structure of the tree (i.e. records reassigned to a new parent)")

      ordersProvider.tick("NYC-0001", Map("orderId" -> "NYC-0001", "trader" -> "steve"))
      ordersProvider.tick("NYC-0002", Map("orderId" -> "NYC-0002", "trader" -> "steve"))
      ordersProvider.tick("NYC-0003", Map("orderId" -> "NYC-0003", "trader" -> "steve"))
      ordersProvider.tick("NYC-0004", Map("orderId" -> "NYC-0004", "trader" -> "steve"))

      viewPortContainer.openNode(viewport.id, "$root|steve|VOD.L")

      emptyQueues(viewport)

      runContainersOnce(viewPortContainer, joinProvider)

      val updates2 = combineQs(viewport)

      Then("check after we update the tree, the updates are visible ")

      assertVpEq(updates2) {
        Table(
          ("_isOpen", "_depth", "_treeKey", "_isLeaf", "_childCount", "_caption", "orderId", "trader", "ric", "tradeTime", "quantity", "bid", "ask", "last", "open", "close"),
          (true, 1, "$root|chris", false, 2, "chris", "", 1, "", "", 1200.0, "", "", "", "", ""),
          (false, 2, "$root|chris|BT.L", false, 1, "BT.L", "", 1, "BT.L", "", 700.0, "", "", "", "", ""),
          (true, 2, "$root|chris|VOD.L", false, 1, "VOD.L", "", 1, "VOD.L", "", 500.0, "", "", "", "", ""),
          (false, 3, "$root|chris|VOD.L|NYC-0005", true, 0, "NYC-0005", "NYC-0005", "chris", "VOD.L", 1311544800000L, 500, 220.0, 222.0, null, null, null),
          (true, 1, "$root|steve", false, 2, "steve", "", 1, "", "", 2600.0, "", "", "", "", ""),
          (false, 2, "$root|steve|BT.L", false, 1, "BT.L", "", 1, "BT.L", "", 1000.0, "", "", "", "", ""),
          (true, 2, "$root|steve|VOD.L", false, 5, "VOD.L", "", 1, "VOD.L", "", 1600.0, "", "", "", "", ""),
          (false, 3, "$root|steve|VOD.L|NYC-0001", true, 0, "NYC-0001", "NYC-0001", "steve", "VOD.L", 1311544800000L, 100, 220.0, 222.0, null, null, null),
          (false, 3, "$root|steve|VOD.L|NYC-0002", true, 0, "NYC-0002", "NYC-0002", "steve", "VOD.L", 1311544800000L, 200, 220.0, 222.0, null, null, null),
          (false, 3, "$root|steve|VOD.L|NYC-0003", true, 0, "NYC-0003", "NYC-0003", "steve", "VOD.L", 1311544800000L, 300, 220.0, 222.0, null, null, null),
          (false, 3, "$root|steve|VOD.L|NYC-0004", true, 0, "NYC-0004", "NYC-0004", "steve", "VOD.L", 1311544800000L, 400, 220.0, 222.0, null, null, null),
          (false, 3, "$root|steve|VOD.L|NYC-0006", true, 0, "NYC-0006", "NYC-0006", "steve", "VOD.L", 1311544800000L, 600, 220.0, 222.0, null, null, null)
        )
      }

    }

    Scenario("test groupBy with source table update") {

      implicit val timeProvider: DefaultClock = new DefaultClock
      implicit val lifeCycle: LifecycleContainer = new LifecycleContainer
      implicit val metrics: MetricsProvider = new MetricsProviderImpl

      val (joinProvider, orders, prices, orderPrices, ordersProvider, pricesProvider, viewPortContainer) = setup()

      joinProvider.start()

      tickInData(ordersProvider, pricesProvider)

      joinProvider.runOnce()

      val queue = new OutboundRowPublishQueue()

      val columns = ViewPortColumnCreator.create(orderPrices, orderPrices.getTableDef.columns.map(_.name).toList)

      val viewport = viewPortContainer.create(RequestId.oneNew(),
        VuuUser("B"),
        ClientSessionId("A", "B", "C"),
        queue, orderPrices, ViewPortRange(0, 20), columns,
        SortSpec(List()),
        FilterSpec(""),
        GroupBy(orderPrices, columns.getColumnForName("trader").get, columns.getColumnForName("ric").get)
          .withSum("quantity")
          .withCount("trader")
          .asClause()
      )

      runContainersOnce(viewPortContainer, joinProvider)

      viewport.combinedQueueLength should be(3)

      viewPortContainer.openNode(viewport.id, "$root|chris")
      viewPortContainer.openNode(viewport.id, "$root|chris|VOD.L")

      runContainersOnce(viewPortContainer, joinProvider)

      ordersProvider.tick("NYC-0008", Map("orderId" -> "NYC-0008", "trader" -> "chris", "tradeTime" -> dateTime, "quantity" -> 700, "ric" -> "BT.L"))

      runContainersOnce(viewPortContainer, joinProvider)

      //viewport.combinedQueueLength should be(14) //as have no keys

      val updates = combineQs(viewport)

      //val arraysOfMaps = updates.filter(vpu => vpu.vpUpdate == RowUpdateType).map(vpu => vpu.table.pullRow(vpu.key.key, vpu.vp.getColumns).asInstanceOf[RowWithData].data).toArray

      assertVpEq(updates) {
        Table(
          ("_isOpen", "_depth", "_treeKey", "_isLeaf", "_childCount", "_caption", "orderId", "trader", "ric", "tradeTime", "quantity", "bid", "ask", "last", "open", "close"),
          (true, 1, "$root|chris", false, 2, "chris", "", 1, "", "", 2200.0, "", "", "", "", ""),
          (false, 2, "$root|chris|BT.L", false, 1, "BT.L", "", 1, "BT.L", "", 700.0, "", "", "", "", ""),
          (true, 2, "$root|chris|VOD.L", false, 5, "VOD.L", "", 1, "VOD.L", "", 1500.0, "", "", "", "", ""),
          (false, 3, "$root|chris|VOD.L|NYC-0001", true, 0, "NYC-0001", "NYC-0001", "chris", "VOD.L", 1311544800000L, 100, 220.0, 222.0, null, null, null),
          (false, 3, "$root|chris|VOD.L|NYC-0002", true, 0, "NYC-0002", "NYC-0002", "chris", "VOD.L", 1311544800000L, 200, 220.0, 222.0, null, null, null),
          (false, 3, "$root|chris|VOD.L|NYC-0003", true, 0, "NYC-0003", "NYC-0003", "chris", "VOD.L", 1311544800000L, 300, 220.0, 222.0, null, null, null),
          (false, 3, "$root|chris|VOD.L|NYC-0004", true, 0, "NYC-0004", "NYC-0004", "chris", "VOD.L", 1311544800000L, 400, 220.0, 222.0, null, null, null),
          (false, 3, "$root|chris|VOD.L|NYC-0005", true, 0, "NYC-0005", "NYC-0005", "chris", "VOD.L", 1311544800000L, 500, 220.0, 222.0, null, null, null),
          (false, 1, "$root|steve", false, 2, "steve", "", 1, "", "", 1600.0, "", "", "", "", "")
        )
      }

    }


    Scenario("test groupBy with calcd column in view port") {

      implicit val timeProvider: DefaultClock = new DefaultClock
      implicit val lifeCycle: LifecycleContainer = new LifecycleContainer
      implicit val metrics: MetricsProvider = new MetricsProviderImpl

      val (joinProvider, orders, prices, orderPrices, ordersProvider, pricesProvider, viewPortContainer) = setup()

      joinProvider.start()

      tickInData(ordersProvider, pricesProvider)

      joinProvider.runOnce()

      val queue = new OutboundRowPublishQueue()

      val columns = ViewPortColumnCreator.create(orderPrices, orderPrices.getTableDef.columns.map(_.name).toList ++ List("traderRic:String:=concatenate(trader, ric)"))

      val viewport = viewPortContainer.create(RequestId.oneNew(),
        VuuUser("B"),
        ClientSessionId("A", "B", "C"),
        queue, orderPrices, ViewPortRange(0, 20), columns,
        SortSpec(List()),
        FilterSpec(""),
        GroupBy(orderPrices, columns.getColumnForName("trader").get, columns.getColumnForName("ric").get)
          .withSum("quantity")
          .withCount("trader")
          .asClause()
      )

      runContainersOnce(viewPortContainer, joinProvider)

      viewport.combinedQueueLength should be(3)

      viewPortContainer.openNode(viewport.id, "$root|chris")
      viewPortContainer.openNode(viewport.id, "$root|chris|VOD.L")
      viewPortContainer.openNode(viewport.id, "$root|chris|BT.L")

      runContainersOnce(viewPortContainer, joinProvider)

      ordersProvider.tick("NYC-0008", Map("orderId" -> "NYC-0008", "trader" -> "chris", "tradeTime" -> dateTime, "quantity" -> 700, "ric" -> "BT.L"))

      runContainersOnce(viewPortContainer, joinProvider)

      val updates = combineQs(viewport)

      assertVpEq(updates) {
        Table(
          ("_isOpen", "_depth", "_treeKey", "_isLeaf", "_childCount", "_caption", "orderId", "trader", "ric", "tradeTime", "quantity", "bid", "ask", "last", "open", "close", "traderRic"),
          (true, 1, "$root|chris", false, 2, "chris", "", 1, "", "", 2200.0, "", "", "", "", "", ""),
          (true, 2, "$root|chris|BT.L", false, 1, "BT.L", "", 1, "BT.L", "", 700.0, "", "", "", "", "", ""),
          (false, 3, "$root|chris|BT.L|NYC-0008", true, 0, "NYC-0008", "NYC-0008", "chris", "BT.L", 1437732000000L, 700, 500.0, 501.0, null, null, null, "chrisBT.L"),
          (true, 2, "$root|chris|VOD.L", false, 5, "VOD.L", "", 1, "VOD.L", "", 1500.0, "", "", "", "", "", ""),
          (false, 3, "$root|chris|VOD.L|NYC-0001", true, 0, "NYC-0001", "NYC-0001", "chris", "VOD.L", 1311544800000L, 100, 220.0, 222.0, null, null, null, "chrisVOD.L"),
          (false, 3, "$root|chris|VOD.L|NYC-0002", true, 0, "NYC-0002", "NYC-0002", "chris", "VOD.L", 1311544800000L, 200, 220.0, 222.0, null, null, null, "chrisVOD.L"),
          (false, 3, "$root|chris|VOD.L|NYC-0003", true, 0, "NYC-0003", "NYC-0003", "chris", "VOD.L", 1311544800000L, 300, 220.0, 222.0, null, null, null, "chrisVOD.L"),
          (false, 3, "$root|chris|VOD.L|NYC-0004", true, 0, "NYC-0004", "NYC-0004", "chris", "VOD.L", 1311544800000L, 400, 220.0, 222.0, null, null, null, "chrisVOD.L"),
          (false, 3, "$root|chris|VOD.L|NYC-0005", true, 0, "NYC-0005", "NYC-0005", "chris", "VOD.L", 1311544800000L, 500, 220.0, 222.0, null, null, null, "chrisVOD.L"),
          (false, 1, "$root|steve", false, 2, "steve", "", 1, "", "", 1600.0, "", "", "", "", "", "")
        )
      }
    }

    Scenario("test groupBy with calcd column as tree node") {

      implicit val timeProvider: DefaultClock = new DefaultClock
      implicit val lifeCycle: LifecycleContainer = new LifecycleContainer
      implicit val metrics: MetricsProvider = new MetricsProviderImpl

      val (joinProvider, orders, prices, orderPrices, ordersProvider, pricesProvider, viewPortContainer) = setup()

      joinProvider.start()

      tickInData(ordersProvider, pricesProvider)

      joinProvider.runOnce()

      val queue = new OutboundRowPublishQueue()

      val columns = ViewPortColumnCreator.create(orderPrices, orderPrices.getTableDef.columns.map(_.name).toList ++ List("traderRic:String:=concatenate(trader, ric)"))

      val viewport = viewPortContainer.create(RequestId.oneNew(),
        VuuUser("B"),
        ClientSessionId("A", "B", "C"),
        queue, orderPrices, ViewPortRange(0, 20), columns,
        SortSpec(List()),
        FilterSpec(""),
        GroupBy(orderPrices, columns.getColumnForName("traderRic").get)
          .withSum("quantity")
          .withCount("trader")
          .asClause()
      )

      runContainersOnce(viewPortContainer, joinProvider)

      viewPortContainer.openNode(viewport.id, "$root|chrisVOD.L")
      viewPortContainer.openNode(viewport.id, "$root|steveBT.L")

      runContainersOnce(viewPortContainer, joinProvider)

      ordersProvider.tick("NYC-0008", Map("orderId" -> "NYC-0008", "trader" -> "chris", "tradeTime" -> dateTime, "quantity" -> 700, "ric" -> "BT.L"))

      runContainersOnce(viewPortContainer, joinProvider)

      val updates = combineQs(viewport)

      assertVpEq(updates) {
        Table(
          ("_isOpen", "_depth", "_treeKey", "_isLeaf", "_childCount", "_caption", "orderId", "trader", "ric", "tradeTime", "quantity", "bid", "ask", "last", "open", "close", "traderRic"),
          (false, 1, "$root|chrisBT.L", false, 1, "chrisBT.L", "", 1, "", "", 700.0, "", "", "", "", "", "chrisBT.L"),
          (true, 1, "$root|chrisVOD.L", false, 5, "chrisVOD.L", "", 1, "", "", 1500.0, "", "", "", "", "", "chrisVOD.L"),
          (false, 2, "$root|chrisVOD.L|NYC-0001", true, 0, "NYC-0001", "NYC-0001", "chris", "VOD.L", 1311544800000L, 100, 220.0, 222.0, null, null, null, "chrisVOD.L"),
          (false, 2, "$root|chrisVOD.L|NYC-0002", true, 0, "NYC-0002", "NYC-0002", "chris", "VOD.L", 1311544800000L, 200, 220.0, 222.0, null, null, null, "chrisVOD.L"),
          (false, 2, "$root|chrisVOD.L|NYC-0003", true, 0, "NYC-0003", "NYC-0003", "chris", "VOD.L", 1311544800000L, 300, 220.0, 222.0, null, null, null, "chrisVOD.L"),
          (false, 2, "$root|chrisVOD.L|NYC-0004", true, 0, "NYC-0004", "NYC-0004", "chris", "VOD.L", 1311544800000L, 400, 220.0, 222.0, null, null, null, "chrisVOD.L"),
          (false, 2, "$root|chrisVOD.L|NYC-0005", true, 0, "NYC-0005", "NYC-0005", "chris", "VOD.L", 1311544800000L, 500, 220.0, 222.0, null, null, null, "chrisVOD.L"),
          (true, 1, "$root|steveBT.L", false, 1, "steveBT.L", "", 1, "", "", 1000.0, "", "", "", "", "", "steveBT.L"),
          (false, 2, "$root|steveBT.L|NYC-0007", true, 0, "NYC-0007", "NYC-0007", "steve", "BT.L", 1311544800000L, 1000, 500.0, 501.0, null, null, null, "steveBT.L"),
          (false, 1, "$root|steveVOD.L", false, 1, "steveVOD.L", "", 1, "", "", 600.0, "", "", "", "", "", "steveVOD.L")
        )
      }
    }

    Scenario("test distinct aggregation") {

      implicit val timeProvider: DefaultClock = new DefaultClock
      implicit val lifeCycle: LifecycleContainer = new LifecycleContainer
      implicit val metrics: MetricsProvider = new MetricsProviderImpl

      val (joinProvider, orders, prices, orderPrices, ordersProvider, pricesProvider, viewPortContainer) = setup()

      joinProvider.start()

      tickInData(ordersProvider, pricesProvider)

      joinProvider.runOnce()

      val queue = new OutboundRowPublishQueue()

      val columns = ViewPortColumnCreator.create(orderPrices, orderPrices.getTableDef.columns.map(_.name).toList ++ List("traderRic:String:=concatenate(trader, ric)"))

      val viewport = viewPortContainer.create(RequestId.oneNew(),
        VuuUser("B"),
        ClientSessionId("A", "B", "C"),
        queue, orderPrices, ViewPortRange(0, 20), columns,
        SortSpec(List()),
        FilterSpec(""),
        GroupBy(orderPrices, columns.getColumnForName("traderRic").get)
          .withDistinct("trader")
          .asClause()
      )

      runContainersOnce(viewPortContainer, joinProvider)

      viewPortContainer.openNode(viewport.id, "$root|chrisVOD.L")
      viewPortContainer.openNode(viewport.id, "$root|steveBT.L")

      runContainersOnce(viewPortContainer, joinProvider)

      ordersProvider.tick("NYC-0008", Map("orderId" -> "NYC-0008", "trader" -> "chris", "tradeTime" -> dateTime, "quantity" -> 700, "ric" -> "BT.L"))

      runContainersOnce(viewPortContainer, joinProvider)

      val updates = combineQs(viewport)

      assertVpEq(updates) {
        Table(
          ("_isOpen", "_depth", "_treeKey", "_isLeaf", "_childCount", "_caption", "orderId", "trader", "ric", "tradeTime", "quantity", "bid", "ask", "last", "open", "close", "traderRic"),
          (false, 1, "$root|chrisBT.L", false, 1, "chrisBT.L", "", "chris", "", "", "", "", "", "", "", "", "chrisBT.L"),
          (true, 1, "$root|chrisVOD.L", false, 5, "chrisVOD.L", "", "chris", "", "", "", "", "", "", "", "", "chrisVOD.L"),
          (false, 2, "$root|chrisVOD.L|NYC-0001", true, 0, "NYC-0001", "NYC-0001", "chris", "VOD.L", 1311544800000L, 100, 220.0, 222.0, null, null, null, "chrisVOD.L"),
          (false, 2, "$root|chrisVOD.L|NYC-0002", true, 0, "NYC-0002", "NYC-0002", "chris", "VOD.L", 1311544800000L, 200, 220.0, 222.0, null, null, null, "chrisVOD.L"),
          (false, 2, "$root|chrisVOD.L|NYC-0003", true, 0, "NYC-0003", "NYC-0003", "chris", "VOD.L", 1311544800000L, 300, 220.0, 222.0, null, null, null, "chrisVOD.L"),
          (false, 2, "$root|chrisVOD.L|NYC-0004", true, 0, "NYC-0004", "NYC-0004", "chris", "VOD.L", 1311544800000L, 400, 220.0, 222.0, null, null, null, "chrisVOD.L"),
          (false, 2, "$root|chrisVOD.L|NYC-0005", true, 0, "NYC-0005", "NYC-0005", "chris", "VOD.L", 1311544800000L, 500, 220.0, 222.0, null, null, null, "chrisVOD.L"),
          (true, 1, "$root|steveBT.L", false, 1, "steveBT.L", "", "steve", "", "", "", "", "", "", "", "", "steveBT.L"),
          (false, 2, "$root|steveBT.L|NYC-0007", true, 0, "NYC-0007", "NYC-0007", "steve", "BT.L", 1311544800000L, 1000, 500.0, 501.0, null, null, null, "steveBT.L"),
          (false, 1, "$root|steveVOD.L", false, 1, "steveVOD.L", "", "steve", "", "", "", "", "", "", "", "", "steveVOD.L")
        )
      }
    }

    Scenario("test distinct aggregation multi-value") {

      implicit val timeProvider: DefaultClock = new DefaultClock
      implicit val lifeCycle: LifecycleContainer = new LifecycleContainer
      implicit val metrics: MetricsProvider = new MetricsProviderImpl

      val (joinProvider, orders, prices, orderPrices, ordersProvider, pricesProvider, viewPortContainer) = setup()

      joinProvider.start()

      tickInData(ordersProvider, pricesProvider)

      joinProvider.runOnce()

      val queue = new OutboundRowPublishQueue()

      val columns = ViewPortColumnCreator.create(orderPrices, orderPrices.getTableDef.columns.map(_.name).toList ++ List("traderRic:String:=concatenate(trader, ric)"))

      val viewport = viewPortContainer.create(RequestId.oneNew(),
        VuuUser("B"),
        ClientSessionId("A", "B", "C"),
        queue, orderPrices, ViewPortRange(0, 20), columns,
        SortSpec(List()),
        FilterSpec(""),
        GroupBy(orderPrices, columns.getColumnForName("traderRic").get)
          .withDistinct("orderId")
          .asClause()
      )

      runContainersOnce(viewPortContainer, joinProvider)

      viewPortContainer.openNode(viewport.id, "$root|chrisVOD.L")
      viewPortContainer.openNode(viewport.id, "$root|steveBT.L")

      runContainersOnce(viewPortContainer, joinProvider)

      ordersProvider.tick("NYC-0008", Map("orderId" -> "NYC-0008", "trader" -> "chris", "tradeTime" -> dateTime, "quantity" -> 700, "ric" -> "BT.L"))

      runContainersOnce(viewPortContainer, joinProvider)

      val updates = combineQs(viewport)

      assertVpEq(updates) {
        Table(
          ("_isOpen", "_depth", "_treeKey", "_isLeaf", "_childCount", "_caption", "orderId", "trader", "ric", "tradeTime", "quantity", "bid", "ask", "last", "open", "close", "traderRic"),
          (false, 1, "$root|chrisBT.L", false, 1, "chrisBT.L", "NYC-0008", "", "", "", "", "", "", "", "", "", "chrisBT.L"),
          (true, 1, "$root|chrisVOD.L", false, 5, "chrisVOD.L", "NYC-0005,NYC-0004,NYC-0003,NYC-0002,NYC-0001", "", "", "", "", "", "", "", "", "", "chrisVOD.L"),
          (false, 2, "$root|chrisVOD.L|NYC-0001", true, 0, "NYC-0001", "NYC-0001", "chris", "VOD.L", 1311544800000L, 100, 220.0, 222.0, null, null, null, "chrisVOD.L"),
          (false, 2, "$root|chrisVOD.L|NYC-0002", true, 0, "NYC-0002", "NYC-0002", "chris", "VOD.L", 1311544800000L, 200, 220.0, 222.0, null, null, null, "chrisVOD.L"),
          (false, 2, "$root|chrisVOD.L|NYC-0003", true, 0, "NYC-0003", "NYC-0003", "chris", "VOD.L", 1311544800000L, 300, 220.0, 222.0, null, null, null, "chrisVOD.L"),
          (false, 2, "$root|chrisVOD.L|NYC-0004", true, 0, "NYC-0004", "NYC-0004", "chris", "VOD.L", 1311544800000L, 400, 220.0, 222.0, null, null, null, "chrisVOD.L"),
          (false, 2, "$root|chrisVOD.L|NYC-0005", true, 0, "NYC-0005", "NYC-0005", "chris", "VOD.L", 1311544800000L, 500, 220.0, 222.0, null, null, null, "chrisVOD.L"),
          (true, 1, "$root|steveBT.L", false, 1, "steveBT.L", "NYC-0007", "", "", "", "", "", "", "", "", "", "steveBT.L"),
          (false, 2, "$root|steveBT.L|NYC-0007", true, 0, "NYC-0007", "NYC-0007", "steve", "BT.L", 1311544800000L, 1000, 500.0, 501.0, null, null, null, "steveBT.L"),
          (false, 1, "$root|steveVOD.L", false, 1, "steveVOD.L", "NYC-0006", "", "", "", "", "", "", "", "", "", "steveVOD.L")
        )
      }
    }


  }
}
