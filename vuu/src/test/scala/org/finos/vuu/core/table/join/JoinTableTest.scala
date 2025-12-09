package org.finos.vuu.core.table.join

import org.finos.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.{Clock, DefaultClock, TestFriendlyClock}
import org.finos.vuu.api.*
import org.finos.vuu.client.messages.RequestId
import org.finos.vuu.core.VuuJoinProviderOptionsImpl
import org.finos.vuu.core.auths.VuuUser
import org.finos.vuu.core.table.*
import org.finos.vuu.core.table.DefaultColumnNames.{CreatedTimeColumnName, LastUpdatedTimeColumnName}
import org.finos.vuu.core.table.datatype.EpochTimestamp
import org.finos.vuu.feature.inmem.VuuInMemPlugin
import org.finos.vuu.net.ClientSessionId
import org.finos.vuu.plugin.DefaultPluginRegistry
import org.finos.vuu.provider.{JoinTableProviderImpl, MockProvider, ProviderContainer}
import org.finos.vuu.util.OutboundRowPublishQueue
import org.finos.vuu.util.table.TableAsserts.assertVpEq
import org.finos.vuu.viewport.*
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers
import org.scalatest.prop.Tables.Table

import java.time.{LocalDateTime, ZoneId}

class JoinTableTest extends AnyFeatureSpec with Matchers with ViewPortSetup {

  implicit val timeProvider: Clock = new DefaultClock
  implicit val metrics: MetricsProvider = new MetricsProviderImpl

  case class NamedKeyObserver(name: String) extends KeyObserver[RowKeyUpdate]{
    override def onUpdate(update: RowKeyUpdate): Unit = {}
    override def hashCode(): Int = name.hashCode
    override def equals(obj: scala.Any): Boolean = {
      obj.isInstanceOf[NamedKeyObserver] && obj.asInstanceOf[NamedKeyObserver].name == this.name
    }
  }

