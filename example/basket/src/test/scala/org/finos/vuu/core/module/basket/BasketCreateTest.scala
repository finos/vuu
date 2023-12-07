package org.finos.vuu.core.module.basket

import org.finos.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.{Clock, TestFriendlyClock}
import org.finos.vuu.api.ViewPortDef
import org.finos.vuu.core.module.TableDefContainer
import org.finos.vuu.core.module.basket.service.{BasketServiceIF, BasketTradeId, BasketTradingServiceIF}
import org.finos.vuu.core.module.price.PriceModule
import org.finos.vuu.order.oms.OmsApi
import org.finos.vuu.test.VuuServerTestCase
import org.finos.vuu.util.table.TableAsserts.assertVpEq
import org.finos.vuu.viewport.ViewPortCreateSuccess
import org.scalatest.prop.Tables.Table

class BasketCreateTest extends VuuServerTestCase {

  Feature("Basket Service Test Case") {

    Scenario("Check the creation of the baskets and constituents") {

      implicit val clock: Clock = new TestFriendlyClock(10001L)
      implicit val lifecycle: LifecycleContainer = new LifecycleContainer()
      implicit val tableDefContainer: TableDefContainer = new TableDefContainer(Map())
      implicit val metricsProvider: MetricsProvider = new MetricsProviderImpl

      val omsApi = OmsApi()

      import BasketModule.{BasketTradingColumnNames => BT, _}

      withVuuServer(PriceModule(), BasketModule(omsApi)) {
        vuuServer =>

          vuuServer.login("testUser", "testToken")

          vuuServer.overrideViewPortDef("prices", (table, _, _, _) => ViewPortDef(table.getTableDef.columns, null))

          val pricesProvider = vuuServer.getProvider(PriceModule.NAME, "prices")

          pricesProvider.tick("VOD.L", Map("ric" -> "VOD.L", "phase" -> "C"))

          val viewport = vuuServer.createViewPort(PriceModule.NAME, "prices")

          vuuServer.runOnce()

          assertVpEq(combineQsForVp(viewport)) {
            Table(
              ("ric", "bid", "ask", "bidSize", "askSize", "last", "open", "close", "phase", "scenario"),
              ("VOD.L", null, null, null, null, null, null, null, "C", null)
            )
          }

          val viewportBasket = vuuServer.createViewPort(BasketModule.NAME, BasketTable)

          val basketService = vuuServer.getViewPortRpcServiceProxy[BasketServiceIF](viewportBasket)

          val vpAction = basketService.createBasket(".FTSE", "TestBasket")(vuuServer.requestContext)

          assert(vpAction.isInstanceOf[ViewPortCreateSuccess])
          val basketTradeInstanceId = vpAction.asInstanceOf[ViewPortCreateSuccess].key

          val viewportBasketTrading = vuuServer.createViewPort(BasketModule.NAME, BasketTradingTable)

          val basketTradingService = vuuServer.getViewPortRpcServiceProxy[BasketTradingServiceIF](viewportBasketTrading)

          //CJS: I don't like this forced cast, need to look at that a bit
          basketTradingService.editCellAction().func(basketTradeInstanceId, BT.Units, 100.asInstanceOf[Object], viewportBasketTrading, vuuServer.session)

          vuuServer.runOnce()

          assertVpEq(combineQsForVp(viewportBasketTrading)) {
            Table(
              ("basketId", "instanceId", "basketName", "units", "status", "filledPct", "totalNotionalUsd", "totalNotional", "fxRateToUsd", "side"),
              (".FTSE", basketTradeInstanceId, "TestBasket", 100, "OFF-MARKET", null, null, null, null, "BUY")
            )
          }
      }
    }
  }

}
