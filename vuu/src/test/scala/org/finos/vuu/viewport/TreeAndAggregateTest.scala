package org.finos.vuu.viewport

import org.finos.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.{Clock, DefaultClock}
import org.finos.vuu.client.messages.RequestId
import org.finos.vuu.core.auths.VuuUser
import org.finos.vuu.core.table.{RowWithData, ViewPortColumnCreator}
import org.finos.vuu.net.{ClientSessionId, FilterSpec, SortSpec}
import org.finos.vuu.util.OutboundRowPublishQueue
import org.finos.vuu.util.table.TableAsserts.*
import org.scalatest.GivenWhenThen
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers
import org.scalatest.prop.Tables.Table

import java.time.{LocalDateTime, ZoneId}

class TreeAndAggregateTest extends AnyFeatureSpec with Matchers with GivenWhenThen with ViewPortSetup {

  val dateTime: Long = LocalDateTime.of(2015, 7, 24, 11, 0).atZone(ZoneId.of("Europe/London")).toInstant.toEpochMilli

    Scenario("check we can create a simple groupby tree viewport"){

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
        ClientSessionId("A", "C"),
        queue, orderPrices, ViewPortRange(0, 20), columns,
        SortSpec(List()),
        FilterSpec(""),
        GroupBy(orderPrices, columns.getColumnForName("trader").get, columns.getColumnForName("ric").get)
          .withSum("quantity")
          .withCount("trader")
          .asClause()
      )

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
      viewPortContainer.openNode(viewport.id, "$root|steve|BT.L")
      viewPortContainer.closeNode(viewport.id, "$root|steve|VOD.L")

      //expect realised rows
      runContainersOnce(viewPortContainer, joinProvider)

      //viewport.combinedQueueLength should be(14) //as have no keys

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
          (true, 2, "$root|steve|BT.L", false, 2, "BT.L", "", 1, "BT.L", "", 1500.0, "", "", "", "", ""),
          (false, 3, "$root|steve|BT.L|NYC-0007", true, 0, "NYC-0007", "NYC-0007", "steve", "BT.L", 1311544800000L, 1000, 500.0, 501.0, null, null, null),
          (false, 3, "$root|steve|BT.L|NYC-0008", true, 0, "NYC-0008", "NYC-0008", "steve", "BT.L", 1311544800000L, 500, 500.0, 501.0, null, null, null),
          (false, 2, "$root|steve|VOD.L", false, 1, "VOD.L", "", 1, "VOD.L", "", 600.0, "", "", "", "", "")
        )
      }

      val preHash = viewport.getStructuralHashCode()

      When("we close a node")
      viewPortContainer.closeNode(viewport.id, "$root|steve")

      val postHash = viewport.getStructuralHashCode()

      runContainersOnce(viewPortContainer, joinProvider)

      Then("we should expect to get a vp update for that node")
      assertVpEq(combineQs(viewport)) {
        Table(
          ("_isOpen" ,"_depth"  ,"_treeKey","_isLeaf" ,"_childCount","_caption","orderId" ,"trader"  ,"ric"     ,"tradeTime","quantity","bid"     ,"ask"     ,"last"    ,"open"    ,"close"   ),
          (false     ,1         ,"$root|steve",false     ,2         ,"steve"   ,""        ,1         ,""        ,""        ,2100.0    ,""        ,""        ,""        ,""        ,""        )
        )
      }

      And("When the container has run again")
      viewPortContainer.runGroupByOnce()
      //expect realised rows
      viewPortContainer.runOnce()

//      Then("we should see the children added")
//      assertVpEq(combineQs(viewport)) {
//        Table(
//          ("_isOpen" ,"_depth"  ,"_treeKey","_isLeaf" ,"_childCount","_caption","orderId" ,"trader"  ,"ric"     ,"tradeTime","quantity","bid"     ,"ask"     ,"last"    ,"open"    ,"close"   ),
//          (false     ,1         ,"$root/steve",false     ,2         ,"steve"   ,""        ,"[1]"     ,""        ,""        ,"Σ 2100.0",""        ,""        ,""        ,""        ,""        )
//        )
//      }



