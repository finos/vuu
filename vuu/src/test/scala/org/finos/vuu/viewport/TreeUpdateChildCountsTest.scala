package org.finos.vuu.viewport

import org.finos.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.{Clock, DefaultClock}
import org.finos.vuu.client.messages.RequestId
import org.finos.vuu.core.auths.VuuUser
import org.finos.vuu.core.table.ViewPortColumnCreator
import org.finos.vuu.net.{ClientSessionId, FilterSpec, SortSpec}
import org.finos.vuu.util.OutboundRowPublishQueue
import org.finos.vuu.util.table.TableAsserts.assertVpEq
import org.finos.vuu.viewport.TestTimeStamp.EPOCH_DEFAULT
import org.scalatest.GivenWhenThen
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers
import org.scalatest.prop.Tables.Table

import java.time.{LocalDateTime, ZoneId}

class TreeUpdateChildCountsTest extends AnyFeatureSpec with Matchers with GivenWhenThen with ViewPortSetup {

  val dateTime: Long = LocalDateTime.of(2015, 7, 24, 11, 0).atZone(ZoneId.of("Europe/London")).toInstant.toEpochMilli

  Scenario("Check rowcount is updated when children are added/removed") {

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
      SortSpec(List()),
      FilterSpec(""),
      GroupBy(orderPrices, vpColumns.getColumnForName("ric").get)
        .withCount("ric")
        .asClause()
    )

    runContainersOnce(viewPortContainer, joinProvider)

    assertVpEq(filterByVpId(combineQs(viewport), viewport)) {
      Table(
        ("_isOpen", "_depth", "_treeKey", "_isLeaf", "_childCount", "_caption", "orderId", "trader", "ric", "tradeTime", "quantity", "bid", "ask", "last", "open", "close"),
        (false, 1, "$root|BT.L", false, 2, "BT.L", "", "", 1, "", "", "", "", "", "", ""),
        (false, 1, "$root|VOD.L", false, 6, "VOD.L", "", "", 1, "", "", "", "", "", "", "")
      )
    }

    //add another row...
    ordersProvider.tick("NYC-0009", Map("orderId" -> "NYC-0009", "trader" -> "steve", "tradeTime" -> EPOCH_DEFAULT, "quantity" -> 1234, "ric" -> "BT.L"))

    runContainersOnce(viewPortContainer, joinProvider)

    val updates = filterByVpId(combineQs(viewport), viewport)
    //check child count updated
    assertVpEq(updates) {
      Table(
        ("_isOpen", "_depth", "_treeKey", "_isLeaf", "_childCount", "_caption", "orderId", "trader", "ric", "tradeTime", "quantity", "bid", "ask", "last", "open", "close"),
        (false, 1, "$root|BT.L", false, 3, "BT.L", "", "", 1, "", "", "", "", "", "", "")
      )
    }

  }

  Scenario("Check aggregates are updated") {

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
      SortSpec(List()),
      FilterSpec(""),
      GroupBy(orderPrices, vpColumns.getColumnForName("ric").get)
        .withCount("ric")
        .withSum("quantity")
        .asClause()
    )

    runContainersOnce(viewPortContainer, joinProvider)

    assertVpEq(filterByVpId(combineQs(viewport), viewport)) {
      Table(
        ("_isOpen", "_depth", "_treeKey", "_isLeaf", "_childCount", "_caption", "orderId", "trader", "ric", "tradeTime", "quantity", "bid", "ask", "last", "open", "close"),
        (false, 1, "$root|BT.L", false, 2, "BT.L", "", "", 1, "", 1500.0, "", "", "", "", ""),
        (false, 1, "$root|VOD.L", false, 6, "VOD.L", "", "", 1, "", 2100.0, "", "", "", "", "")
      )
    }

    //add another row...
    ordersProvider.tick("NYC-0009", Map("orderId" -> "NYC-0009", "trader" -> "steve", "tradeTime" -> EPOCH_DEFAULT, "quantity" -> 1234, "ric" -> "BT.L"))

    runContainersOnce(viewPortContainer, joinProvider)

    //check child count updated
    assertVpEq(filterByVpId(combineQs(viewport), viewport)) {
      Table(
        ("_isOpen" ,"_depth"  ,"_treeKey","_isLeaf" ,"_childCount","_caption","orderId" ,"trader"  ,"ric"     ,"tradeTime","quantity","bid"     ,"ask"     ,"last"    ,"open"    ,"close"   ),
        (false     ,1         ,"$root|BT.L",false     ,3         ,"BT.L"    ,""        ,""        ,1         ,""        ,2734.0    ,""        ,""        ,""        ,""        ,""        )
      )
    }

    ordersProvider.tick("NYC-0009", Map("orderId" -> "NYC-0009", "trader" -> "steve", "tradeTime" -> EPOCH_DEFAULT, "quantity" -> 1235, "ric" -> "BT.L"))

    runContainersOnce(viewPortContainer, joinProvider)

    //check child count updated
    assertVpEq(filterByVpId(combineQs(viewport), viewport)) {
      Table(
        ("_isOpen" ,"_depth"  ,"_treeKey","_isLeaf" ,"_childCount","_caption","orderId" ,"trader"  ,"ric"     ,"tradeTime","quantity","bid"     ,"ask"     ,"last"    ,"open"    ,"close"   ),
        (false     ,1         ,"$root|BT.L",false     ,3         ,"BT.L"    ,""        ,""        ,1         ,""        ,2735.0    ,""        ,""        ,""        ,""        ,""        )
      )
    }

  }

}
