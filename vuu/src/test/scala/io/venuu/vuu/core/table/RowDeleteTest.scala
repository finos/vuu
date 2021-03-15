/**
  * Copyright Whitebox Software Ltd. 2014
  * All Rights Reserved.
  *
  * Created by chris on 08/09/2016.
  *
  */
package io.venuu.vuu.core.table

import io.venuu.toolbox.jmx.MetricsProviderImpl
import io.venuu.toolbox.lifecycle.LifecycleContainer
import io.venuu.toolbox.time.{DefaultClock, TestFriendlyClock}
import io.venuu.vuu.api.TableDef
import io.venuu.vuu.core.table.TableTestHelper._
import io.venuu.vuu.net.ClientSessionId
import io.venuu.vuu.provider.{JoinTableProviderImpl, MockProvider}
import io.venuu.vuu.util.OutboundRowPublishQueue
import io.venuu.vuu.util.table.TableAsserts._
import io.venuu.vuu.viewport.{DefaultRange, GroupBy, ViewPortContainer}
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers
import org.scalatest.prop.Tables.Table
import org.scalatest.{GivenWhenThen, OneInstancePerTest}

class RowDeleteTest extends AnyFeatureSpec with Matchers with OneInstancePerTest with GivenWhenThen {

  Feature("check we can delete rows from tables and join tables"){

    Scenario("check a delete from a simple data table"){

      implicit val timeProvider = new DefaultClock

      implicit val lifecycle = new LifecycleContainer
      implicit val metrics = new MetricsProviderImpl

      val joinProvider   = new JoinTableProviderImpl()

      val tableContainer = new TableContainer(joinProvider)

      val outQueue          = new OutboundRowPublishQueue()
      val highPriorityQueue = new OutboundRowPublishQueue()

      val viewPortContainer = new ViewPortContainer(tableContainer)

      val pricesDef = TableDef("prices", "ric", Columns.fromNames("ric:String", "bid:Double", "ask:Double", "last:Double", "open:Double", "close:Double"), "ric")

      val table = new SimpleDataTable(pricesDef, joinProvider)

      val provider = new MockProvider(table)

      val session = new ClientSessionId("sess-01", "chris")

      val vpcolumns = List("ric", "bid", "ask").map(table.getTableDef.columnForName(_))

      val viewPort = viewPortContainer.create(session, outQueue, highPriorityQueue, table, DefaultRange, vpcolumns)

      provider.tick("VOD.L", Map("ric" -> "VOD.L", "bid" -> 220, "ask" -> 223))
      provider.tick("BT.L", Map("ric" -> "BT.L", "bid" -> 220, "ask" -> 223))
      provider.tick("TW.L", Map("ric" -> "TW.L", "bid" -> 220, "ask" -> 223))

      table.primaryKeys.length should equal (3)

      viewPortContainer.runOnce()

      val updates = combineQs(viewPort)


      assertVpEq(updates) {
        Table(
          ("ric"     ,"bid"     ,"ask"     ),
          ("VOD.L"   ,220       ,223       ),
          ("BT.L"    ,220       ,223       ),
          ("TW.L"    ,220       ,223       )
        )
      }

      provider.delete("VOD.L")

      viewPortContainer.runOnce()

      val updates2 = combineQs(viewPort)

      assertVpEq(updates2) {
        Table(
          ("ric"     ,"bid"     ,"ask"     ),
          //("VOD.L"   ,220       ,223       ),
          ("BT.L"    ,220       ,223       ),
          ("TW.L"    ,220       ,223       )
        )
      }

    }

    Scenario("check we correct delete from a primary key join table"){

      implicit val timeProvider = new TestFriendlyClock(1000000)
      implicit val lifecycle = new LifecycleContainer
      implicit val metrics = new MetricsProviderImpl

      val dateTime = 1437732000000l

      val (orders, prices, orderPrices, ordersProvider, pricesProvider, joinProvider) = TableTestHelper.createOrderPricesScenario()

      val tableContainer = new TableContainer(joinProvider)

      val outQueue          = new OutboundRowPublishQueue()
      val highPriorityQueue = new OutboundRowPublishQueue()

      val viewPortContainer = new ViewPortContainer(tableContainer)

      joinProvider.start()

      val session = new ClientSessionId("sess-01", "chris")

      val vpcolumns = orderPrices.getTableDef.columns.toList

      val viewPort = viewPortContainer.create(session, outQueue, highPriorityQueue, orderPrices, DefaultRange, vpcolumns)

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
          ("VOD.L"   ,220.0     ,222.0     ,"NYC-0001","chris"   ,"VOD.L"   ,100       ,null      ,null      ,null      ,1437732000000l),
          ("VOD.L"   ,220.0     ,222.0     ,"NYC-0002","chris"   ,"VOD.L"   ,100       ,null      ,null      ,null      ,1437732000000l),
          ("VOD.L"   ,220.0     ,222.0     ,"NYC-0003","chris"   ,"VOD.L"   ,100       ,null      ,null      ,null      ,1437732000000l),
          ("VOD.L"   ,220.0     ,222.0     ,"NYC-0004","chris"   ,"VOD.L"   ,100       ,null      ,null      ,null      ,1437732000000l)
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
          ("VOD.L"   ,220.0     ,222.0     ,"NYC-0002","chris"   ,"VOD.L"   ,100       ,null      ,null      ,null      ,1437732000000l),
          ("VOD.L"   ,220.0     ,222.0     ,"NYC-0003","chris"   ,"VOD.L"   ,100       ,null      ,null      ,null      ,1437732000000l),
          ("VOD.L"   ,220.0     ,222.0     ,"NYC-0004","chris"   ,"VOD.L"   ,100       ,null      ,null      ,null      ,1437732000000l)
        )
      }