  Feature("check we can create join tables and tick data through"){

    def setupViewPort(tableContainer: TableContainer, providerContainer: ProviderContainer) = {

      val pluginRegistry = new DefaultPluginRegistry
      pluginRegistry.registerPlugin(new VuuInMemPlugin)

      val viewPortContainer = new ViewPortContainer(tableContainer, providerContainer, pluginRegistry)

      viewPortContainer
    }

    Scenario("check a tick all the way through from source to join table"){

      implicit val lifecycle: LifecycleContainer = new LifecycleContainer

      val dateTime: Long = LocalDateTime.of(2015, 7, 24, 11, 0).atZone(ZoneId.of("Europe/London")).toInstant.toEpochMilli

      val ordersDef = TableDef(
        name = "orders",
        keyField = "orderId",
        columns = Columns.fromNames("orderId:String", "trader:String", "ric:String", "tradeTime:Long", "quantity:Double"),
        joinFields =  "ric", "orderId")

      val pricesDef = TableDef("prices", "ric", Columns.fromNames("ric:String", "bid:Double", "ask:Double", "last:Double", "open:Double", "close:Double"), "ric")

      val joinDef = JoinTableDef(
        name          = "orderPrices",
        baseTable     = ordersDef,
        joinColumns   = Columns.allFrom(ordersDef) ++ Columns.allFromExcept(pricesDef, "ric"),
        joins  =
          JoinTo(
            table = pricesDef,
            joinSpec = JoinSpec( left = "ric", right = "ric", LeftOuterJoin)
          ),
        links = VisualLinks(),
        joinFields = Seq()
      )

      //val joinDef =  JoinTableDef("ordersPrices", ordersDef, pricesDef, JoinSpec("ric", "ric"), Columns.allFrom(ordersDef) ++ Columns.allFromExcept(pricesDef, "ric") )

      val joinProvider   = JoinTableProviderImpl()

      val tableContainer = new TableContainer(joinProvider)

      val orders = tableContainer.createTable(ordersDef)
      val prices = tableContainer.createTable(pricesDef)
      val orderPrices = tableContainer.createJoinTable(joinDef)

      val ordersProvider = new MockProvider(orders)
      val pricesProvider = new MockProvider(prices)

      val providerContainer = new ProviderContainer(joinProvider)

      val viewPortContainer = setupViewPort(tableContainer, providerContainer)

      joinProvider.start()

      ordersProvider.tick("NYC-0001", Map("orderId" -> "NYC-0001", "trader" -> "chris", "tradeTime" -> dateTime, "quantity" -> 100, "ric" -> "VOD.L"))
      pricesProvider.tick("VOD.L", Map("ric" -> "VOD.L", "bid" -> 220.0, "ask" -> 222.0))

      pricesProvider.tick("BT.L", Map("ric" -> "BT.L", "bid" -> 500.0, "ask" -> 501.0))
      ordersProvider.tick("NYC-0002", Map("orderId" -> "NYC-0002", "trader" -> "chris", "tradeTime" -> dateTime, "quantity" -> 100, "ric" -> "BT.L"))

      joinProvider.runOnce()

      val user = VuuUser("chris")
      
      val session = ClientSessionId("sess-01", "channel")

      val outQueue = new OutboundRowPublishQueue()

      val vpcolumns = ViewPortColumnCreator.create(orderPrices, List("orderId", "trader", "tradeTime", "quantity", "ric"))

      val viewPort = viewPortContainer.create(RequestId.oneNew(), user, session, outQueue, orderPrices, DefaultRange, vpcolumns)

      viewPortContainer.runOnce()

      val combinedUpdates = combineQs(viewPort)

      combinedUpdates.length should be (3)

      val updates = combinedUpdates.take(2)

      val printToConsoleProcessor = new RowProcessor {
        override def processColumn(column: Column, value: Any): Unit = println(s"Column: ${column.name} = $value")
        override def missingRow(): Unit = println("missing row")

        override def missingRowData(rowKey: String, column: Column): Unit = {}
      }

      updates.filter( vp => vp.vpUpdate == RowUpdateType).foreach(update => update.table.readRow(update.key.key, List("orderId", "trader", "tradeTime", "ric", "bid", "ask"), printToConsoleProcessor ))
    }

    Scenario("check large number of ticks all the way through from source to join table"){

      implicit val lifecycle: LifecycleContainer = new LifecycleContainer

      val dateTime: Long = LocalDateTime.of(2015, 7, 24, 11, 0).atZone(ZoneId.of("Europe/London")).toInstant.toEpochMilli

      val ordersDef = TableDef(
        name = "orders",
        keyField = "orderId",
        columns = Columns.fromNames("orderId:String", "trader:String", "ric:String", "tradeTime:Long", "quantity:Double"),
        joinFields =  "ric", "orderId")

      val pricesDef = TableDef("prices", "ric", Columns.fromNames("ric:String", "bid:Double", "ask:Double", "last:Double", "open:Double", "close:Double"), "ric")

      val joinDef = JoinTableDef(
        name          = "orderPrices",
        baseTable     = ordersDef,
        joinColumns   = Columns.allFrom(ordersDef) ++ Columns.allFromExcept(pricesDef, "ric"),
        joins  =
          JoinTo(
            table = pricesDef,
            joinSpec = JoinSpec( left = "ric", right = "ric", LeftOuterJoin)
          ),
        links = VisualLinks(),
        joinFields = Seq()
      )

      val batchSize = 10
      val maxQueueSize = 100
      val joinProvider   = JoinTableProviderImpl(VuuJoinProviderOptionsImpl.apply(batchSize = batchSize, maxQueueSize = maxQueueSize))

      val tableContainer = new TableContainer(joinProvider)

      val orders = tableContainer.createTable(ordersDef)
      val prices = tableContainer.createTable(pricesDef)
      val orderPrices = tableContainer.createJoinTable(joinDef)

      val ordersProvider = new MockProvider(orders)
      val pricesProvider = new MockProvider(prices)

      val providerContainer = new ProviderContainer(joinProvider)

      val viewPortContainer = setupViewPort(tableContainer, providerContainer)

      joinProvider.start()

      pricesProvider.tick("VOD.L", Map("ric" -> "VOD.L", "bid" -> 220.0, "ask" -> 222.0))

      pricesProvider.tick("BT.L", Map("ric" -> "BT.L", "bid" -> 500.0, "ask" -> 501.0))

      for (quantity <- 1 to maxQueueSize + 1) {
        ordersProvider.tick("NYC-0001", Map("orderId" -> "NYC-0001", "trader" -> "chris", "tradeTime" -> dateTime, "quantity" -> quantity, "ric" -> "VOD.L"))
        ordersProvider.tick("NYC-0002", Map("orderId" -> "NYC-0002", "trader" -> "chris", "tradeTime" -> dateTime, "quantity" -> quantity, "ric" -> "BT.L"))
        if (quantity % batchSize == 0) {
          joinProvider.runOnce()
        }
      }

      joinProvider.runOnce()

      val user = VuuUser("chris")
      
      val session = ClientSessionId("sess-01", "channel")

      val outQueue = new OutboundRowPublishQueue()

      val vpcolumns = ViewPortColumnCreator.create(orderPrices, List("orderId", "trader", "tradeTime", "quantity", "ric"))

      val viewPort = viewPortContainer.create(RequestId.oneNew(), user, session, outQueue, orderPrices, DefaultRange, vpcolumns)

      viewPortContainer.runOnce()

      assertVpEq(filterByVpId(combineQs(viewPort), viewPort)){
        Table(
          ("orderId" ,"trader"     ,"tradeTime"   ,"quantity" , "ric"  ),
          ("NYC-0001","chris"   ,1437732000000L     ,maxQueueSize + 1 , "VOD.L"    ),
          ("NYC-0002","chris"  ,1437732000000L     ,maxQueueSize + 1  , "BT.L"   )
        )
      }

      }

    Scenario("check that registering and deregistering listeners on join table propagates to source tables"){

      implicit val lifecycle: LifecycleContainer = new LifecycleContainer

      val dateTime: Long = LocalDateTime.of(2015, 7, 24, 11, 0).atZone(ZoneId.of("Europe/London")).toInstant.toEpochMilli

      val (joinProvider, orders, prices, orderPrices, ordersProvider, pricesProvider, _) = setup()

      joinProvider.start()

      ordersProvider.tick("NYC-0001", Map("orderId" -> "NYC-0001", "trader" -> "chris", "tradeTime" -> dateTime, "quantity" -> 100, "ric" -> "VOD.L"))
      pricesProvider.tick("VOD.L", Map("ric" -> "VOD.L", "bid" -> 220.0, "ask" -> 222.0))

      pricesProvider.tick("BT.L", Map("ric" -> "BT.L", "bid" -> 500.0, "ask" -> 501.0))
      ordersProvider.tick("NYC-0002", Map("orderId" -> "NYC-0002", "trader" -> "chris", "tradeTime" -> dateTime, "quantity" -> 100, "ric" -> "BT.L"))

      joinProvider.runOnce()

      //this simulates 2 that RDX
      val ko1 = NamedKeyObserver("ko-1")
      val ko2 = NamedKeyObserver("ko-2")

      //first check we don't barf when regsitering a subscriber for a key that doesn't exist
      orderPrices.addKeyObserver("NYC-001", ko1) should be (true)

      orderPrices.addKeyObserver("NYC-0001", ko1) should be (true)
      orderPrices.addKeyObserver("NYC-0001", ko2) should be (false)

      orders.isKeyObservedBy("NYC-0001", ko1) should be (true)
      orders.isKeyObservedBy("NYC-0001", ko2) should be (true)

      orders.isKeyObservedBy("NYC-0002", ko2) should be (false)

      prices.isKeyObservedBy("VOD.L", ko1) should be (true)
      prices.isKeyObservedBy("VOD.L", ko2) should be (true)

      orderPrices.removeKeyObserver("NYC-0001", ko1)
      orders.isKeyObservedBy("NYC-0001", ko1) should be (false)
      prices.isKeyObservedBy("VOD.L", ko1) should be (false)

      orderPrices.addKeyObserver("NYC-0002", ko2)

      ordersProvider.tick("NYC-0002", Map("orderId" -> "NYC-0002", "trader" -> "chris", "tradeTime" -> dateTime, "quantity" -> 100, "ric" -> "VOD.L"))

      joinProvider.runOnce()

      prices.isKeyObservedBy("BT.L", ko2) should be (false)
      prices.isKeyObservedBy("VOD.L", ko2) should be (true)
    }

    Scenario("Check deleting keys from join table and see if it propagates correctly"){

      implicit val lifecycle: LifecycleContainer = new LifecycleContainer

      val (joinProvider, orders, prices, orderPrices, ordersProvider, pricesProvider, vpContainer) = setup()

      val queue = new OutboundRowPublishQueue()

      joinProvider.start()

      tickInData(ordersProvider, pricesProvider)

      val orderPricesViewport = vpContainer.create(RequestId.oneNew(), VuuUser("B"), ClientSessionId("A", "C"),
        queue, orderPrices, ViewPortRange(0, 20), 
        ViewPortColumnCreator.create(orderPrices, orderPrices.getTableDef.getColumns.map(_.name).toList))

      runContainersOnce(vpContainer, joinProvider)

      assertVpEq(filterByVpId(combineQs(orderPricesViewport), orderPricesViewport)){
        Table(
          ("orderId" ,"trader"  ,"ric"     ,"tradeTime","quantity","bid"     ,"ask"     ,"last"    ,"open"    ,"close"   ),
          ("NYC-0001","chris"   ,"VOD.L"   ,1311544800000L,100       ,220.0     ,222.0     ,null      ,null      ,null      ),
          ("NYC-0002","chris"   ,"VOD.L"   ,1311544800000L,200       ,220.0     ,222.0     ,null      ,null      ,null      ),
          ("NYC-0003","chris"   ,"VOD.L"   ,1311544800000L,300       ,220.0     ,222.0     ,null      ,null      ,null      ),
          ("NYC-0004","chris"   ,"VOD.L"   ,1311544800000L,400       ,220.0     ,222.0     ,null      ,null      ,null      ),
          ("NYC-0005","chris"   ,"VOD.L"   ,1311544800000L,500       ,220.0     ,222.0     ,null      ,null      ,null      ),
          ("NYC-0006","steve"   ,"VOD.L"   ,1311544800000L,600       ,220.0     ,222.0     ,null      ,null      ,null      ),
          ("NYC-0007","steve"   ,"BT.L"    ,1311544800000L,1000      ,500.0     ,501.0     ,null      ,null      ,null      ),
          ("NYC-0008","steve"   ,"BT.L"    ,1311544800000L,500       ,500.0     ,501.0     ,null      ,null      ,null      )
        )
      }

      ordersProvider.delete("NYC-0001")
      ordersProvider.delete("NYC-0002")

      emptyQueues(orderPricesViewport)
      joinProvider.runOnce()

      println("Ticking VOD.L after delete.")
      val joinDataKeys = orderPrices.asInstanceOf[JoinTable].joinData.getKeyValuesByTable("NYC-0001")

      joinDataKeys shouldBe null
      orderPricesViewport.getKeys.toArray().iterator.contains("NYC-0001") should equal(true)
      vpContainer.runOnce()
      orderPricesViewport.getKeys.toArray().iterator.contains("NYC-0001") should equal(false)

      pricesProvider.tick("VOD.L", Map("ric" -> "VOD.L", "bid" -> 230))

      runContainersOnce(vpContainer, joinProvider)

      orderPricesViewport.getKeys.toArray().iterator.contains("NYC-0001") should equal(false)

      val array = orderPrices.pullRowAsArray("NYC-0001", ViewPortColumnCreator.create(orderPrices, orderPrices.getTableDef.getColumns.map(_.name).toList))

      assertVpEq(filterByVpId(combineQs(orderPricesViewport), orderPricesViewport)){
        Table(
          ("orderId" ,"trader"  ,"ric"     ,"tradeTime","quantity","bid"     ,"ask"     ,"last"    ,"open"    ,"close"   ),
          ("NYC-0003","chris"   ,"VOD.L"   ,1311544800000L,300       ,230       ,222.0     ,null      ,null      ,null      ),
          ("NYC-0004","chris"   ,"VOD.L"   ,1311544800000L,400       ,230       ,222.0     ,null      ,null      ,null      ),
          ("NYC-0005","chris"   ,"VOD.L"   ,1311544800000L,500       ,230       ,222.0     ,null      ,null      ,null      ),
          ("NYC-0006","steve"   ,"VOD.L"   ,1311544800000L,600       ,230       ,222.0     ,null      ,null      ,null      ),
          ("NYC-0007","steve"   ,"BT.L"    ,1311544800000L,1000      ,500.0     ,501.0     ,null      ,null      ,null      ),
          ("NYC-0008","steve"   ,"BT.L"    ,1311544800000L,500       ,500.0     ,501.0     ,null      ,null      ,null      )
        )
      }

    }

    Scenario("check created timestamp and last updated timestamp are populated correctly for LeftOuterJoin") {
      val testFriendlyClock: TestFriendlyClock = new TestFriendlyClock(1000L)
      implicit val lifecycle: LifecycleContainer = new LifecycleContainer()(testFriendlyClock)
      val dateTime: Long = LocalDateTime.of(2015, 7, 24, 11, 0).atZone(ZoneId.of("Europe/London")).toInstant.toEpochMilli
      val (joinProvider, orders, prices, orderPrices, ordersProvider, pricesProvider, _) = setupForJoinType(LeftOuterJoin)(lifecycle, testFriendlyClock, metrics)

      joinProvider.start()

      ordersProvider.tick("NYC-0001", Map("orderId" -> "NYC-0001", "trader" -> "chris", "tradeTime" -> dateTime, "quantity" -> 100, "ric" -> "VOD.L"))
      pricesProvider.tick("VOD.L", Map("ric" -> "VOD.L", "bid" -> 220.0, "ask" -> 222.0))

      testFriendlyClock.advanceBy(1000)
      pricesProvider.tick("BT.L", Map("ric" -> "BT.L", "bid" -> 500.0, "ask" -> 501.0))
      ordersProvider.tick("NYC-0002", Map("orderId" -> "NYC-0002", "trader" -> "chris", "tradeTime" -> dateTime, "quantity" -> 100, "ric" -> "BT.L"))

      joinProvider.runOnce()

      val row1 = orderPrices.pullRow("NYC-0001")
      val row1CreatedTime = row1.get(DefaultColumn.CreatedTime.name).asInstanceOf[EpochTimestamp]
      val row1LastUpdatedTime = row1.get(DefaultColumn.LastUpdatedTime.name).asInstanceOf[EpochTimestamp]
      row1CreatedTime shouldEqual row1LastUpdatedTime

      val row2 = orderPrices.pullRow("NYC-0002")
      val row2CreatedTime = row2.get(DefaultColumn.CreatedTime.name).asInstanceOf[EpochTimestamp]
      val row2LastUpdatedTime = row2.get(DefaultColumn.LastUpdatedTime.name).asInstanceOf[EpochTimestamp]
      row2CreatedTime shouldEqual row2LastUpdatedTime

      testFriendlyClock.advanceBy(1000)
      ordersProvider.tick("NYC-0002", Map("orderId" -> "NYC-0002", "trader" -> "chris", "tradeTime" -> dateTime, "quantity" -> 200, "ric" -> "BT.L"))

      joinProvider.runOnce()

      val updatedRow = orderPrices.pullRow("NYC-0002")
      val updatedRowCreatedTime = updatedRow.get(DefaultColumn.CreatedTime.name).asInstanceOf[EpochTimestamp]
      val updatedRowLastUpdatedTime = updatedRow.get(DefaultColumn.LastUpdatedTime.name).asInstanceOf[EpochTimestamp]
      updatedRowCreatedTime shouldEqual row2CreatedTime
      updatedRowLastUpdatedTime should be > row2LastUpdatedTime
    }

    Scenario("check created timestamp and last updated timestamp are populated correctly for InnerJoin") {
      val testFriendlyClock: TestFriendlyClock = new TestFriendlyClock(1000L)
      implicit val lifecycle: LifecycleContainer = new LifecycleContainer()(testFriendlyClock)
      val dateTime: Long = LocalDateTime.of(2015, 7, 24, 11, 0).atZone(ZoneId.of("Europe/London")).toInstant.toEpochMilli
      val (joinProvider, orders, prices, orderPrices, ordersProvider, pricesProvider, _) = setupForJoinType(InnerJoin)(lifecycle, testFriendlyClock, metrics)

      joinProvider.start()

      ordersProvider.tick("NYC-0001", Map("orderId" -> "NYC-0001", "trader" -> "chris", "tradeTime" -> dateTime, "quantity" -> 100, "ric" -> "VOD.L"))
      pricesProvider.tick("VOD.L", Map("ric" -> "VOD.L", "bid" -> 220.0, "ask" -> 222.0))

      testFriendlyClock.advanceBy(1000)
      pricesProvider.tick("BT.L", Map("ric" -> "BT.L", "bid" -> 500.0, "ask" -> 501.0))
      ordersProvider.tick("NYC-0002", Map("orderId" -> "NYC-0002", "trader" -> "chris", "tradeTime" -> dateTime, "quantity" -> 100, "ric" -> "BT.L"))

      joinProvider.runOnce()

      val row1 = orderPrices.pullRow("NYC-0001")
      val row1CreatedTime = row1.get(DefaultColumn.CreatedTime.name).asInstanceOf[EpochTimestamp]
      val row1LastUpdatedTime = row1.get(DefaultColumn.LastUpdatedTime.name).asInstanceOf[EpochTimestamp]
      row1CreatedTime shouldEqual row1LastUpdatedTime

      val row2 = orderPrices.pullRow("NYC-0002")
      val row2CreatedTime = row2.get(DefaultColumn.CreatedTime.name).asInstanceOf[EpochTimestamp]
      val row2LastUpdatedTime = row2.get(DefaultColumn.LastUpdatedTime.name).asInstanceOf[EpochTimestamp]
      row2CreatedTime shouldEqual row2LastUpdatedTime

      testFriendlyClock.advanceBy(1000)
      ordersProvider.tick("NYC-0002", Map("orderId" -> "NYC-0002", "trader" -> "chris", "tradeTime" -> dateTime, "quantity" -> 200, "ric" -> "BT.L"))

      joinProvider.runOnce()

      val updatedRow = orderPrices.pullRow("NYC-0002")
      val updatedRowCreatedTime = updatedRow.get(DefaultColumn.CreatedTime.name).asInstanceOf[EpochTimestamp]
      val updatedRowLastUpdatedTime = updatedRow.get(DefaultColumn.LastUpdatedTime.name).asInstanceOf[EpochTimestamp]
      updatedRowCreatedTime shouldEqual row2CreatedTime
      updatedRowLastUpdatedTime should be > row2LastUpdatedTime
    }
  }

}
