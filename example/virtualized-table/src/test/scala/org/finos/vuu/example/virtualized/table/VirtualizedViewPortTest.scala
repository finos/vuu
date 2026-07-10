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

          var updates = combineQsForVp(viewport)
          assertVpEq(updates) {
            Table(
              ("orderId" ,"quantity","price"   ,"side"    ,"trader"  ),
              ("0"       ,0         ,0L        ,"Buy"     ,"trader1" ),
              ("1"       ,1364076727,136407672700L,"Sell"    ,"trader1" ),
              ("2"       ,821347078 ,82134707800L,"Buy"     ,"trader1" ),
              ("3"       ,2047822809,204782280900L,"Sell"    ,"trader1" ),
              ("4"       ,614249093 ,61424909300L,"Sell"    ,"trader1" ),
              ("5"       ,871541811 ,87154181100L,"Sell"    ,"trader1" ),
              ("6"       ,1558924552,155892455200L,"Buy"     ,"trader1" ),
              ("7"       ,415870660 ,41587066000L,"Buy"     ,"trader1" ),
              ("8"       ,1228498187,122849818700L,"Sell"    ,"trader1" ),
              ("9"       ,1032050413,103205041300L,"Sell"    ,"trader1" )
            )
          }

          viewport.setRange(ViewPortRange(5, 15))

          updates = combineQsForVp(viewport)
          assertVpEq(updates) {
            Table(
              ("orderId" ,"quantity","price"   ,"side"    ,"trader"  ),
              ("10"      ,383449968 ,38344996800L,"Buy"     ,"trader1" ),
              ("11"      ,1818165756,181816575600L,"Buy"     ,"trader1" ),
              ("12"      ,2089332083,208933208300L,"Sell"    ,"trader1" ),
              ("13"      ,1782874734,178287473400L,"Buy"     ,"trader1" ),
              ("14"      ,1075063823,107506382300L,"Sell"    ,"trader1" )
            )
          }

          virtualizedProvider.runOnce(viewport)

          updates = combineQsForVp(viewport)
          updates.length shouldBe 0
      }

    }

  }
}