      Then("we should expect that the row has gone from the join table viewport")

    }

    Scenario("Create a groupby ontop of a join table, delete all rows from the source, add another set, and check we subscribe to updates"){

      implicit val timeProvider = new TestFriendlyClock(1000000)
      implicit val lifecycle = new LifecycleContainer
      implicit val metrics = new MetricsProviderImpl

      val dateTime = 1437732000000l

      val (orders, prices, orderPrices, ordersProvider, pricesProvider, joinProvider) = TableTestHelper.createOrderPricesScenario()

      val tableContainer = new TableContainer(joinProvider)

      val outQueue          = new OutboundRowPublishQueue()
      val highPriorityQueue = new OutboundRowPublishQueue()

      val viewPortContainer = new ViewPortContainer(tableContainer)

      joinProvider.start()

      val session = new ClientSessionId("sess-01", "chris")

      val vpcolumns = orderPrices.getTableDef.columns.toList

      val viewPort = viewPortContainer.create(session, outQueue, highPriorityQueue, orderPrices, DefaultRange, vpcolumns,
        groupBy = GroupBy(orderPrices, "trader")
        .withSum("quantity")
        .withCount("trader")
        .asClause()
      )

      ordersProvider.tick("NYC-0001", Map("orderId" -> "NYC-0001", "trader" -> "chris", "tradeTime" -> dateTime, "quantity" -> 100, "ric" -> "VOD.L"))
      ordersProvider.tick("NYC-0002", Map("orderId" -> "NYC-0002", "trader" -> "chris", "tradeTime" -> dateTime, "quantity" -> 100, "ric" -> "VOD.L"))
      ordersProvider.tick("NYC-0003", Map("orderId" -> "NYC-0003", "trader" -> "chris", "tradeTime" -> dateTime, "quantity" -> 100, "ric" -> "VOD.L"))
      ordersProvider.tick("NYC-0004", Map("orderId" -> "NYC-0004", "trader" -> "chris", "tradeTime" -> dateTime, "quantity" -> 100, "ric" -> "VOD.L"))

      joinProvider.runOnce()

      pricesProvider.getSubRequestCount.get("VOD.L") should equal(1)

      pricesProvider.tick("VOD.L", Map("ric" -> "VOD.L", "bid" -> 220.0, "ask" -> 222.0))

      joinProvider.runOnce()

      viewPortContainer.runOnce()
      viewPortContainer.runGroupByOnce()
      viewPortContainer.openNode(viewPort.id, "$root/chris")

      val updates = combineQs(viewPort)

      assertVpEq(updates) {
        Table(
          ("_childCount","_depth"  ,"_caption","_isOpen" ,"_treeKey","_isLeaf" ,"ric"     ,"bid"     ,"ask"     ,"orderId" ,"trader"  ,"ric"     ,"quantity","last"    ,"open"    ,"close"   ,"tradeTime"),
          (4         ,1         ,"chris"   ,true      ,"$root/chris",false     ,""        ,""        ,""        ,""        ,"[1]"     ,""        ,"Σ 400.0" ,""        ,""        ,""        ,""        ),
          (0         ,2         ,"NYC-0001",false     ,"$root/chris/NYC-0001",true      ,"VOD.L"   ,220.0     ,222.0     ,"NYC-0001","chris"   ,"VOD.L"   ,100       ,null      ,null      ,null      ,1437732000000l),
          (0         ,2         ,"NYC-0002",false     ,"$root/chris/NYC-0002",true      ,"VOD.L"   ,220.0     ,222.0     ,"NYC-0002","chris"   ,"VOD.L"   ,100       ,null      ,null      ,null      ,1437732000000l),
          (0         ,2         ,"NYC-0003",false     ,"$root/chris/NYC-0003",true      ,"VOD.L"   ,220.0     ,222.0     ,"NYC-0003","chris"   ,"VOD.L"   ,100       ,null      ,null      ,null      ,1437732000000l),
          (0         ,2         ,"NYC-0004",false     ,"$root/chris/NYC-0004",true      ,"VOD.L"   ,220.0     ,222.0     ,"NYC-0004","chris"   ,"VOD.L"   ,100       ,null      ,null      ,null      ,1437732000000l),
          (4         ,1         ,"chris"   ,true      ,"$root/chris",false     ,""        ,""        ,""        ,""        ,"[1]"     ,""        ,"Σ 400.0" ,""        ,""        ,""        ,""        )
        )
      }


      Given("we delete from the primary key join fields")

      Array("NYC-0001", "NYC-0002", "NYC-0003", "NYC-0004").foreach( ordersProvider.delete(_))

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
          (4         ,1         ,"chris"   ,true      ,"$root/chris",false     ,""        ,""        ,""        ,""        ,"[1]"     ,""        ,"Σ 400.0",""        ,""        ,""        ,""        ),
          (0         ,2         ,"NYC-0005",false     ,"$root/chris/NYC-0005",true      ,"VOD.L"   ,220.0     ,222.0     ,"NYC-0005","chris"   ,"VOD.L"   ,100       ,null      ,null      ,null      ,1437732000000l),
          (0         ,2         ,"NYC-0006",false     ,"$root/chris/NYC-0006",true      ,"VOD.L"   ,220.0     ,222.0     ,"NYC-0006","chris"   ,"VOD.L"   ,100       ,null      ,null      ,null      ,1437732000000l),
          (0         ,2         ,"NYC-0007",false     ,"$root/chris/NYC-0007",true      ,"VOD.L"   ,220.0     ,222.0     ,"NYC-0007","chris"   ,"VOD.L"   ,100       ,null      ,null      ,null      ,1437732000000l),
          (0         ,2         ,"NYC-0008",false     ,"$root/chris/NYC-0008",true      ,"VOD.L"   ,220.0     ,222.0     ,"NYC-0008","chris"   ,"VOD.L"   ,100       ,null      ,null      ,null      ,1437732000000l)
        )
      }

      pricesProvider.tick("VOD.L", Map("ric" -> "VOD.L", "bid" -> 219.0, "ask" -> 223.0))

      joinProvider.runOnce()
      viewPortContainer.runOnce()
      viewPortContainer.runGroupByOnce()

      val rowKeyToIndex = viewPort.ForTest_getRowKeyToRowIndex
      val subscribedKeys = viewPort.ForTest_getSubcribedKeys

      println("ChrisChris")

      assertVpEq(combineQs(viewPort)) {
        Table(
          ("_childCount","_depth"  ,"_caption","_isOpen" ,"_treeKey","_isLeaf" ,"ric"     ,"bid"     ,"ask"     ,"orderId" ,"trader"  ,"ric"     ,"quantity","last"    ,"open"    ,"close"   ,"tradeTime"),
          (0         ,2         ,"NYC-0005",false     ,"$root/chris/NYC-0005",true      ,"VOD.L"   ,219.0     ,223.0     ,"NYC-0005","chris"   ,"VOD.L"   ,100       ,null      ,null      ,null      ,1437732000000l),
          (0         ,2         ,"NYC-0006",false     ,"$root/chris/NYC-0006",true      ,"VOD.L"   ,219.0     ,223.0     ,"NYC-0006","chris"   ,"VOD.L"   ,100       ,null      ,null      ,null      ,1437732000000l),
          (0         ,2         ,"NYC-0007",false     ,"$root/chris/NYC-0007",true      ,"VOD.L"   ,219.0     ,223.0     ,"NYC-0007","chris"   ,"VOD.L"   ,100       ,null      ,null      ,null      ,1437732000000l),
          (0         ,2         ,"NYC-0008",false     ,"$root/chris/NYC-0008",true      ,"VOD.L"   ,219.0     ,223.0     ,"NYC-0008","chris"   ,"VOD.L"   ,100       ,null      ,null      ,null      ,1437732000000l)
        )
      }

    }

  }

}
