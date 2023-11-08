package org.finos.vuu.core.module.basket

import org.finos.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.{Clock, TestFriendlyClock}
import org.finos.vuu.api.ViewPortDef
import org.finos.vuu.core.module.TableDefContainer
import org.finos.vuu.core.module.price.PriceModule
import org.finos.vuu.core.table.TableTestHelper.combineQs
import org.finos.vuu.test.VuuServerTestCase
import org.finos.vuu.util.table.TableAsserts.assertVpEq
import org.scalatest.prop.Tables.Table

class BasketTest extends VuuServerTestCase {

  Feature("Example Test Case") {

    Scenario("Check scenario") {

      implicit val clock: Clock = new TestFriendlyClock(10001L)
      implicit val lifecycle: LifecycleContainer = new LifecycleContainer()
      implicit val tableDefContainer: TableDefContainer = new TableDefContainer(Map())
      implicit val metricsProvider: MetricsProvider = new MetricsProviderImpl

      withVuuServer(PriceModule(), BasketModule()) {
        vuuServer =>

          vuuServer.overrideViewPortDef("prices", (table, _, _, _) => ViewPortDef(table.getTableDef.columns, null))

          val pricesProvider = vuuServer.getProvider("PRICE", "prices")

          pricesProvider.tick("VOD.L", Map("ric" -> "VOD.L", "phase" -> "C"))

          val viewport = vuuServer.createViewPort("PRICE", "prices")

          vuuServer.runOnce()

          assertVpEq(combineQs(viewport)) {
            Table(
              ("ric", "bid", "ask", "bidSize", "askSize", "last", "open", "close", "phase", "scenario"),
              ("VOD.L", null, null, null, null, null, null, null, "C", null)
            )
          }
      }
    }
  }

}
