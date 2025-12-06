//package org.finos.vuu.core.module.auths
//
//import org.finos.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
//import org.finos.toolbox.lifecycle.LifecycleContainer
//import org.finos.toolbox.time.{Clock, DefaultClock}
//import org.finos.vuu.api.{JoinSpec, JoinTableDef, JoinTo, LeftOuterJoin, TableDef}
//import org.finos.vuu.client.messages.RequestId
//import org.finos.vuu.core.table.{Columns, DataTable, TableContainer, ViewPortColumnCreator}
//import org.finos.vuu.net.ClientSessionId
//import org.finos.vuu.provider.{JoinTableProvider, JoinTableProviderImpl, MockProvider, ProviderContainer}
//import org.finos.vuu.util.OutboundRowPublishQueue
//import org.finos.vuu.viewport.{TestTimeStamp, ViewPortContainer, ViewPortRange}
//import org.joda.time.LocalDateTime
//import org.scalatest.featurespec.AnyFeatureSpec
//import org.scalatest.matchers.should.Matchers
//import org.scalatest.prop.Tables.Table
//
//class PermissionFilteredViewport extends AnyFeatureSpec with Matchers with ViewPortSetup {
//
//  import org.finos.vuu.viewport.TestTimeStamp.EPOCH_DEFAULT
//
//  def setupPermission()(implicit lifecycleContainer: LifecycleContainer,
//                        timeProvider: Clock, metrics: MetricsProvider): (JoinTableProvider, DataTable, DataTable, DataTable, MockProvider, MockProvider, ViewPortContainer) = {
//
//    val dateTime = new LocalDateTime(2015, 7, 24, 11, 0).toDateTime.toInstant.getMillis
//
//    val ordersDef = TableDef(
//      name = "orderPermission",
//      keyField = "orderId",
//      columns = Columns.fromNames("orderId:String", "trader:String", "ric:String", "tradeTime:Long", "quantity:Double", "ownerMask:Int"),
//      joinFields = "ric", "orderId"
//    ).withPermissions((vp, vs) => new TestFriendlyPermissionChecker(vp))
//
//    val pricesDef = TableDef("prices", "ric", Columns.fromNames("ric:String", "bid:Double", "ask:Double", "last:Double", "open:Double", "close:Double"), "ric")
//
//    val joinDef = JoinTableDef(
//      name = "orderPrices",
//      baseTable = ordersDef,
//      joinColumns = Columns.allFrom(ordersDef) ++ Columns.allFromExcept(pricesDef, "ric"),
//      joins =
//        JoinTo(
//          table = pricesDef,
//          joinSpec = JoinSpec(left = "ric", right = "ric", LeftOuterJoin)
//        ),
//      joinFields = Seq()
//    )
//
//    val joinProvider = JoinTableProviderImpl()
//
//    val tableContainer = new TableContainer(joinProvider)
//
//    val orders = tableContainer.createTable(ordersDef)
//    val prices = tableContainer.createTable(pricesDef)
//    val orderPrices = tableContainer.createJoinTable(joinDef)
//
//    val ordersProvider = new MockProvider(orders)
//    val pricesProvider = new MockProvider(prices)
//
//    val providerContainer = new ProviderContainer(joinProvider)
//
//    val viewPortContainer = new ViewPortContainer(tableContainer, providerContainer)
//
//    (joinProvider, orders, prices, orderPrices, ordersProvider, pricesProvider, viewPortContainer)
//  }
//
//
//  def tickInPermissionData(ordersProvider: MockProvider, pricesProvider: MockProvider): Unit = {
//    ordersProvider.tick("NYC-0001", Map("orderId" -> "NYC-0001", "trader" -> "chris", "tradeTime" -> EPOCH_DEFAULT, "quantity" -> 100, "ric" -> "VOD.L", "ownerMask" -> PermissionSet.AlgoCoveragePermission))
//    ordersProvider.tick("NYC-0002", Map("orderId" -> "NYC-0002", "trader" -> "chris", "tradeTime" -> EPOCH_DEFAULT, "quantity" -> 200, "ric" -> "VOD.L", "ownerMask" -> PermissionSet.AlgoCoveragePermission))
//    ordersProvider.tick("NYC-0003", Map("orderId" -> "NYC-0003", "trader" -> "chris", "tradeTime" -> EPOCH_DEFAULT, "quantity" -> 300, "ric" -> "VOD.L", "ownerMask" -> PermissionSet.SalesTradingPermission))
//    ordersProvider.tick("NYC-0004", Map("orderId" -> "NYC-0004", "trader" -> "chris", "tradeTime" -> EPOCH_DEFAULT, "quantity" -> 400, "ric" -> "VOD.L", "ownerMask" -> PermissionSet.SalesTradingPermission))
//    ordersProvider.tick("NYC-0005", Map("orderId" -> "NYC-0005", "trader" -> "chris", "tradeTime" -> EPOCH_DEFAULT, "quantity" -> 500, "ric" -> "VOD.L", "ownerMask" -> PermissionSet.SalesTradingPermission))
//    ordersProvider.tick("NYC-0006", Map("orderId" -> "NYC-0006", "trader" -> "steve", "tradeTime" -> EPOCH_DEFAULT, "quantity" -> 600, "ric" -> "VOD.L", "ownerMask" -> PermissionSet.HighTouchPermission))
//    ordersProvider.tick("NYC-0007", Map("orderId" -> "NYC-0007", "trader" -> "steve", "tradeTime" -> EPOCH_DEFAULT, "quantity" -> 1000, "ric" -> "BT.L", "ownerMask" -> PermissionSet.HighTouchPermission))
//    ordersProvider.tick("NYC-0008", Map("orderId" -> "NYC-0008", "trader" -> "steve", "tradeTime" -> EPOCH_DEFAULT, "quantity" -> 500, "ric" -> "BT.L", "ownerMask" -> PermissionSet.HighTouchPermission))
//
//    pricesProvider.tick("VOD.L", Map("ric" -> "VOD.L", "bid" -> 220.0, "ask" -> 222.0))
//    pricesProvider.tick("BT.L", Map("ric" -> "BT.L", "bid" -> 500.0, "ask" -> 501.0))
//  }
//
//  Feature("Permissioned Vuu Port Feature") {
//
//    Scenario("Check filtering table based on permissions") {
//
//      implicit val clock: Clock = new DefaultClock
//      implicit val lifecycle: LifecycleContainer = new LifecycleContainer
//      implicit val metrics: MetricsProvider = new MetricsProviderImpl
//
//      val (joinProvider, orders, _, _, ordersProvider, pricesProvider, viewPortContainer) = setupPermission()
//
//      joinProvider.start()
//
//      tickInPermissionData(ordersProvider, pricesProvider)
//
//      joinProvider.runOnce()
//
//      val queue = new OutboundRowPublishQueue()
//      val session = ClientSessionId("A", "B")
//      val columns = ViewPortColumnCreator.create(orders, orders.getTableDef.getColumns.map(_.name).toList)
//      val range = ViewPortRange(0, 20)
//      val viewport = viewPortContainer.create(RequestId.oneNew(), session, queue, orders, range, columns)
//
//      val permissionChecker = viewport.permissionChecker().get.asInstanceOf[TestFriendlyPermissionChecker]
//      permissionChecker.addRole(PermissionSet.SalesTradingPermission)
//
//      runContainersOnce(viewPortContainer, joinProvider)
//
//      assertVpEq(filterByVpId(combineQs(viewport), viewport)) {
//        Table(
//          ("orderId" ,"trader"  ,"ric"     ,"tradeTime","quantity","ownerMask"),
//          ("NYC-0003","chris"   ,"VOD.L"   ,1311544800000L,300       ,1         ),
//          ("NYC-0004","chris"   ,"VOD.L"   ,1311544800000L,400       ,1         ),
//          ("NYC-0005","chris"   ,"VOD.L"   ,1311544800000L,500       ,1         )
//        )
//      }
//
//      permissionChecker.addRole(PermissionSet.AlgoCoveragePermission)
//
//      runContainersOnce(viewPortContainer, joinProvider)
//
//      assertVpEq(filterByVpId(combineQs(viewport), viewport)) {
//        Table(
//          ("orderId" ,"trader"  ,"ric"     ,"tradeTime","quantity","ownerMask"),
//          ("NYC-0001","chris"   ,"VOD.L"   ,1311544800000L,100       ,2         ),
//          ("NYC-0002","chris"   ,"VOD.L"   ,1311544800000L,200       ,2         ),
//          ("NYC-0003","chris"   ,"VOD.L"   ,1311544800000L,300       ,1         ),
//          ("NYC-0004","chris"   ,"VOD.L"   ,1311544800000L,400       ,1         ),
//          ("NYC-0005","chris"   ,"VOD.L"   ,1311544800000L,500       ,1         )
//        )
//      }
//
//      permissionChecker.removeRole(PermissionSet.AlgoCoveragePermission)
//      permissionChecker.removeRole(PermissionSet.SalesTradingPermission)
//
//      runContainersOnce(viewPortContainer, joinProvider)
//
//      assertVpEq(filterByVpId(combineQs(viewport), viewport)) {
//        Table(
//          ("orderId", "trader", "ric", "tradeTime", "quantity", "ownerMask"),
//        )
//      }
//
//      permissionChecker.addRole(PermissionSet.HighTouchPermission)
//
//      runContainersOnce(viewPortContainer, joinProvider)
//
//      assertVpEq(filterByVpId(combineQs(viewport), viewport)) {
//        Table(
//          ("orderId" ,"trader"  ,"ric"     ,"tradeTime","quantity","ownerMask"),
//          ("NYC-0006","steve"   ,"VOD.L"   ,1311544800000L,600       ,4         ),
//          ("NYC-0007","steve"   ,"BT.L"    ,1311544800000L,1000      ,4         ),
//          ("NYC-0008","steve"   ,"BT.L"    ,1311544800000L,500       ,4         )
//        )
//      }
//
//    }
//  }
//}
