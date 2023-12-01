package org.finos.vuu.core.module.basket

import org.finos.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.{Clock, TestFriendlyClock}
import org.finos.vuu.api.ViewPortDef
import org.finos.vuu.core.module.TableDefContainer
import org.finos.vuu.core.module.basket.BasketTestCaseHelper.{tickBasketDef, tickConstituentsDef, tickPrices}
import org.finos.vuu.core.module.basket.service.{BasketServiceIF, BasketTradeId, BasketTradingServiceIF}
import org.finos.vuu.core.module.price.PriceModule
import org.finos.vuu.order.oms.OmsApi
import org.finos.vuu.test.VuuServerTestCase
import org.finos.vuu.util.table.TableAsserts.assertVpEq
import org.scalatest.prop.Tables.Table

class BasketSendToMarketTest extends VuuServerTestCase {

  Feature("Basket Service Test Case") {

    Scenario("Check the creation of the baskets and constituents") {

      implicit val clock: Clock = new TestFriendlyClock(10001L)
      implicit val lifecycle: LifecycleContainer = new LifecycleContainer()
      implicit val tableDefContainer: TableDefContainer = new TableDefContainer(Map())
      implicit val metricsProvider: MetricsProvider = new MetricsProviderImpl

      val omsApi = OmsApi()

      import BasketModule._

      withVuuServer(PriceModule(), BasketModule(omsApi)) {
        vuuServer =>

          vuuServer.login("testUser", "testToken")

          vuuServer.overrideViewPortDef("prices", (table, _, _, _) => ViewPortDef(table.getTableDef.columns, null))

          val pricesProvider = vuuServer.getProvider(PriceModule.NAME, "prices")
          val basketProvider = vuuServer.getProvider(BasketModule.NAME, BasketTable)
          val constituentProvider = vuuServer.getProvider(BasketModule.NAME, BasketConstituentTable)

          tickPrices(pricesProvider)
          tickBasketDef(basketProvider)
          tickConstituentsDef(constituentProvider)

          val vpBasket = vuuServer.createViewPort(BasketModule.NAME, BasketTable)

          vuuServer.runOnce()

          Then("Get the Basket RPC Service and call create basket")
          val basketService = vuuServer.getViewPortRpcServiceProxy[BasketServiceIF](vpBasket)

          basketService.createBasket(".FTSE", "TestBasket")(vuuServer.requestContext)
          val basketTradeInstanceId = BasketTradeId.current

          val vpBasketTrading = vuuServer.createViewPort(BasketModule.NAME, BasketTradingTable)

          vuuServer.runOnce()

          val tradingService = vuuServer.getViewPortRpcServiceProxy[BasketTradingServiceIF](vpBasketTrading)

          And("send the basket to market")
          tradingService.sendToMarket(basketTradeInstanceId)(vuuServer.requestContext)

          vuuServer.runOnce()

          Then("verify basket is on market")
          assertVpEq(combineQsForVp(vpBasketTrading)) {
            Table(
              ("instanceId", "basketId", "basketName", "status", "units", "filledPct", "fxRateToUsd", "totalNotional", "totalNotionalUsd", "side"),
              (basketTradeInstanceId, ".FTSE", "TestBasket", "ON_MARKET", 1, null, null, null, null, "Buy")
            )
          }
      }
    }
  }
}