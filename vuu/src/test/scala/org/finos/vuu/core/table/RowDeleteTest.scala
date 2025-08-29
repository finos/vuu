package org.finos.vuu.core.table

import org.finos.toolbox.jmx.MetricsProviderImpl
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.{Clock, DefaultClock, TestFriendlyClock}
import org.finos.vuu.api.TableDef
import org.finos.vuu.client.messages.RequestId
import org.finos.vuu.core.table.TableTestHelper._
import org.finos.vuu.feature.inmem.VuuInMemPlugin
import org.finos.vuu.net.ClientSessionId
import org.finos.vuu.plugin.DefaultPluginRegistry
import org.finos.vuu.provider.{JoinTableProviderImpl, MockProvider, ProviderContainer}
import org.finos.vuu.util.OutboundRowPublishQueue
import org.finos.vuu.util.table.TableAsserts._
import org.finos.vuu.viewport.{DefaultRange, GroupBy, ViewPortContainer}
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers
import org.scalatest.prop.Tables.Table
import org.scalatest.{GivenWhenThen, OneInstancePerTest}

class RowDeleteTest extends AnyFeatureSpec with Matchers with OneInstancePerTest with GivenWhenThen {

  Feature("check we can delete rows from tables and join tables"){

    Scenario("check a delete from a simple data table"){

      implicit val clock: Clock = new DefaultClock

      implicit val lifecycle: LifecycleContainer = new LifecycleContainer
      implicit val metrics: MetricsProviderImpl = new MetricsProviderImpl

      val joinProvider   = JoinTableProviderImpl()

      val tableContainer = new TableContainer(joinProvider)

      val outQueue          = new OutboundRowPublishQueue()

      val providerContainer = new ProviderContainer(joinProvider)
      val pluginRegistry = new DefaultPluginRegistry
      pluginRegistry.registerPlugin(new VuuInMemPlugin)

      val viewPortContainer = new ViewPortContainer(tableContainer, providerContainer, pluginRegistry)

      val pricesDef = TableDef("prices", "ric", Columns.fromNames("ric:String", "bid:Double", "ask:Double", "last:Double", "open:Double", "close:Double"), "ric")

      val table = new InMemDataTable(pricesDef, joinProvider)

      val provider = new MockProvider(table)

      val session = ClientSessionId("sess-01", "chris")

      val vpcolumns = ViewPortColumnCreator.create(table, List("ric", "bid", "ask"))

      val viewPort = viewPortContainer.create(RequestId.oneNew(), session, outQueue, table, DefaultRange, vpcolumns)

      provider.tick("VOD.L", Map("ric" -> "VOD.L", "bid" -> 220, "ask" -> 223))
      provider.tick("BT.L", Map("ric" -> "BT.L", "bid" -> 220, "ask" -> 223))
      provider.tick("TW.L", Map("ric" -> "TW.L", "bid" -> 220, "ask" -> 223))

      table.primaryKeys.length should equal (3)

      viewPortContainer.runOnce()

      val updates = combineQs(viewPort)


      assertVpEq(updates) {
        Table(
          ("ric", "bid", "ask"),
          ("BT.L", 220, 223),
          ("TW.L", 220, 223),
          ("VOD.L", 220, 223)
        )
      }

      provider.delete("VOD.L")

      viewPortContainer.runOnce()

      val updates2 = combineQs(viewPort)

      assertVpEq(updates2) {
        Table(
          ("ric"     ,"bid"     ,"ask"     ),
          ("BT.L"    ,220       ,223       ),
          ("TW.L"    ,220       ,223       )
        )
      }

    }

    Scenario("check a delete of a key that doesn't exist does nothing"){
      implicit val clock: Clock = new DefaultClock

      implicit val lifecycle: LifecycleContainer = new LifecycleContainer
      implicit val metrics: MetricsProviderImpl = new MetricsProviderImpl

      val joinProvider   = JoinTableProviderImpl()

      val tableContainer = new TableContainer(joinProvider)

      val outQueue          = new OutboundRowPublishQueue()

      val providerContainer = new ProviderContainer(joinProvider)
      val pluginRegistry = new DefaultPluginRegistry
      pluginRegistry.registerPlugin(new VuuInMemPlugin)

      val viewPortContainer = new ViewPortContainer(tableContainer, providerContainer, pluginRegistry)

      val pricesDef = TableDef("prices", "ric", Columns.fromNames("ric:String", "bid:Double", "ask:Double", "last:Double", "open:Double", "close:Double"), "ric")

      val table = new InMemDataTable(pricesDef, joinProvider)

      val provider = new MockProvider(table)

      val session = ClientSessionId("sess-01", "chris")

      val vpcolumns = ViewPortColumnCreator.create(table, List("ric", "bid", "ask"))

      val viewPort = viewPortContainer.create(RequestId.oneNew(), session, outQueue, table, DefaultRange, vpcolumns)

      provider.tick("VOD.L", Map("ric" -> "VOD.L", "bid" -> 220, "ask" -> 223))

      table.primaryKeys.length should equal (1)

      viewPortContainer.runOnce()

      val updates = combineQs(viewPort)

      assertVpEq(updates) {
        Table(
          ("ric", "bid", "ask"),
          ("VOD.L", 220, 223)
        )
      }

      provider.delete("TW.L")

      viewPortContainer.runOnce()

      val updates2 = combineQs(viewPort)

      assert(updates2.isEmpty)
    }

    Scenario("check we correct delete from a primary key join table"){

      implicit val clock: Clock = new TestFriendlyClock(1000000)
      implicit val lifecycle: LifecycleContainer = new LifecycleContainer
      implicit val metrics: MetricsProviderImpl = new MetricsProviderImpl

      val dateTime = 1437732000000L

      val (orders, prices, orderPrices, ordersProvider, pricesProvider, joinProvider) = TableTestHelper.createOrderPricesScenario()

      val tableContainer = new TableContainer(joinProvider)

      val outQueue          = new OutboundRowPublishQueue()

      val providerContainer = new ProviderContainer(joinProvider)
      val pluginRegistry = new DefaultPluginRegistry
      pluginRegistry.registerPlugin(new VuuInMemPlugin)

      val viewPortContainer = new ViewPortContainer(tableContainer, providerContainer, pluginRegistry)

      joinProvider.start()

      val session = ClientSessionId("sess-01", "chris")

      val vpcolumns = ViewPortColumnCreator.create(orderPrices, orderPrices.getTableDef.columns.map(_.name).toList)

      val viewPort = viewPortContainer.create(RequestId.oneNew(), session, outQueue, orderPrices, DefaultRange, vpcolumns)

      ordersProvider.tick("NYC-0001", Map("orderId" -> "NYC-0001", "trader" -> "chris", "tradeTime" -> dateTime, "quantity" -> 100, "ric" -> "VOD.L"))
      ordersProvider.tick("NYC-0002", Map("orderId" -> "NYC-0002", "trader" -> "chris", "tradeTime" -> dateTime, "quantity" -> 100, "ric" -> "VOD.L"))
      ordersProvider.tick("NYC-0003", Map("orderId" -> "NYC-0003", "trader" -> "chris", "tradeTime" -> dateTime, "quantity" -> 100, "ric" -> "VOD.L"))
      ordersProvider.tick("NYC-0004", Map("orderId" -> "NYC-0004", "trader" -> "chris", "tradeTime" -> dateTime, "quantity" -> 100, "ric" -> "VOD.L"))

      joinProvider.runOnce()

      pricesProvider.getSubRequestCount.get("VOD.L") should equal(1)

      pricesProvider.tick("VOD.L", Map("ric" -> "VOD.L", "bid" -> 220.0, "ask" -> 222.0))

      joinProvider.runOnce()
      viewPortContainer.runOnce()

      val updates = combineQs(viewPort)

      assertVpEq(updates) {
        Table(
          ("ric"     ,"bid"     ,"ask"     ,"orderId" ,"trader"  ,"ric"     ,"quantity","last"    ,"open"    ,"close"   ,"tradeTime"),
          ("VOD.L"   ,220.0     ,222.0     ,"NYC-0001","chris"   ,"VOD.L"   ,100       ,null      ,null      ,null      ,1437732000000L),
          ("VOD.L"   ,220.0     ,222.0     ,"NYC-0002","chris"   ,"VOD.L"   ,100       ,null      ,null      ,null      ,1437732000000L),
          ("VOD.L"   ,220.0     ,222.0     ,"NYC-0003","chris"   ,"VOD.L"   ,100       ,null      ,null      ,null      ,1437732000000L),
          ("VOD.L"   ,220.0     ,222.0     ,"NYC-0004","chris"   ,"VOD.L"   ,100       ,null      ,null      ,null      ,1437732000000L)
        )
      }


      Given("we delete from the primary key join fields")
      ordersProvider.delete("NYC-0001")

      joinProvider.runOnce()
      viewPortContainer.runOnce()

      val updates2 = combineQs(viewPort)

      assertVpEq(updates2) {
        Table(
          ("ric"     ,"bid"     ,"ask"     ,"orderId" ,"trader"  ,"ric"     ,"quantity","last"    ,"open"    ,"close"   ,"tradeTime"),
          ("VOD.L"   ,220.0     ,222.0     ,"NYC-0002","chris"   ,"VOD.L"   ,100       ,null      ,null      ,null      ,1437732000000L),
          ("VOD.L"   ,220.0     ,222.0     ,"NYC-0003","chris"   ,"VOD.L"   ,100       ,null      ,null      ,null      ,1437732000000L),
          ("VOD.L"   ,220.0     ,222.0     ,"NYC-0004","chris"   ,"VOD.L"   ,100       ,null      ,null      ,null      ,1437732000000L)
        )
      }


      Then("we should expect that the row has gone from the join table viewport")

    }

    Scenario("Create a groupby ontop of a join table, delete all rows from the source, add another set, and check we subscribe to updates"){

      implicit val clock: Clock = new TestFriendlyClock(1000000)
      implicit val lifecycle: LifecycleContainer = new LifecycleContainer
      implicit val metrics: MetricsProviderImpl = new MetricsProviderImpl

      val dateTime = 1437732000000L

      val (_, _, orderPrices, ordersProvider, pricesProvider, joinProvider) = TableTestHelper.createOrderPricesScenario()

      val tableContainer = new TableContainer(joinProvider)

      val outQueue          = new OutboundRowPublishQueue()

      val providerContainer = new ProviderContainer(joinProvider)

      val pluginRegistry = new DefaultPluginRegistry
      pluginRegistry.registerPlugin(new VuuInMemPlugin)

      val viewPortContainer = new ViewPortContainer(tableContainer, providerContainer, pluginRegistry)

      joinProvider.start()

      val session = ClientSessionId("sess-01", "chris")

      val vpcolumns = ViewPortColumnCreator.create(orderPrices, orderPrices.getTableDef.columns.map(_.name).toList)

      val viewPort = viewPortContainer.create(RequestId.oneNew(), session, outQueue, orderPrices, DefaultRange, vpcolumns,
        groupBy = GroupBy(orderPrices, vpcolumns.getColumnForName("trader").get)
          .withSum("quantity")
          .withCount("trader")
          .asClause()
      )

      ordersProvider.tick("NYC-0001", Map("orderId" -> "NYC-0001", "trader" -> "chris", "tradeTime" -> dateTime, "quantity" -> 100, "ric" -> "VOD.L"))
      ordersProvider.tick("NYC-0002", Map("orderId" -> "NYC-0002", "trader" -> "chris", "tradeTime" -> dateTime, "quantity" -> 100, "ric" -> "VOD.L"))
      ordersProvider.tick("NYC-0003", Map("orderId" -> "NYC-0003", "trader" -> "chris", "tradeTime" -> dateTime, "quantity" -> 100, "ric" -> "VOD.L"))
      ordersProvider.tick("NYC-0004", Map("orderId" -> "NYC-0004", "trader" -> "chris", "tradeTime" -> dateTime, "quantity" -> 100, "ric" -> "VOD.L"))

      viewPortContainer.runOnce()
      viewPortContainer.runGroupByOnce()
      joinProvider.runOnce()

      pricesProvider.getSubRequestCount.get("VOD.L") should equal(1)

      pricesProvider.tick("VOD.L", Map("ric" -> "VOD.L", "bid" -> 220.0, "ask" -> 222.0))

      joinProvider.runOnce()

      viewPortContainer.openNode(viewPort.id, "$root|chris")
      viewPortContainer.runOnce()
      viewPortContainer.runGroupByOnce()

      val updates = combineQs(viewPort)

      assertVpEq(updates) {
        Table(
          ("_childCount","_depth"  ,"_caption","_isOpen" ,"_treeKey","_isLeaf" ,"ric"     ,"bid"     ,"ask"     ,"orderId" ,"trader"  ,"ric"     ,"quantity","last"    ,"open"    ,"close"   ,"tradeTime"),
          (4         ,1         ,"chris"   ,true      ,"$root|chris",false     ,""        ,""        ,""        ,""        ,1         ,""        ,400.0     ,""        ,""        ,""        ,""        ),
          (0         ,2         ,"NYC-0001",false     ,"$root|chris|NYC-0001",true      ,"VOD.L"   ,220.0     ,222.0     ,"NYC-0001","chris"   ,"VOD.L"   ,100       ,null      ,null      ,null      ,1437732000000L),
          (0         ,2         ,"NYC-0002",false     ,"$root|chris|NYC-0002",true      ,"VOD.L"   ,220.0     ,222.0     ,"NYC-0002","chris"   ,"VOD.L"   ,100       ,null      ,null      ,null      ,1437732000000L),
          (0         ,2         ,"NYC-0003",false     ,"$root|chris|NYC-0003",true      ,"VOD.L"   ,220.0     ,222.0     ,"NYC-0003","chris"   ,"VOD.L"   ,100       ,null      ,null      ,null      ,1437732000000L),
          (0         ,2         ,"NYC-0004",false     ,"$root|chris|NYC-0004",true      ,"VOD.L"   ,220.0     ,222.0     ,"NYC-0004","chris"   ,"VOD.L"   ,100       ,null      ,null      ,null      ,1437732000000L)
        )
      }


      Given("we delete from the primary key join fields")

      Array("NYC-0001", "NYC-0002", "NYC-0003", "NYC-0004").foreach(ordersProvider.delete)

      joinProvider.runOnce()
      viewPortContainer.runOnce()
      viewPortContainer.runGroupByOnce()

      assertVpEq(combineQs(viewPort)) {
        Table(
          ("_childCount","_depth"  ,"_caption","_isOpen" ,"_treeKey","_isLeaf" ,"ric"     ,"bid"     ,"ask"     ,"orderId" ,"trader"  ,"ric"     ,"quantity","last"    ,"open"    ,"close"   ,"tradeTime")
        )
      }


      ordersProvider.tick("NYC-0005", Map("orderId" -> "NYC-0005", "trader" -> "chris", "tradeTime" -> dateTime, "quantity" -> 100, "ric" -> "VOD.L"))
      ordersProvider.tick("NYC-0006", Map("orderId" -> "NYC-0006", "trader" -> "chris", "tradeTime" -> dateTime, "quantity" -> 100, "ric" -> "VOD.L"))
      ordersProvider.tick("NYC-0007", Map("orderId" -> "NYC-0007", "trader" -> "chris", "tradeTime" -> dateTime, "quantity" -> 100, "ric" -> "VOD.L"))
      ordersProvider.tick("NYC-0008", Map("orderId" -> "NYC-0008", "trader" -> "chris", "tradeTime" -> dateTime, "quantity" -> 100, "ric" -> "VOD.L"))

      joinProvider.runOnce()
      viewPortContainer.runOnce()
      viewPortContainer.runGroupByOnce()

      assertVpEq(combineQs(viewPort)) {
        Table(
          ("_childCount","_depth"  ,"_caption","_isOpen" ,"_treeKey","_isLeaf" ,"ric"     ,"bid"     ,"ask"     ,"orderId" ,"trader"  ,"ric"     ,"quantity","last"    ,"open"    ,"close"   ,"tradeTime"),
          (4         ,1         ,"chris"   ,true      ,"$root|chris",false     ,""        ,""        ,""        ,""        ,1         ,""        ,400.0     ,""        ,""        ,""        ,""        ),
          (0         ,2         ,"NYC-0005",false     ,"$root|chris|NYC-0005",true      ,"VOD.L"   ,220.0     ,222.0     ,"NYC-0005","chris"   ,"VOD.L"   ,100       ,null      ,null      ,null      ,1437732000000L),
          (0         ,2         ,"NYC-0006",false     ,"$root|chris|NYC-0006",true      ,"VOD.L"   ,220.0     ,222.0     ,"NYC-0006","chris"   ,"VOD.L"   ,100       ,null      ,null      ,null      ,1437732000000L),
          (0         ,2         ,"NYC-0007",false     ,"$root|chris|NYC-0007",true      ,"VOD.L"   ,220.0     ,222.0     ,"NYC-0007","chris"   ,"VOD.L"   ,100       ,null      ,null      ,null      ,1437732000000L),
          (0         ,2         ,"NYC-0008",false     ,"$root|chris|NYC-0008",true      ,"VOD.L"   ,220.0     ,222.0     ,"NYC-0008","chris"   ,"VOD.L"   ,100       ,null      ,null      ,null      ,1437732000000L)
        )
      }

      pricesProvider.tick("VOD.L", Map("ric" -> "VOD.L", "bid" -> 219.0, "ask" -> 223.0))

      joinProvider.runOnce()
      viewPortContainer.runOnce()
      viewPortContainer.runGroupByOnce()

      assertVpEq(combineQs(viewPort)) {
        Table(
          ("_childCount", "_depth", "_caption", "_isOpen", "_treeKey", "_isLeaf", "ric", "bid", "ask", "orderId", "trader", "ric", "quantity", "last", "open", "close", "tradeTime"),
          (4, 1, "chris", true, "$root|chris", false, "", "", "", "", 1, "", 400.0, "", "", "", ""),
          (0, 2, "NYC-0005", false, "$root|chris|NYC-0005", true, "VOD.L", 219.0, 223.0, "NYC-0005", "chris", "VOD.L", 100, null, null, null, 1437732000000L),
          (0, 2, "NYC-0006", false, "$root|chris|NYC-0006", true, "VOD.L", 219.0, 223.0, "NYC-0006", "chris", "VOD.L", 100, null, null, null, 1437732000000L),
          (0, 2, "NYC-0007", false, "$root|chris|NYC-0007", true, "VOD.L", 219.0, 223.0, "NYC-0007", "chris", "VOD.L", 100, null, null, null, 1437732000000L),
          (0, 2, "NYC-0008", false, "$root|chris|NYC-0008", true, "VOD.L", 219.0, 223.0, "NYC-0008", "chris", "VOD.L", 100, null, null, null, 1437732000000L)
        )
      }

    }

  }

}
