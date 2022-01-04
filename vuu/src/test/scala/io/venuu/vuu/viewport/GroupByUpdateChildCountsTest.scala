package io.venuu.vuu.viewport

import io.venuu.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import io.venuu.toolbox.lifecycle.LifecycleContainer
import io.venuu.toolbox.time.{Clock, DefaultClock}
import io.venuu.vuu.client.messages.RequestId
import io.venuu.vuu.net.{ClientSessionId, FilterSpec, SortSpec}
import io.venuu.vuu.util.OutboundRowPublishQueue
import io.venuu.vuu.util.table.TableAsserts.assertVpEq
import io.venuu.vuu.viewport.TestTimeStamp.EPOCH_DEFAULT
import org.joda.time.{DateTime, DateTimeZone}
import org.scalatest.GivenWhenThen
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers
import org.scalatest.prop.Tables.Table

class GroupByUpdateChildCountsTest extends AnyFeatureSpec with Matchers with GivenWhenThen with ViewPortSetup {

  val dateTime: Long = new DateTime(2015, 7, 24, 11, 0, DateTimeZone.forID("Europe/London")).toDateTime.toInstant.getMillis

  Scenario("Check rowcount is updated when children are added/removed") {

    implicit val clock: Clock = new DefaultClock
    implicit val lifeCycle: LifecycleContainer = new LifecycleContainer
    implicit val metrics: MetricsProvider = new MetricsProviderImpl

    val (joinProvider, orders, prices, orderPrices, ordersProvider, pricesProvider, viewPortContainer) = setup()

    joinProvider.start()

    tickInData(ordersProvider, pricesProvider)

    joinProvider.runOnce()

    val queue = new OutboundRowPublishQueue()
    val highPriorityQueue = new OutboundRowPublishQueue()

    val columns = orderPrices.getTableDef.columns

    val viewport = viewPortContainer.create(RequestId.oneNew(),
      ClientSessionId("A", "B"),
      queue, highPriorityQueue, orderPrices, ViewPortRange(0, 20), columns.toList,
      SortSpec(List()),
      FilterSpec(""),
      GroupBy(orderPrices, "ric")
        .withCount("ric")
        .asClause()
    )

    runContainersOnce(viewPortContainer, joinProvider)

    assertVpEq(filterByVpId(combineQs(viewport), viewport)) {
      Table(
        ("_isOpen" ,"_depth"  ,"_treeKey","_isLeaf" ,"_childCount","_caption","orderId" ,"trader"  ,"ric"     ,"tradeTime","quantity","bid"     ,"ask"     ,"last"    ,"open"    ,"close"   ),
        (false     ,1         ,"$root|VOD.L",false     ,6         ,"VOD.L"   ,""        ,""        ,"[1]"     ,""        ,""        ,""        ,""        ,""        ,""        ,""        ),
        (false     ,1         ,"$root|BT.L",false     ,2         ,"BT.L"    ,""        ,""        ,"[1]"     ,""        ,""        ,""        ,""        ,""        ,""        ,""        )
      )
    }

    //add another row...
    ordersProvider.tick("NYC-0009", Map("orderId" -> "NYC-0009", "trader" -> "steve", "tradeTime" -> EPOCH_DEFAULT, "quantity" -> 1234, "ric" -> "BT.L"))

    runContainersOnce(viewPortContainer, joinProvider)

    val updates = filterByVpId(combineQs(viewport), viewport)
    //check child count updated
    assertVpEq(updates) {
      Table(
        ("_isOpen" ,"_depth"  ,"_treeKey","_isLeaf" ,"_childCount","_caption","orderId" ,"trader"  ,"ric"     ,"tradeTime","quantity","bid"     ,"ask"     ,"last"    ,"open"    ,"close"   ),
        (false     ,1         ,"$root|BT.L",false     ,3         ,"BT.L"    ,""        ,""        ,"[1]"     ,""        ,""        ,""        ,""        ,""        ,""        ,""        )
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
    val highPriorityQueue = new OutboundRowPublishQueue()

    val columns = orderPrices.getTableDef.columns

    val viewport = viewPortContainer.create(RequestId.oneNew(),
      ClientSessionId("A", "B"),
      queue, highPriorityQueue, orderPrices, ViewPortRange(0, 20), columns.toList,
      SortSpec(List()),
      FilterSpec(""),
      GroupBy(orderPrices, "ric")
        .withCount("ric")
        .withSum("quantity")
        .asClause()
    )

    runContainersOnce(viewPortContainer, joinProvider)

    assertVpEq(filterByVpId(combineQs(viewport), viewport)) {
      Table(
        ("_isOpen" ,"_depth"  ,"_treeKey","_isLeaf" ,"_childCount","_caption","orderId" ,"trader"  ,"ric"     ,"tradeTime","quantity","bid"     ,"ask"     ,"last"    ,"open"    ,"close"   ),
        (false     ,1         ,"$root|VOD.L",false     ,6         ,"VOD.L"   ,""        ,""        ,"[1]"     ,""        ,"Σ 2100.0",""        ,""        ,""        ,""        ,""        ),
        (false     ,1         ,"$root|BT.L",false     ,2         ,"BT.L"    ,""        ,""        ,"[1]"     ,""        ,"Σ 1500.0",""        ,""        ,""        ,""        ,""        )
      )
    }

    //add another row...
    ordersProvider.tick("NYC-0009", Map("orderId" -> "NYC-0009", "trader" -> "steve", "tradeTime" -> EPOCH_DEFAULT, "quantity" -> 1234, "ric" -> "BT.L"))

    runContainersOnce(viewPortContainer, joinProvider)

    //check child count updated
    assertVpEq(filterByVpId(combineQs(viewport), viewport)) {
      Table(
        ("_isOpen" ,"_depth"  ,"_treeKey","_isLeaf" ,"_childCount","_caption","orderId" ,"trader"  ,"ric"     ,"tradeTime","quantity","bid"     ,"ask"     ,"last"    ,"open"    ,"close"   ),
        (false     ,1         ,"$root|BT.L",false     ,3         ,"BT.L"    ,""        ,""        ,"[1]"     ,""        ,"Σ 2734.0",""        ,""        ,""        ,""        ,""        )
      )
    }

    ordersProvider.tick("NYC-0009", Map("orderId" -> "NYC-0009", "trader" -> "steve", "tradeTime" -> EPOCH_DEFAULT, "quantity" -> 1235, "ric" -> "BT.L"))

    runContainersOnce(viewPortContainer, joinProvider)

    //check child count updated
    assertVpEq(filterByVpId(combineQs(viewport), viewport)) {
      Table(
        ("_isOpen" ,"_depth"  ,"_treeKey","_isLeaf" ,"_childCount","_caption","orderId" ,"trader"  ,"ric"     ,"tradeTime","quantity","bid"     ,"ask"     ,"last"    ,"open"    ,"close"   ),
      )
    }

  }

}
