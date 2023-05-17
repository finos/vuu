package org.finos.vuu.viewport.auths

import org.finos.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.{Clock, DefaultClock}
import org.finos.vuu.client.messages.RequestId
import org.finos.vuu.core.module.auths.PermissionSet
import org.finos.vuu.core.table.ViewPortColumnCreator
import org.finos.vuu.net.ClientSessionId
import org.finos.vuu.util.OutboundRowPublishQueue
import org.finos.vuu.util.table.TableAsserts.assertVpEq
import org.finos.vuu.viewport.{ViewPortRange, ViewPortSetup}
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers
import org.scalatest.prop.Tables.Table

class PermissionFilteredViewport extends AnyFeatureSpec with Matchers with ViewPortSetup {

  Feature("Permissioned Vuu Port Feature") {

    Scenario("Check filtering table based on permissions") {

      implicit val clock: Clock = new DefaultClock
      implicit val lifecycle: LifecycleContainer = new LifecycleContainer
      implicit val metrics: MetricsProvider = new MetricsProviderImpl

      val (joinProvider, orders, _, _, ordersProvider, pricesProvider, viewPortContainer) = setupPermission()

      joinProvider.start()

      tickInPermissionData(ordersProvider, pricesProvider)

      joinProvider.runOnce()

      val queue = new OutboundRowPublishQueue()
      val highPriorityQueue = new OutboundRowPublishQueue()
      val session = ClientSessionId("A", "B")
      val columns = ViewPortColumnCreator.create(orders, orders.getTableDef.columns.map(_.name).toList)
      val range = ViewPortRange(0, 20)
      val viewport = viewPortContainer.create(RequestId.oneNew(), session, queue, highPriorityQueue, orders, range, columns)

      val permissionChecker = viewport.permissionChecker().get.asInstanceOf[TestFriendlyPermissionChecker]
      permissionChecker.addRole(PermissionSet.SalesTradingPermission)

      runContainersOnce(viewPortContainer, joinProvider)

      assertVpEq(filterByVpId(combineQs(viewport), viewport)) {
        Table(
          ("orderId" ,"trader"  ,"ric"     ,"tradeTime","quantity","ownerMask"),
          ("NYC-0003","chris"   ,"VOD.L"   ,1311544800000L,300       ,1         ),
          ("NYC-0004","chris"   ,"VOD.L"   ,1311544800000L,400       ,1         ),
          ("NYC-0005","chris"   ,"VOD.L"   ,1311544800000L,500       ,1         )
        )
      }

      permissionChecker.addRole(PermissionSet.AlgoCoveragePermission)

      runContainersOnce(viewPortContainer, joinProvider)

      assertVpEq(filterByVpId(combineQs(viewport), viewport)) {
        Table(
          ("orderId" ,"trader"  ,"ric"     ,"tradeTime","quantity","ownerMask"),
          ("NYC-0001","chris"   ,"VOD.L"   ,1311544800000L,100       ,2         ),
          ("NYC-0002","chris"   ,"VOD.L"   ,1311544800000L,200       ,2         ),
          ("NYC-0003","chris"   ,"VOD.L"   ,1311544800000L,300       ,1         ),
          ("NYC-0004","chris"   ,"VOD.L"   ,1311544800000L,400       ,1         ),
          ("NYC-0005","chris"   ,"VOD.L"   ,1311544800000L,500       ,1         )
        )
      }

      permissionChecker.removeRole(PermissionSet.AlgoCoveragePermission)
      permissionChecker.removeRole(PermissionSet.SalesTradingPermission)

      runContainersOnce(viewPortContainer, joinProvider)

      assertVpEq(filterByVpId(combineQs(viewport), viewport)) {
        Table(
          ("orderId", "trader", "ric", "tradeTime", "quantity", "ownerMask"),
        )
      }

      permissionChecker.addRole(PermissionSet.HighTouchPermission)

      runContainersOnce(viewPortContainer, joinProvider)

      assertVpEq(filterByVpId(combineQs(viewport), viewport)) {
        Table(
          ("orderId" ,"trader"  ,"ric"     ,"tradeTime","quantity","ownerMask"),
          ("NYC-0006","steve"   ,"VOD.L"   ,1311544800000L,600       ,4         ),
          ("NYC-0007","steve"   ,"BT.L"    ,1311544800000L,1000      ,4         ),
          ("NYC-0008","steve"   ,"BT.L"    ,1311544800000L,500       ,4         )
        )
      }

    }
  }
}
