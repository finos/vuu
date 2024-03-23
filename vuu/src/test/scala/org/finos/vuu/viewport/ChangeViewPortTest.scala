package org.finos.vuu.viewport

import org.finos.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.{Clock, DefaultClock}
import org.finos.vuu.api._
import org.finos.vuu.client.messages.RequestId
import org.finos.vuu.core.table.TableTestHelper._
import org.finos.vuu.core.table.{Columns, TableContainer, ViewPortColumnCreator}
import org.finos.vuu.feature.inmem.VuuInMemPlugin
import org.finos.vuu.net.{ClientSessionId, FilterSpec}
import org.finos.vuu.plugin.DefaultPluginRegistry
import org.finos.vuu.provider.{JoinTableProviderImpl, MockProvider, ProviderContainer}
import org.finos.vuu.util.OutboundRowPublishQueue
import org.finos.vuu.util.table.TableAsserts._
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.prop.Tables.Table

class ChangeViewPortTest extends AnyFeatureSpec{

  implicit val timeProvider: Clock = new DefaultClock
  implicit val metrics: MetricsProvider = new MetricsProviderImpl

  def setupViewPort(tableContainer: TableContainer, providerContainer: ProviderContainer): ViewPortContainer = {

    val pluginRegistry = new DefaultPluginRegistry
    pluginRegistry.registerPlugin(new VuuInMemPlugin)

    val viewPortContainer = new ViewPortContainer(tableContainer, providerContainer, pluginRegistry)

    viewPortContainer
  }

  Feature("Check we can modify a view port"){

    Scenario("Change the columns check view port reflects this"){

      implicit val lifecycle: LifecycleContainer = new LifecycleContainer

      val dateTime = 1437728400000L//new LocalDateTime(2015, 7, 24, 11, 0).toDateTime.toInstant.getMillis

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
      pricesProvider.tick("VOD.L", Map("ric" -> "VOD.L", "bid" -> 220.0, "ask" -> 222.0, "last" -> 30))

      pricesProvider.tick("BT.L", Map("ric" -> "BT.L", "bid" -> 500.0, "ask" -> 501.0, "last" -> 40))
      ordersProvider.tick("NYC-0002", Map("orderId" -> "NYC-0002", "trader" -> "chris", "tradeTime" -> dateTime, "quantity" -> 100, "ric" -> "BT.L"))

      joinProvider.runOnce()

      val session = ClientSessionId("sess-01", "chris")

      val outQueue = new OutboundRowPublishQueue()

      val vpcolumns = ViewPortColumnCreator.create(orderPrices, List("orderId", "trader", "tradeTime", "quantity", "ric", "bid", "ask"))//.map(orderPrices.getTableDef.columnForName(_)).toList

      val viewPort = viewPortContainer.create(RequestId.oneNew(), session, outQueue, orderPrices, DefaultRange, vpcolumns)

      viewPortContainer.runOnce()

      val combinedUpdates = combineQs(viewPort)

      assertVpEq(combinedUpdates){
        Table(
          ("orderId" ,"trader"  ,"ric"     ,"tradeTime","quantity","bid"     ,"ask"     ),
          ("NYC-0001","chris"   ,"VOD.L"   ,1437728400000L,100       ,220.0     ,222.0     ),
          ("NYC-0002","chris"   ,"BT.L"    ,1437728400000L,100       ,500.0     ,501.0     )
        )
      }

      val vpcolumns2 = ViewPortColumnCreator.create(orderPrices, List("orderId", "trader", "tradeTime", "quantity", "ric", "bid", "ask", "last", "open"))//.map(orderPrices.getTableDef.columnForName(_)).toList

      val viewPort2 = viewPortContainer.change(RequestId.oneNew(), session, viewPort.id, DefaultRange, vpcolumns2)

      viewPortContainer.runOnce()

      val combinedUpdates2 = combineQs(viewPort2)

      assertVpEq(combinedUpdates2){
        Table(
          ("orderId" ,"trader"  ,"ric"     ,"tradeTime","quantity","bid"     ,"ask"     ,"last"    ,"open"    ),
          ("NYC-0001","chris"   ,"VOD.L"   ,1437728400000L,100       ,220.0     ,222.0     ,30        ,null      ),
          ("NYC-0002","chris"   ,"BT.L"    ,1437728400000L,100       ,500.0     ,501.0     ,40        ,null      )
        )
      }

      val viewPort3 = viewPortContainer.change(RequestId.oneNew(), session, viewPort.id, DefaultRange, vpcolumns2, filterSpec = FilterSpec("ric = \"VOD.L\"") )

      viewPortContainer.runOnce()

      val combinedUpdates3 = combineQs(viewPort3)

      assertVpEq(combinedUpdates3){
        Table(
          ("orderId" ,"trader"  ,"ric"     ,"tradeTime","quantity","bid"     ,"ask"     ,"last"    ,"open"    )
//          ("NYC-0001","chris"   ,"VOD.L"   ,1437728400000l,100       ,220.0     ,222.0     ,30        ,null      ),
//          ("NYC-0002","chris"   ,"BT.L"    ,1437728400000l,100       ,500.0     ,501.0     ,40        ,null      )
        )
      }

    }

  }

}
