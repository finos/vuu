package io.venuu.vuu.viewport

import io.venuu.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import io.venuu.toolbox.lifecycle.LifecycleContainer
import io.venuu.toolbox.time.{Clock, DefaultClock}
import io.venuu.vuu.client.messages.RequestId
import io.venuu.vuu.core.filter.{EqFilter, LessThanFilter, NoFilter}
import io.venuu.vuu.core.sort.{AlphaSort, SortDirection, UserDefinedFilterAndSort}
import io.venuu.vuu.net.ClientSessionId
import io.venuu.vuu.provider.MockProvider
import io.venuu.vuu.util.OutboundRowPublishQueue
import io.venuu.vuu.util.table.TableAsserts
import org.joda.time.{DateTime, DateTimeZone}
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers
import org.scalatest.prop.Tables.Table

class FilterAndSortTest extends AnyFeatureSpec with Matchers with ViewPortSetup {

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

      import TableAsserts._

      implicit val lifecycle = new LifecycleContainer

      val dateTime = new DateTime(2015, 7, 24, 11, 0, DateTimeZone.forID("Europe/London")).toDateTime.toInstant.getMillis

      val (joinProvider, orders, prices, orderPrices, ordersProvider, pricesProvider, viewPortContainer) = setup()

      joinProvider.start()

      (0 until 50).foreach( i => addRicSortableOrder(ordersProvider, i, dateTime))

      val queue = new OutboundRowPublishQueue()
      val highPriorityQueue  = new OutboundRowPublishQueue()

      val columns = orders.getTableDef.columns

      val viewport = viewPortContainer.create(RequestId.oneNew(), ClientSessionId("A", "B"), queue, highPriorityQueue, orders, ViewPortRange(0, 5), columns.toList)

      viewPortContainer.runOnce()

      assertVpEq(combineQs(viewport)){
        Table(
          ("orderId" ,"trader"  ,"ric"     ,"tradeTime","quantity"),
          ("NYC-00000","chris"   ,"00VOD.L" ,1437732000000l,100       ),
          ("NYC-00010","chris"   ,"10VOD.L" ,1437732000000l,100       ),
          ("NYC-00020","chris"   ,"20VOD.L" ,1437732000000l,100       ),
          ("NYC-00030","chris"   ,"30VOD.L" ,1437732000000l,100       ),
          ("NYC-00040","chris"   ,"40VOD.L" ,1437732000000l,100       )
        )
      }

      tickOrders(ordersProvider, "NYC-00040", 300)

      assertVpEq(combineQs(viewport)){
        Table(
          ("orderId" ,"trader"  ,"ric"     ,"tradeTime","quantity"),
          ("NYC-00040","chris"   ,"40VOD.L" ,1437732000000l,300      )
        )
      }

      val ricColumn = orders.getTableDef.columnForName("ric")

      //viewPortContainer.change()

      viewport.changeStructure(
        viewport.getStructure.copy(filtAndSort =
          UserDefinedFilterAndSort(
            NoFilter,
            AlphaSort(SortDirection.Descending, ricColumn)
          )
        )
      )

      viewPortContainer.runOnce()

      assertVpEq(combineQs(viewport)){
        Table(
          ("orderId" ,"trader"  ,"ric"     ,"tradeTime","quantity"),
          ("NYC-00090","chris"   ,"90VOD.L" ,1437732000000l,100       ),
          ("NYC-00080","chris"   ,"80VOD.L" ,1437732000000l,100       ),
          ("NYC-00070","chris"   ,"70VOD.L" ,1437732000000l,100       ),
          ("NYC-00060","chris"   ,"60VOD.L" ,1437732000000l,100       ),
          ("NYC-00050","chris"   ,"50VOD.L" ,1437732000000l,100       )
        )
      }

      tickOrders(ordersProvider, "NYC-00050", 300)

      assertVpEq(combineQs(viewport)){
        Table(
          ("orderId" ,"trader"  ,"ric"     ,"tradeTime","quantity"),
          ("NYC-00050","chris"   ,"50VOD.L" ,1437732000000l,300      )
        )
      }

      viewport.changeStructure(
        viewport.getStructure.copy(filtAndSort =
          UserDefinedFilterAndSort(
            NoFilter,
            AlphaSort(SortDirection.Ascending, ricColumn)
          )
        )
      )

      viewPortContainer.runOnce()

