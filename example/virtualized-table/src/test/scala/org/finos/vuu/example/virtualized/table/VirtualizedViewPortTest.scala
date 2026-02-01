package org.finos.vuu.example.virtualized.table

import org.finos.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.{Clock, TestFriendlyClock}
import org.finos.vuu.core.module.TableDefContainer
import org.finos.vuu.example.virtualtable.module.VirtualTableModule
import org.finos.vuu.plugin.virtualized.VirtualizedTablePlugin
import org.finos.vuu.provider.VirtualizedProvider
import org.finos.vuu.test.VuuServerTestCase
import org.finos.vuu.util.table.TableAsserts.assertVpEq
import org.finos.vuu.viewport.ViewPortRange
import org.scalatest.prop.Tables.Table

class VirtualizedViewPortTest extends VuuServerTestCase {

  Feature("Virtualized Table Viewport") {

    Scenario("Check creation of a virtualized viewport") {

      implicit val clock: Clock = new TestFriendlyClock(10001L)
      implicit val lifecycle: LifecycleContainer = new LifecycleContainer()
      implicit val tableDefContainer: TableDefContainer = new TableDefContainer(Map())
      implicit val metricsProvider: MetricsProvider = new MetricsProviderImpl

      withVuuServer(VirtualTableModule()) {
        vuuServer =>

          vuuServer.registerPlugin(VirtualizedTablePlugin)

          vuuServer.login("testUser")

          val viewport = vuuServer.createViewPort(VirtualTableModule.NAME, "bigOrders", ViewPortRange(0, 10))

          val virtualizedProvider = viewport.table.asTable.getProvider.asInstanceOf[VirtualizedProvider]

          virtualizedProvider.runOnce(viewport)

          assertVpEq(combineQsForVp(viewport)) {
            Table(
              ("orderId" ,"quantity","price"   ,"side"    ,"trader"  ),
              ("0"       ,-1155484576,-3109364765729502342L,"Buy"     ,"trader1" ),
              ("1"       ,-1155869325,1853403699951111791L,"Sell"    ,"trader1" ),
              ("2"       ,-1154715079,5411842376618821008L,"Sell"    ,"trader1" ),
              ("3"       ,-1155099828,-8072133231410116475L,"Buy"     ,"trader1" ),
              ("4"       ,-1157023572,-1705034981011564721L,"Buy"     ,"trader1" ),
              ("5"       ,-1157408321,3257733484669049412L,"Buy"     ,"trader1" ),
              ("6"       ,-1156254074,6816172161336758629L,"Sell"    ,"trader1" ),
              ("7"       ,-1156638823,-6667803446692178854L,"Sell"    ,"trader1" ),
              ("8"       ,-1158562568,-300705196293627100L,"Sell"    ,"trader1" ),
              ("9"       ,-1158947317,4662063269386987033L,"Buy"     ,"trader1" )
            )
          }

          viewport.setRange(ViewPortRange(5, 15))

          assertVpEq(combineQsForVp(viewport)) {
            Table(
              ("orderId" ,"quantity","price"   ,"side"    ,"trader"  ),
              ("10"      ,-1157793070,8220501950349663546L,"Sell"    ,"trader1" ),
              ("11"      ,-1158177819,-5263473657679273937L,"Sell"    ,"trader1" ),
              ("12"      ,-1160101563,1103624592719277817L,"Sell"    ,"trader1" ),
              ("13"      ,-1160486312,6066393058399891950L,"Sell"    ,"trader1" ),
              ("14"      ,-1159332065,-8821912338641950449L,"Buy"     ,"trader1" )
            )
          }

          virtualizedProvider.runOnce(viewport)

          assertVpEq(combineQsForVp(viewport)) {
            Table(
              ("orderId" ,"quantity","price"   ,"side"    ,"trader"  ),
              ("10"      ,-1157793070,8220501950349663546L,"Sell"    ,"trader1" ),
              ("11"      ,-1158177819,-5263473657679273937L,"Sell"    ,"trader1" ),
              ("12"      ,-1160101563,1103624592719277817L,"Sell"    ,"trader1" ),
              ("13"      ,-1160486312,6066393058399891950L,"Sell"    ,"trader1" ),
              ("14"      ,-1159332065,-8821912338641950449L,"Buy"     ,"trader1" ),
              ("5"       ,-1157408321,3257733484669049412L,"Buy"     ,"trader1" ),
              ("6"       ,-1156254074,6816172161336758629L,"Sell"    ,"trader1" ),
              ("7"       ,-1156638823,-6667803446692178854L,"Sell"    ,"trader1" ),
              ("8"       ,-1158562568,-300705196293627100L,"Sell"    ,"trader1" ),
              ("9"       ,-1158947317,4662063269386987033L,"Buy"     ,"trader1" )
            )
          }
      }

    }

  }
}