//      updates2.size should be (1)
//      updates2(0).vpUpdate should equal(SizeUpdateType)
//      updates2(0).vp.size should be (9)

      viewPortContainer.openNode(viewport.id, "$root|steve")

      viewPortContainer.runGroupByOnce()

      //expect realised rows
      viewPortContainer.runOnce()

      val updates3 = combineQs(viewport)

      assertVpEq(updates3) {
        Table(
          ("_isOpen", "_depth", "_treeKey", "_isLeaf", "_childCount", "_caption", "orderId", "trader", "ric", "tradeTime", "quantity", "bid", "ask", "last", "open", "close"),
          (true, 1, "$root|steve", false, 2, "steve", "", 1, "", "", 2100.0, "", "", "", "", ""),
          (true, 2, "$root|steve|BT.L", false, 2, "BT.L", "", 1, "BT.L", "", 1500.0, "", "", "", "", ""),
          (false, 3, "$root|steve|BT.L|NYC-0007", true, 0, "NYC-0007", "NYC-0007", "steve", "BT.L", 1311544800000L, 1000, 500.0, 501.0, null, null, null),
          (false, 3, "$root|steve|BT.L|NYC-0008", true, 0, "NYC-0008", "NYC-0008", "steve", "BT.L", 1311544800000L, 500, 500.0, 501.0, null, null, null),
          (false, 2, "$root|steve|VOD.L", false, 1, "VOD.L", "", 1, "VOD.L", "", 600.0, "", "", "", "", "")
        )
      }

      pricesProvider.tick("BT.L", Map("ric" -> "BT.L", "bid" -> 510.0, "ask" -> 511.0))

      runContainersOnce(viewPortContainer, joinProvider)

      val updates4 = combineQs(viewport)

      assertVpEq(updates4) {
        Table(
          ("_isOpen", "_depth", "_treeKey", "_isLeaf", "_childCount", "_caption", "orderId", "trader", "ric", "tradeTime", "quantity", "bid", "ask", "last", "open", "close"),
          (true, 1, "$root|steve", false, 2, "steve", "", 1, "", "", 2100.0, "", "", "", "", ""),
          (true, 2, "$root|steve|BT.L", false, 2, "BT.L", "", 1, "BT.L", "", 1500.0, "", "", "", "", ""),
          (false, 3, "$root|steve|BT.L|NYC-0007", true, 0, "NYC-0007", "NYC-0007", "steve", "BT.L", 1311544800000L, 1000, 510.0, 511.0, null, null, null),
          (false, 3, "$root|steve|BT.L|NYC-0008", true, 0, "NYC-0008", "NYC-0008", "steve", "BT.L", 1311544800000L, 500, 510.0, 511.0, null, null, null)
        )
      }

      lifeCycle.stop()
  }

  Scenario("test filter in groupBy") {

    implicit val clock : Clock = new DefaultClock
    implicit val lifeCycle : LifecycleContainer = new LifecycleContainer
    implicit val metrics: MetricsProvider = new MetricsProviderImpl

    val (joinProvider, orders, prices, orderPrices, ordersProvider, pricesProvider, viewPortContainer) = setup()

    joinProvider.start()

    tickInData(ordersProvider, pricesProvider)

    joinProvider.runOnce()

    val queue = new OutboundRowPublishQueue()

    val columns = ViewPortColumnCreator.create(orderPrices, orderPrices.getTableDef.columns.map(_.name).toList)

    val viewport = viewPortContainer.create(RequestId.oneNew(),
      VuuUser("B"),
      ClientSessionId("A", "C"),
      queue, orderPrices, ViewPortRange(0, 20), columns,
      SortSpec(List()),
      FilterSpec(""),
      GroupBy(orderPrices, columns.getColumnForName("trader").get, columns.getColumnForName("ric").get)
        .withSum("quantity")
        .withCount("trader")
        .asClause()
    )

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
    viewPortContainer.openNode(viewport.id, "$root|steve|BT.L")

    viewPortContainer.runOnce()

    viewPortContainer.runGroupByOnce()

    //expect realised rows
    viewPortContainer.runOnce()

    //viewport.combinedQueueLength should be(14) //as have no keys

    val updates = combineQs(viewport)

    val arraysOfMaps = updates.filter(vpu => vpu.vpUpdate == RowUpdateType).map(vpu => vpu.table.pullRow(vpu.key.key, vpu.vp.getColumns).asInstanceOf[RowWithData].data).toArray

    assertVpEq(updates) {
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
        (true, 2, "$root|steve|BT.L", false, 2, "BT.L", "", 1, "BT.L", "", 1500.0, "", "", "", "", ""),
        (false, 3, "$root|steve|BT.L|NYC-0007", true, 0, "NYC-0007", "NYC-0007", "steve", "BT.L", 1311544800000L, 1000, 500.0, 501.0, null, null, null),
        (false, 3, "$root|steve|BT.L|NYC-0008", true, 0, "NYC-0008", "NYC-0008", "steve", "BT.L", 1311544800000L, 500, 500.0, 501.0, null, null, null),
        (false, 2, "$root|steve|VOD.L", false, 1, "VOD.L", "", 1, "VOD.L", "", 600.0, "", "", "", "", "")
      )
    }

    lifeCycle.stop()
  }


}