      assertVpEq(combineQs(viewport)){
        Table(
          ("orderId" ,"trader"  ,"ric"     ,"tradeTime","quantity"),
          ("NYC-00000","chris"   ,"00VOD.L" ,1437732000000l,100       ),
          ("NYC-00010","chris"   ,"10VOD.L" ,1437732000000l,100       ),
          ("NYC-00011","chris"   ,"11VOD.L" ,1437732000000l,100       ),
          ("NYC-00012","chris"   ,"12VOD.L" ,1437732000000l,100       ),
          ("NYC-00013","chris"   ,"13VOD.L" ,1437732000000l,100       )
        )
      }

      tickOrders(ordersProvider, "NYC-00011", 300)

      assertVpEq(combineQs(viewport)){
        Table(
          ("orderId" ,"trader"  ,"ric"     ,"tradeTime","quantity"),
          ("NYC-00011","chris"   ,"11VOD.L" ,1437732000000l,300      )
        )
      }

    }

    Scenario("check we can filter and sort as part of viewport"){

      import TableAsserts._

      implicit val lifecycle = new LifecycleContainer

      val dateTime = new DateTime(2015, 7, 24, 11, 0, DateTimeZone.forID("Europe/London")).toDateTime.toInstant.getMillis

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
      val highPriorityQueue  = new OutboundRowPublishQueue()

      val columns = orderPrices.getTableDef.columns

      val viewport = viewPortContainer.create(RequestId.oneNew(), ClientSessionId("A", "B"), queue, highPriorityQueue, orderPrices, ViewPortRange(0, 20), columns.toList)

      viewPortContainer.runOnce()

      val updates = combineQs(viewport)

      assertVpEq(updates){
        Table(
          ("orderId" ,"trader"  ,"ric"     ,"tradeTime","quantity","bid"     ,"ask"     ,"last"    ,"open"    ,"close"   ),
          ("NYC-0001","chris"   ,"VOD.L"   ,1437732000000l,100       ,220.0     ,222.0     ,null      ,null      ,null      ),
          ("NYC-0002","chris"   ,"VOD.L"   ,1437732000000l,200       ,220.0     ,222.0     ,null      ,null      ,null      ),
          ("NYC-0003","chris"   ,"VOD.L"   ,1437732000000l,300       ,220.0     ,222.0     ,null      ,null      ,null      ),
          ("NYC-0004","chris"   ,"VOD.L"   ,1437732000000l,400       ,220.0     ,222.0     ,null      ,null      ,null      ),
          ("NYC-0005","chris"   ,"VOD.L"   ,1437732000000l,500       ,220.0     ,222.0     ,null      ,null      ,null      ),
          ("NYC-0006","chris"   ,"VOD.L"   ,1437732000000l,600       ,220.0     ,222.0     ,null      ,null      ,null      ),
          ("NYC-0007","chris"   ,"BT.L"    ,1437732000000l,1000      ,500.0     ,501.0     ,null      ,null      ,null      ),
          ("NYC-0008","chris"   ,"BT.L"    ,1437732000000l,500       ,500.0     ,501.0     ,null      ,null      ,null      )
        )
      }

      pricesProvider.tick("VOD.L", Map("ric" -> "VOD.L", "bid" -> 221.0, "ask" -> 224.0, "open" -> 226.0))

      joinProvider.runOnce()
      viewPortContainer.runOnce()

      val updates2 = combineQs(viewport)

      assertVpEq(updates2){
        Table(
          ("orderId" ,"trader"  ,"ric"     ,"tradeTime","quantity","bid"     ,"ask"     ,"last"    ,"open"    ,"close"   ),
          ("NYC-0001","chris"   ,"VOD.L"   ,1437732000000l,100       ,221.0     ,224.0     ,null      ,226.0     ,null      ),
          ("NYC-0002","chris"   ,"VOD.L"   ,1437732000000l,200       ,221.0     ,224.0     ,null      ,226.0     ,null      ),
          ("NYC-0003","chris"   ,"VOD.L"   ,1437732000000l,300       ,221.0     ,224.0     ,null      ,226.0     ,null      ),
          ("NYC-0004","chris"   ,"VOD.L"   ,1437732000000l,400       ,221.0     ,224.0     ,null      ,226.0     ,null      ),
          ("NYC-0005","chris"   ,"VOD.L"   ,1437732000000l,500       ,221.0     ,224.0     ,null      ,226.0     ,null      ),
          ("NYC-0006","chris"   ,"VOD.L"   ,1437732000000l,600       ,221.0     ,224.0     ,null      ,226.0     ,null      )
        )
      }

      val orderIdColumn = orderPrices.getTableDef.columnForName("orderId")

      viewport.changeStructure(
        viewport.getStructure.copy(filtAndSort =
          UserDefinedFilterAndSort(
            EqFilter(orderIdColumn, "NYC-0001"),
            AlphaSort(SortDirection.Ascending, orderIdColumn)
          )
        )
      )

      pricesProvider.tick("VOD.L", Map("ric" -> "VOD.L", "bid" -> 221.0, "ask" -> 226.0, "open" -> 226.0))

      //row view port container first..
      viewPortContainer.runOnce()

      joinProvider.runOnce()

      val updates3 = combineQs(viewport).filter( vp => vp.vpUpdate == RowUpdateType)

      updates3.size should be (1)
      updates3(0).vp.size should equal(1)
      //make sure we clean up the mappings
      updates3(0).vp.getRowKeyMappingSize_ForTest should equal(1)

      assertVpEq(updates3){
        Table(
          ("orderId" ,"trader"  ,"ric"     ,"tradeTime","quantity","bid"     ,"ask"     ,"last"    ,"open"    ,"close"   ),
          ("NYC-0001","chris"   ,"VOD.L"   ,1437732000000l,100       ,221.0     ,226.0     ,null      ,226.0     ,null      )
        )
      }

      val quantityColumn = orderPrices.getTableDef.columnForName("quantity")

      viewport.changeStructure(
        viewport.getStructure.copy(filtAndSort =
          UserDefinedFilterAndSort(
            LessThanFilter(quantityColumn, 800),
            AlphaSort(SortDirection.Ascending, orderIdColumn)
          )
        )
      )

      //row view port container first..
      viewPortContainer.runOnce()

      val updates4 = combineQs(viewport)

      assertVpEq(updates4){
        Table(
          ("orderId" ,"trader"  ,"ric"     ,"tradeTime","quantity","bid"     ,"ask"     ,"last"    ,"open"    ,"close"   ),
          ("NYC-0002","chris"   ,"VOD.L"   ,1437732000000l,200       ,221.0     ,226.0     ,null      ,226.0     ,null      ),
          ("NYC-0003","chris"   ,"VOD.L"   ,1437732000000l,300       ,221.0     ,226.0     ,null      ,226.0     ,null      ),
          ("NYC-0004","chris"   ,"VOD.L"   ,1437732000000l,400       ,221.0     ,226.0     ,null      ,226.0     ,null      ),
          ("NYC-0005","chris"   ,"VOD.L"   ,1437732000000l,500       ,221.0     ,226.0     ,null      ,226.0     ,null      ),
          ("NYC-0006","chris"   ,"VOD.L"   ,1437732000000l,600       ,221.0     ,226.0     ,null      ,226.0     ,null      ),
          ("NYC-0008","chris"   ,"BT.L"    ,1437732000000l,500       ,500.0     ,501.0     ,null      ,null      ,null      )
        )
      }

      viewport.changeStructure(
        viewport.getStructure.copy(filtAndSort =
          UserDefinedFilterAndSort(
            LessThanFilter(quantityColumn, 800),
            AlphaSort(SortDirection.Descending, orderIdColumn)
          )
        )
      )

      //row view port container first..
      viewPortContainer.runOnce()

      val updates5 = combineQs(viewport)

      assertVpEq(updates5){
        Table(
          ("orderId" ,"trader"  ,"ric"     ,"tradeTime","quantity","bid"     ,"ask"     ,"last"    ,"open"    ,"close"   ),
          ("NYC-0008","chris"   ,"BT.L"    ,1437732000000l,500       ,500.0     ,501.0     ,null      ,null      ,null      ),
          ("NYC-0006","chris"   ,"VOD.L"   ,1437732000000l,600       ,221.0     ,226.0     ,null      ,226.0     ,null      ),
          ("NYC-0005","chris"   ,"VOD.L"   ,1437732000000l,500       ,221.0     ,226.0     ,null      ,226.0     ,null      ),
          ("NYC-0003","chris"   ,"VOD.L"   ,1437732000000l,300       ,221.0     ,226.0     ,null      ,226.0     ,null      ),
          ("NYC-0002","chris"   ,"VOD.L"   ,1437732000000l,200       ,221.0     ,226.0     ,null      ,226.0     ,null      ),
          ("NYC-0001","chris"   ,"VOD.L"   ,1437732000000l,100       ,221.0     ,226.0     ,null      ,226.0     ,null      )
        )
      }


    }

  }

}
