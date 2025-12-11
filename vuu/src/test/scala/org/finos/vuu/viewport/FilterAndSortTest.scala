package org.finos.vuu.viewport

import org.finos.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.{Clock, DefaultClock}
import org.finos.vuu.api.{Index, Indices, TableDef}
import org.finos.vuu.client.messages.RequestId
import org.finos.vuu.core.auths.VuuUser
import org.finos.vuu.core.filter.`type`.{AntlrBasedFilter, PermissionFilter}
import org.finos.vuu.core.filter.{EqualsClause, LessThanClause, NoFilter}
import org.finos.vuu.core.sort.{Sort, SortDirection, UserDefinedFilterAndSort}
import org.finos.vuu.core.table.{Columns, RowData, TableContainer, ViewPortColumnCreator}
import org.finos.vuu.feature.inmem.VuuInMemPlugin
import org.finos.vuu.net.{ClientSessionId, FilterSpec, SortDef, SortSpec}
import org.finos.vuu.plugin.DefaultPluginRegistry
import org.finos.vuu.provider.{JoinTableProviderImpl, MockProvider, ProviderContainer}
import org.finos.vuu.util.OutboundRowPublishQueue
import org.finos.vuu.util.table.TableAsserts
import org.finos.vuu.util.table.TableAsserts.assertVpEq
import org.scalatest.GivenWhenThen
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers
import org.scalatest.prop.Tables.Table

import java.time.{LocalDateTime, ZoneId}

class FilterAndSortTest extends AnyFeatureSpec with Matchers with ViewPortSetup with GivenWhenThen{

  implicit val timeProvider: Clock = new DefaultClock
  implicit val metrics: MetricsProvider = new MetricsProviderImpl

  def addRicSortableOrder(ordersProvider: MockProvider, index: Int, time: Long): Unit ={
    val orderId = "NYC-000" + index.toString.padTo(2, "0").mkString("")
    ordersProvider.tick(orderId, Map("orderId" -> orderId, "trader" -> "chris", "tradeTime" -> time,
                                                     "quantity" -> 100, "ric" -> (index.toString.padTo(2, "0").mkString("") + "VOD.L")))
  }

  def tickOrders(ordersProvider: MockProvider, orderId: String, quantity: Int): Unit = {
    ordersProvider.tick(orderId, Map("orderId" -> orderId, "quantity" -> quantity))
  }

