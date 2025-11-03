package org.finos.vuu.viewport

import org.finos.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.{Clock, DefaultClock}
import org.finos.vuu.client.messages.RequestId
import org.finos.vuu.core.auths.VuuUser
import org.finos.vuu.core.table.ViewPortColumnCreator
import org.finos.vuu.net.{ClientSessionId, FilterSpec, SortDef, SortSpec}
import org.finos.vuu.util.OutboundRowPublishQueue
import org.finos.vuu.util.table.TableAsserts.assertVpEq
import org.scalatest.GivenWhenThen
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers
import org.scalatest.prop.Tables.Table

import java.time.{LocalDateTime, ZoneId}

class TreeSortTest extends AnyFeatureSpec with Matchers with GivenWhenThen with ViewPortSetup {

  val dateTime: Long = LocalDateTime.of(2015, 7, 24, 11, 0).atZone(ZoneId.of("Europe/London")).toInstant.toEpochMilli

  Scenario("test groupBy tree structure update") {

    implicit val clock: Clock = new DefaultClock
    implicit val lifeCycle: LifecycleContainer = new LifecycleContainer
    implicit val metrics: MetricsProvider = new MetricsProviderImpl

    val (joinProvider, orders, prices, orderPrices, ordersProvider, pricesProvider, viewPortContainer) = setup()

    joinProvider.start()

    tickInData(ordersProvider, pricesProvider)

    joinProvider.runOnce()

    val queue = new OutboundRowPublishQueue()

    val columns = orderPrices.getTableDef.columns

    val vpColumns = ViewPortColumnCreator.create(orderPrices, columns.map(_.name).toList)

    val viewport = viewPortContainer.create(RequestId.oneNew(),
      VuuUser("B"),
      ClientSessionId("A", "C"),
      queue, orderPrices, ViewPortRange(0, 20), vpColumns,
      SortSpec(List(
        SortDef("trader", 'D'),
        SortDef("ric", 'D')
      )),
      FilterSpec(""),
      GroupBy(orderPrices, vpColumns.getColumnForName("trader").get, vpColumns.getColumnForName("ric").get)
        .withSum("quantity")
        .withCount("trader")
        .asClause()
    )

    runContainersOnce(viewPortContainer, joinProvider)

    assertVpEq(filterByVpId(combineQs(viewport), viewport)) {
      Table(
        ("_isOpen", "_depth", "_treeKey", "_isLeaf", "_childCount", "_caption", "orderId", "trader", "ric", "tradeTime", "quantity", "bid", "ask", "last", "open", "close"),
        (false, 1, "$root|chris", false, 1, "chris", "", 1, "", "", 1500.0, "", "", "", "", ""),
        (false, 1, "$root|steve", false, 2, "steve", "", 1, "", "", 2100.0, "", "", "", "", "")
      )
    }

    viewPortContainer.openNode(viewport.id, "$root|chris")
    viewPortContainer.openNode(viewport.id, "$root|chris|VOD.L")
    viewPortContainer.openNode(viewport.id, "$root|steve")
    viewPortContainer.closeNode(viewport.id, "$root|steve|BT.L")

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
        (false, 2, "$root|steve|BT.L", false, 1, "BT.L", "", 1, "BT.L", "", 1000.0, "", "", "", "", "")
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
}
