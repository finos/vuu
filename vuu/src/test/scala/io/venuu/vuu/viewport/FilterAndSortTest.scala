/**
  * Copyright Whitebox Software Ltd. 2014
  * All Rights Reserved.

  * Created by chris on 19/11/2015.

  */
package io.venuu.vuu.viewport

import io.venuu.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import io.venuu.toolbox.lifecycle.LifecycleContainer
import io.venuu.toolbox.time.{DefaultTimeProvider, TimeProvider}
import io.venuu.vuu.core.filter.{EqFilter, LessThanFilter}
import io.venuu.vuu.core.sort.{AlphaSort, SortDirection, UserDefinedFilterAndSort}
import io.venuu.vuu.net.ClientSessionId
import io.venuu.vuu.util.OutboundRowPublishQueue
import io.venuu.vuu.util.table.TableAsserts
import org.joda.time.{DateTime, DateTimeZone}
import org.scalatest.prop.Tables.Table
import org.scalatest.{FeatureSpec, Matchers}

class FilterAndSortTest extends FeatureSpec with Matchers {

  implicit val timeProvider: TimeProvider = new DefaultTimeProvider
  implicit val metrics: MetricsProvider = new MetricsProviderImpl

  feature("check the filter and sort infra"){

    scenario("check we can filter and sort as part of viewport"){

      import OrdersAndPricesScenarioFixture._
      import TableAsserts._
      import io.venuu.vuu.core.table.TableTestHelper._

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

      val viewport = viewPortContainer.create(ClientSessionId("A", "B"), queue, highPriorityQueue, orderPrices, ViewPortRange(0, 20), columns.toList)

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