  Feature("check the filter and sort infra"){

    Scenario("Check if we sort viewport 3x ASC, DESC, ASC in 3 cycles, do we lose the ticking"){

      import TableAsserts.*

      given lifecycle: LifecycleContainer = new LifecycleContainer

      val dateTime: Long = LocalDateTime.of(2015, 7, 24, 11, 0).atZone(ZoneId.of("Europe/London")).toInstant.toEpochMilli

      val (joinProvider, orders, prices, orderPrices, ordersProvider, pricesProvider, viewPortContainer) = setup()

      joinProvider.start()

      (0 until 50).foreach( i => addRicSortableOrder(ordersProvider, i, dateTime))

      val queue = new OutboundRowPublishQueue()

      val columns = ViewPortColumnCreator.create(orders, orders.getTableDef.getColumns.map(_.name).toList)

      val viewport = viewPortContainer.create(RequestId.oneNew(), VuuUser("B"), ClientSessionId("A", "C"), queue, orders, ViewPortRange(0, 5), columns)

      viewPortContainer.runOnce()

      assertVpEq(combineQs(viewport)){
        Table(
          ("orderId" ,"trader"  ,"ric"     ,"tradeTime","quantity"),
          ("NYC-00000","chris"   ,"00VOD.L" ,1437732000000L,100       ),
          ("NYC-00010","chris"   ,"10VOD.L" ,1437732000000L,100       ),
          ("NYC-00020","chris"   ,"20VOD.L" ,1437732000000L,100       ),
          ("NYC-00030","chris"   ,"30VOD.L" ,1437732000000L,100       ),
          ("NYC-00040","chris"   ,"40VOD.L" ,1437732000000L,100       )
        )
      }

      tickOrders(ordersProvider, "NYC-00040", 300)

      assertVpEq(combineQs(viewport)){
        Table(
          ("orderId" ,"trader"  ,"ric"     ,"tradeTime","quantity"),
          ("NYC-00040","chris"   ,"40VOD.L" ,1437732000000L,300      )
        )
      }

      val ricColumn = orders.getTableDef.columnForName("ric")

      //viewPortContainer.change()

      viewport.changeStructure(
        viewport.getStructure.copy(filtAndSort =
          UserDefinedFilterAndSort(
            NoFilter,
            Sort(SortSpec(List(SortDef(ricColumn.name, SortDirection.Descending.external))), List(ricColumn))
          )
        )
      )

      viewPortContainer.runOnce()

      assertVpEq(combineQs(viewport)){
        Table(
          ("orderId", "trader", "ric", "tradeTime", "quantity"),
          ("NYC-00050", "chris", "50VOD.L", 1437732000000L, 100),
          ("NYC-00060", "chris", "60VOD.L", 1437732000000L, 100),
          ("NYC-00070", "chris", "70VOD.L", 1437732000000L, 100),
          ("NYC-00080", "chris", "80VOD.L", 1437732000000L, 100),
          ("NYC-00090", "chris", "90VOD.L", 1437732000000L, 100)
        )
      }

      tickOrders(ordersProvider, "NYC-00050", 300)

      assertVpEq(combineQs(viewport)){
        Table(
          ("orderId" ,"trader"  ,"ric"     ,"tradeTime","quantity"),
          ("NYC-00050","chris"   ,"50VOD.L" ,1437732000000L,300      )
        )
      }

      viewport.changeStructure(
        viewport.getStructure.copy(filtAndSort =
          UserDefinedFilterAndSort(
            NoFilter,
            Sort(SortSpec(List(SortDef(ricColumn.name, SortDirection.Ascending.external))), List(ricColumn))
          )
        )
      )

      viewPortContainer.runOnce()

      assertVpEq(combineQs(viewport)){
        Table(
          ("orderId" ,"trader"  ,"ric"     ,"tradeTime","quantity"),
          ("NYC-00000","chris"   ,"00VOD.L" ,1437732000000L,100       ),
          ("NYC-00010","chris"   ,"10VOD.L" ,1437732000000L,100       ),
          ("NYC-00011","chris"   ,"11VOD.L" ,1437732000000L,100       ),
          ("NYC-00012","chris"   ,"12VOD.L" ,1437732000000L,100       ),
          ("NYC-00013","chris"   ,"13VOD.L" ,1437732000000L,100       )
        )
      }

      tickOrders(ordersProvider, "NYC-00011", 300)

      assertVpEq(combineQs(viewport)){
        Table(
          ("orderId" ,"trader"  ,"ric"     ,"tradeTime","quantity"),
          ("NYC-00011","chris"   ,"11VOD.L" ,1437732000000L,300      )
        )
      }

    }

    Scenario("check we can filter and sort as part of viewport"){

      import TableAsserts.*

      given lifecycle: LifecycleContainer = new LifecycleContainer

      val dateTime: Long = LocalDateTime.of(2015, 7, 24, 11, 0).atZone(ZoneId.of("Europe/London")).toInstant.toEpochMilli

      val (joinProvider, orders, prices, orderPrices, ordersProvider, pricesProvider, viewPortContainer) = setup()

      joinProvider.start()

      ordersProvider.tick("NYC-0001", Map("orderId" -> "NYC-0001", "trader" -> "chris", "tradeTime" -> dateTime, "quantity" -> 100, "ric" -> "VOD.L"))
      ordersProvider.tick("NYC-0002", Map("orderId" -> "NYC-0002", "trader" -> "chris", "tradeTime" -> dateTime, "quantity" -> 200, "ric" -> "VOD.L"))
      ordersProvider.tick("NYC-0003", Map("orderId" -> "NYC-0003", "trader" -> "chris", "tradeTime" -> dateTime, "quantity" -> 300, "ric" -> "VOD.L"))
      ordersProvider.tick("NYC-0004", Map("orderId" -> "NYC-0004", "trader" -> "chris", "tradeTime" -> dateTime, "quantity" -> 400, "ric" -> "VOD.L"))
      ordersProvider.tick("NYC-0005", Map("orderId" -> "NYC-0005", "trader" -> "chris", "tradeTime" -> dateTime, "quantity" -> 500, "ric" -> "VOD.L"))
      ordersProvider.tick("NYC-0006", Map("orderId" -> "NYC-0006", "trader" -> "chris", "tradeTime" -> dateTime, "quantity" -> 600, "ric" -> "VOD.L"))
      ordersProvider.tick("NYC-0007", Map("orderId" -> "NYC-0007", "trader" -> "chris", "tradeTime" -> dateTime, "quantity" -> 1000, "ric" -> "BT.L"))
      ordersProvider.tick("NYC-0008", Map("orderId" -> "NYC-0008", "trader" -> "chris", "tradeTime" -> dateTime, "quantity" -> 500, "ric" -> "BT.L"))

      pricesProvider.tick("VOD.L", Map("ric" -> "VOD.L", "bid" -> 220.0, "ask" -> 222.0))
      pricesProvider.tick("BT.L", Map("ric" -> "BT.L", "bid" -> 500.0, "ask" -> 501.0))

      joinProvider.runOnce()

//      val groupByContainer = new GroupByContainer()
//
//      val viewPortContainer = new ViewPortContainer(groupByContainer, tableContainer)

      val queue = new OutboundRowPublishQueue()

      val columns = ViewPortColumnCreator.create(orderPrices, orderPrices.getTableDef.getColumns.map(_.name).toList)

      //val columns = orderPrices.getTableDef.getColumns

      val viewport = viewPortContainer.create(RequestId.oneNew(), VuuUser("B"), ClientSessionId("A", "C"), queue, orderPrices, ViewPortRange(0, 20), columns)

      viewPortContainer.runOnce()

      val updates = combineQs(viewport)

      assertVpEq(updates){
        Table(
          ("orderId", "trader", "ric", "tradeTime", "quantity", "bid", "ask", "last", "open", "close"),
          ("NYC-0001", "chris", "VOD.L", 1437732000000L, 100, 220.0, 222.0, null, null, null),
          ("NYC-0002", "chris", "VOD.L", 1437732000000L, 200, 220.0, 222.0, null, null, null),
          ("NYC-0003", "chris", "VOD.L", 1437732000000L, 300, 220.0, 222.0, null, null, null),
          ("NYC-0004", "chris", "VOD.L", 1437732000000L, 400, 220.0, 222.0, null, null, null),
          ("NYC-0005", "chris", "VOD.L", 1437732000000L, 500, 220.0, 222.0, null, null, null),
          ("NYC-0006", "chris", "VOD.L", 1437732000000L, 600, 220.0, 222.0, null, null, null),
          ("NYC-0007", "chris", "BT.L", 1437732000000L, 1000, 500.0, 501.0, null, null, null),
          ("NYC-0008", "chris", "BT.L", 1437732000000L, 500, 500.0, 501.0, null, null, null)
        )
      }

      pricesProvider.tick("VOD.L", Map("ric" -> "VOD.L", "bid" -> 221.0, "ask" -> 224.0, "open" -> 226.0))

      joinProvider.runOnce()
      viewPortContainer.runOnce()

      val updates2 = combineQs(viewport)

      assertVpEq(updates2){
        Table(
          ("orderId", "trader", "ric", "tradeTime", "quantity", "bid", "ask", "last", "open", "close"),
          ("NYC-0001", "chris", "VOD.L", 1437732000000L, 100, 221.0, 224.0, null, 226.0, null),
          ("NYC-0002", "chris", "VOD.L", 1437732000000L, 200, 221.0, 224.0, null, 226.0, null),
          ("NYC-0003", "chris", "VOD.L", 1437732000000L, 300, 221.0, 224.0, null, 226.0, null),
          ("NYC-0004", "chris", "VOD.L", 1437732000000L, 400, 221.0, 224.0, null, 226.0, null),
          ("NYC-0005", "chris", "VOD.L", 1437732000000L, 500, 221.0, 224.0, null, 226.0, null),
          ("NYC-0006", "chris", "VOD.L", 1437732000000L, 600, 221.0, 224.0, null, 226.0, null)
        )
      }

      val orderIdColumn = orderPrices.getTableDef.columnForName("orderId")

      viewport.changeStructure(
        viewport.getStructure.copy(filtAndSort =
          UserDefinedFilterAndSort(
            AntlrBasedFilter(EqualsClause("orderId", "NYC-0001")),
            Sort(SortSpec(List(SortDef(orderIdColumn.name, SortDirection.Ascending.external))), List(orderIdColumn))
          )
        )
      )

      pricesProvider.tick("VOD.L", Map("ric" -> "VOD.L", "bid" -> 221.0, "ask" -> 226.0, "open" -> 226.0))

      //row view port container first..
      viewPortContainer.runOnce()

      joinProvider.runOnce()

      val updates3 = combineQs(viewport).filter( vp => vp.vpUpdate == RowUpdateType)

      updates3.size should be (1)
      updates3.head.vp.size should equal(1)
      updates3.head.vp.getRowKeyMappingSize_ForTest should equal(1)

      assertVpEq(updates3){
        Table(
          ("orderId" ,"trader"  ,"ric"     ,"tradeTime","quantity","bid"     ,"ask"     ,"last"    ,"open"    ,"close"   ),
          ("NYC-0001","chris"   ,"VOD.L"   ,1437732000000L,100       ,221.0     ,226.0     ,null      ,226.0     ,null      )
        )
      }

      viewport.changeStructure(
        viewport.getStructure.copy(filtAndSort =
          UserDefinedFilterAndSort(
            AntlrBasedFilter(LessThanClause("quantity", 800)),
            Sort(SortSpec(List(SortDef(orderIdColumn.name, SortDirection.Ascending.external))), List(orderIdColumn))
          )
        )
      )

      //row view port container first..
      viewPortContainer.runOnce()

      val updates4 = combineQs(viewport)

      assertVpEq(updates4){
        Table(
          ("orderId" ,"trader"  ,"ric"     ,"tradeTime","quantity","bid"     ,"ask"     ,"last"    ,"open"    ,"close"   ),
          ("NYC-0002","chris"   ,"VOD.L"   ,1437732000000L,200       ,221.0     ,226.0     ,null      ,226.0     ,null      ),
          ("NYC-0003","chris"   ,"VOD.L"   ,1437732000000L,300       ,221.0     ,226.0     ,null      ,226.0     ,null      ),
          ("NYC-0004","chris"   ,"VOD.L"   ,1437732000000L,400       ,221.0     ,226.0     ,null      ,226.0     ,null      ),
          ("NYC-0005","chris"   ,"VOD.L"   ,1437732000000L,500       ,221.0     ,226.0     ,null      ,226.0     ,null      ),
          ("NYC-0006","chris"   ,"VOD.L"   ,1437732000000L,600       ,221.0     ,226.0     ,null      ,226.0     ,null      ),
          ("NYC-0008","chris"   ,"BT.L"    ,1437732000000L,500       ,500.0     ,501.0     ,null      ,null      ,null      )
        )
      }

      viewport.changeStructure(
        viewport.getStructure.copy(filtAndSort =
          UserDefinedFilterAndSort(
            AntlrBasedFilter(LessThanClause("quantity", 800)),
            Sort(SortSpec(List(SortDef(orderIdColumn.name, SortDirection.Descending.external))), List(orderIdColumn))
          )
        )
      )

      //row view port container first..
      viewPortContainer.runOnce()

      val updates5 = combineQs(viewport)

      assertVpEq(updates5){
        Table(
          ("orderId", "trader", "ric", "tradeTime", "quantity", "bid", "ask", "last", "open", "close"),
          ("NYC-0001", "chris", "VOD.L", 1437732000000L, 100, 221.0, 226.0, null, 226.0, null),
          ("NYC-0002", "chris", "VOD.L", 1437732000000L, 200, 221.0, 226.0, null, 226.0, null),
          ("NYC-0003", "chris", "VOD.L", 1437732000000L, 300, 221.0, 226.0, null, 226.0, null),
          ("NYC-0005", "chris", "VOD.L", 1437732000000L, 500, 221.0, 226.0, null, 226.0, null),
          ("NYC-0006", "chris", "VOD.L", 1437732000000L, 600, 221.0, 226.0, null, 226.0, null),
          ("NYC-0008", "chris", "BT.L", 1437732000000L, 500, 500.0, 501.0, null, null, null)
        )
      }


    }

    Scenario("check we can filter and sort on a calcd column") {

      import TableAsserts.*

      given lifecycle: LifecycleContainer = new LifecycleContainer

      val dateTime: Long = LocalDateTime.of(2015, 7, 24, 11, 0).atZone(ZoneId.of("Europe/London")).toInstant.toEpochMilli

      val (joinProvider, orders, prices, orderPrices, ordersProvider, pricesProvider, viewPortContainer) = setup()

      joinProvider.start()

      ordersProvider.tick("NYC-0001", Map("orderId" -> "NYC-0001", "trader" -> "chris", "tradeTime" -> dateTime, "quantity" -> 100, "ric" -> "VOD.L"))
      ordersProvider.tick("NYC-0002", Map("orderId" -> "NYC-0002", "trader" -> "chris", "tradeTime" -> dateTime, "quantity" -> 200, "ric" -> "VOD.L"))
      ordersProvider.tick("NYC-0003", Map("orderId" -> "NYC-0003", "trader" -> "chris", "tradeTime" -> dateTime, "quantity" -> 300, "ric" -> "VOD.L"))
      ordersProvider.tick("NYC-0004", Map("orderId" -> "NYC-0004", "trader" -> "chris", "tradeTime" -> dateTime, "quantity" -> 400, "ric" -> "VOD.L"))
      ordersProvider.tick("NYC-0005", Map("orderId" -> "NYC-0005", "trader" -> "chris", "tradeTime" -> dateTime, "quantity" -> 500, "ric" -> "VOD.L"))
      ordersProvider.tick("NYC-0006", Map("orderId" -> "NYC-0006", "trader" -> "chris", "tradeTime" -> dateTime, "quantity" -> 600, "ric" -> "VOD.L"))
      ordersProvider.tick("NYC-0007", Map("orderId" -> "NYC-0007", "trader" -> "chris", "tradeTime" -> dateTime, "quantity" -> 1000, "ric" -> "BT.L"))
      ordersProvider.tick("NYC-0008", Map("orderId" -> "NYC-0008", "trader" -> "chris", "tradeTime" -> dateTime, "quantity" -> 500, "ric" -> "BT.L"))

      pricesProvider.tick("VOD.L", Map("ric" -> "VOD.L", "bid" -> 220.0, "ask" -> 222.0))
      pricesProvider.tick("BT.L", Map("ric" -> "BT.L", "bid" -> 500.0, "ask" -> 501.0))

      joinProvider.runOnce()

      //      val groupByContainer = new GroupByContainer()
      //
      //      val viewPortContainer = new ViewPortContainer(groupByContainer, tableContainer)

      val queue = new OutboundRowPublishQueue()

      val columns = ViewPortColumnCreator.create(orderPrices, orderPrices.getTableDef.getColumns.map(_.name).toList ++ List("orderIdTrader:String:=concatenate(orderId, trader)"))

      //val columns = orderPrices.getTableDef.getColumns

      val viewport = viewPortContainer.create(RequestId.oneNew(), VuuUser("B"), ClientSessionId("A", "C"), queue, orderPrices, ViewPortRange(0, 20), columns)

      viewPortContainer.runOnce()

      val updates = combineQs(viewport)

      assertVpEq(updates) {
        Table(
          ("orderId", "trader", "ric", "tradeTime", "quantity", "bid", "ask", "last", "open", "close", "orderIdTrader"),
          ("NYC-0001", "chris", "VOD.L", 1437732000000L, 100, 220.0, 222.0, null, null, null, "NYC-0001chris"),
          ("NYC-0002", "chris", "VOD.L", 1437732000000L, 200, 220.0, 222.0, null, null, null, "NYC-0002chris"),
          ("NYC-0003", "chris", "VOD.L", 1437732000000L, 300, 220.0, 222.0, null, null, null, "NYC-0003chris"),
          ("NYC-0004", "chris", "VOD.L", 1437732000000L, 400, 220.0, 222.0, null, null, null, "NYC-0004chris"),
          ("NYC-0005", "chris", "VOD.L", 1437732000000L, 500, 220.0, 222.0, null, null, null, "NYC-0005chris"),
          ("NYC-0006", "chris", "VOD.L", 1437732000000L, 600, 220.0, 222.0, null, null, null, "NYC-0006chris"),
          ("NYC-0007", "chris", "BT.L", 1437732000000L, 1000, 500.0, 501.0, null, null, null, "NYC-0007chris"),
          ("NYC-0008", "chris", "BT.L", 1437732000000L, 500, 500.0, 501.0, null, null, null, "NYC-0008chris")
        )
      }

      pricesProvider.tick("VOD.L", Map("ric" -> "VOD.L", "bid" -> 221.0, "ask" -> 224.0, "open" -> 226.0))

      joinProvider.runOnce()
      viewPortContainer.runOnce()

      val updates2 = combineQs(viewport)

      assertVpEq(updates2) {
        Table(
          ("orderId", "trader", "ric", "tradeTime", "quantity", "bid", "ask", "last", "open", "close", "orderIdTrader"),
          ("NYC-0001", "chris", "VOD.L", 1437732000000L, 100, 221.0, 224.0, null, 226.0, null, "NYC-0001chris"),
          ("NYC-0002", "chris", "VOD.L", 1437732000000L, 200, 221.0, 224.0, null, 226.0, null, "NYC-0002chris"),
          ("NYC-0003", "chris", "VOD.L", 1437732000000L, 300, 221.0, 224.0, null, 226.0, null, "NYC-0003chris"),
          ("NYC-0004", "chris", "VOD.L", 1437732000000L, 400, 221.0, 224.0, null, 226.0, null, "NYC-0004chris"),
          ("NYC-0005", "chris", "VOD.L", 1437732000000L, 500, 221.0, 224.0, null, 226.0, null, "NYC-0005chris"),
          ("NYC-0006", "chris", "VOD.L", 1437732000000L, 600, 221.0, 224.0, null, 226.0, null, "NYC-0006chris")
        )
      }

      val orderIdColumn = orderPrices.getTableDef.columnForName("orderId")

      viewport.changeStructure(
        viewport.getStructure.copy(filtAndSort =
          UserDefinedFilterAndSort(
            AntlrBasedFilter(EqualsClause("orderIdTrader", "NYC-0001chris")),
            Sort(SortSpec(List(SortDef(orderIdColumn.name, SortDirection.Ascending.external))), List(orderIdColumn))
          )
        )
      )

      pricesProvider.tick("VOD.L", Map("ric" -> "VOD.L", "bid" -> 221.0, "ask" -> 226.0, "open" -> 226.0))

      //row view port container first..
      viewPortContainer.runOnce()

      joinProvider.runOnce()

      val updates3 = combineQs(viewport).filter(vp => vp.vpUpdate == RowUpdateType)

      updates3.size should be(1)
      updates3(0).vp.size should equal(1)
      //make sure we clean up the mappings
      updates3(0).vp.getRowKeyMappingSize_ForTest should equal(1)

      assertVpEq(updates3) {
        Table(
          ("orderId", "trader", "ric", "tradeTime", "quantity", "bid", "ask", "last", "open", "close", "orderIdTrader"),
          ("NYC-0001", "chris", "VOD.L", 1437732000000L, 100, 221.0, 226.0, null, 226.0, null, "NYC-0001chris")
        )
      }

      When("we sort on a calc'd column definition, make sure it actually sorts in the name of the column")
      val orderIdTraderColumn = columns.getColumnForName("orderIdTrader:String:=concatenate(orderId, trader)").get

      viewport.changeStructure(
        viewport.getStructure.copy(filtAndSort =
          UserDefinedFilterAndSort(
            AntlrBasedFilter(LessThanClause("quantity", 800)),
            Sort(SortSpec(List(SortDef(orderIdTraderColumn.name, SortDirection.Descending.external))), List(orderIdTraderColumn))
          )
        )
      )

      //row view port container first..
      viewPortContainer.runOnce()

      val updates4 = combineQs(viewport)

      assertVpEq(updates4) {
        Table(
          ("orderId", "trader", "ric", "tradeTime", "quantity", "bid", "ask", "last", "open", "close", "orderIdTrader"),
          ("NYC-0001", "chris", "VOD.L", 1437732000000L, 100, 221.0, 226.0, null, 226.0, null, "NYC-0001chris"),
          ("NYC-0002", "chris", "VOD.L", 1437732000000L, 200, 221.0, 226.0, null, 226.0, null, "NYC-0002chris"),
          ("NYC-0003", "chris", "VOD.L", 1437732000000L, 300, 221.0, 226.0, null, 226.0, null, "NYC-0003chris"),
          ("NYC-0004", "chris", "VOD.L", 1437732000000L, 400, 221.0, 226.0, null, 226.0, null, "NYC-0004chris"),
          ("NYC-0005", "chris", "VOD.L", 1437732000000L, 500, 221.0, 226.0, null, 226.0, null, "NYC-0005chris"),
          ("NYC-0006", "chris", "VOD.L", 1437732000000L, 600, 221.0, 226.0, null, 226.0, null, "NYC-0006chris"),
          ("NYC-0008", "chris", "BT.L", 1437732000000L, 500, 500.0, 501.0, null, null, null, "NYC-0008chris")
        )
      }

      viewport.changeStructure(
        viewport.getStructure.copy(filtAndSort =
          UserDefinedFilterAndSort(
            AntlrBasedFilter(LessThanClause("quantity", 800)),
            Sort(SortSpec(List(SortDef(orderIdTraderColumn.name, SortDirection.Ascending.external))), List(orderIdTraderColumn))
          )
        )
      )

      //row view port container first..
      viewPortContainer.runOnce()

      val updates5 = combineQs(viewport)

      assertVpEq(updates5) {
        Table(
          ("orderId", "trader", "ric", "tradeTime", "quantity", "bid", "ask", "last", "open", "close", "orderIdTrader"),
          ("NYC-0001", "chris", "VOD.L", 1437732000000L, 100, 221.0, 226.0, null, 226.0, null, "NYC-0001chris"),
          ("NYC-0002", "chris", "VOD.L", 1437732000000L, 200, 221.0, 226.0, null, 226.0, null, "NYC-0002chris"),
          ("NYC-0003", "chris", "VOD.L", 1437732000000L, 300, 221.0, 226.0, null, 226.0, null, "NYC-0003chris"),
          ("NYC-0005", "chris", "VOD.L", 1437732000000L, 500, 221.0, 226.0, null, 226.0, null, "NYC-0005chris"),
          ("NYC-0006", "chris", "VOD.L", 1437732000000L, 600, 221.0, 226.0, null, 226.0, null, "NYC-0006chris"),
          ("NYC-0008", "chris", "BT.L", 1437732000000L, 500, 500.0, 501.0, null, null, null, "NYC-0008chris")
        )
      }


    }

    Scenario("test index hit does not override row permission filter") {

      given lifecycle: LifecycleContainer = new LifecycleContainer

      val pricesDef = TableDef(name = "prices",
        keyField = "ric",
        columns = Columns.fromNames("ric:String", "bid:Double", "ask:Double"),
        indices = Indices.apply(Index.apply("ric")),
        joinFields = "ric",
        permissionFunction = (vp, tc) =>
          PermissionFilter(
            (row: RowData) => {
              val ric = row.get("ric").asInstanceOf[String]
              ric != "VOD.L"
            }
          )      
      )
      val joinProvider = JoinTableProviderImpl()
      val tableContainer = new TableContainer(joinProvider)
      val prices = tableContainer.createTable(pricesDef)
      val pricesProvider = new MockProvider(prices)
      val providerContainer = new ProviderContainer(joinProvider)
      val pluginRegistry = new DefaultPluginRegistry()
      pluginRegistry.registerPlugin(new VuuInMemPlugin)
      val viewPortContainer = new ViewPortContainer(tableContainer, providerContainer, pluginRegistry)

      pricesProvider.tick("VOD.L", Map("ric" -> "VOD.L", "bid" -> 220.0, "ask" -> 222.0))
      pricesProvider.tick("BT.L", Map("ric" -> "BT.L", "bid" -> 500.0, "ask" -> 501.0))

      val queue = new OutboundRowPublishQueue()

      val columns = ViewPortColumnCreator.create(prices, prices.getTableDef.getColumns.map(_.name).toList)

      val viewport = viewPortContainer.create(RequestId.oneNew(), VuuUser("B"),
        ClientSessionId("A", "C"), queue, prices, ViewPortRange(0, 20), columns,
        filterSpec = FilterSpec("ric = \"VOD.L\" or ric = \"BT.L\" and vuuCreatedTimestamp > 0"))

      viewPortContainer.runOnce()

      val updates = combineQs(viewport)

      assertVpEq(updates) {
        Table(
          ("ric", "bid", "ask"),
          ("BT.L", 500.0, 501.0)
        )
      }

    }

  }

}
