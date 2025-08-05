package org.finos.vuu.core.module.basket

import org.finos.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.{Clock, TestFriendlyClock}
import org.finos.vuu.api.ViewPortDef
import org.finos.vuu.core.module.TableDefContainer
import org.finos.vuu.core.module.basket.BasketModule.{BasketColumnNames => B, BasketConstituentColumnNames => BC}
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
          val basketId = ".FTSE"

          vuuServer.overrideViewPortDef("prices", (table, _, _, _) => ViewPortDef(table.getTableDef.columns, null))

          val pricesProvider = vuuServer.getProvider(PriceModule.NAME, PriceModule.PriceTable)
          val basketProvider = vuuServer.getProvider(BasketModule.NAME, BasketModule.BasketTable)
          val constituentProvider = vuuServer.getProvider(BasketModule.NAME, BasketModule.BasketConstituentTable)

          basketProvider.tick(basketId, Map(B.Id -> basketId, B.Name -> ".FTSE 100", B.NotionalValue -> 1000001, B.NotionalValueUsd -> 1500001))

          //given constituent with price
          constituentProvider.tick(s"VOD.L.$basketId", Map(BC.RicBasketId -> s"VOD.L.$basketId", BC.Ric -> "VOD.L", BC.BasketId -> basketId, BC.Weighting -> 0.1, BC.Side -> "BUY", BC.Description -> "Vodafone"))
          pricesProvider.tick("VOD.L", Map("ric" -> "VOD.L", "bid" -> 1.3, "ask" -> 1.6, "last" -> 1.5, "phase" -> "C"))

          //given constituent with no price
          constituentProvider.tick(s"BT.L.$basketId", Map(BC.RicBasketId -> s"BT.L.$basketId", BC.Ric -> "BT.L", BC.BasketId -> basketId, BC.Weighting -> 0.1, BC.Side -> "SELL", BC.Description -> "British Telecom"))

          //given constituent with price but missing last price
          constituentProvider.tick(s"BP.L.$basketId", Map(BC.RicBasketId -> s"BP.L.$basketId", BC.Ric -> "BP.L", BC.BasketId -> basketId, BC.Weighting -> 0.1, BC.Side -> "BUY", BC.Description -> "Beyond Petroleum"))
          pricesProvider.tick("BP.L", Map("ric" -> "BP.L", "bid" -> 5.3, "phase" -> "C"))

          val viewportPrices = vuuServer.createViewPort(PriceModule.NAME, "prices")

          vuuServer.runOnce()

          assertVpEq(combineQsForVp(viewportPrices)) {
            Table(
              ("ric", "bid", "ask", "bidSize", "askSize", "last", "open", "close", "phase", "scenario"),
              ("BP.L", 5.3, null, null, null, null, null, null, "C", null),
              ("VOD.L", 1.3, 1.6, null, null, 1.5, null, null, "C", null),
            )
          }

          val viewportBasket = vuuServer.createViewPort(BasketModule.NAME, BasketTable)

          val basketService = vuuServer.getViewPortRpcServiceProxy[BasketServiceIF](viewportBasket)

          val vpAction = basketService.createBasket(basketId, "TestBasket")(vuuServer.requestContext)
          vuuServer.runOnce()
          assert(vpAction.isInstanceOf[ViewPortCreateSuccess])
          val basketTradeInstanceId = vpAction.asInstanceOf[ViewPortCreateSuccess].key

          val viewportBasketTrading = vuuServer.createViewPort(BasketModule.NAME, BasketTradingTable)
          val viewportBasketTradingCons = vuuServer.createViewPort(BasketModule.NAME, BasketTradingConstituentTable)

          val basketTradingService = vuuServer.getViewPortRpcServiceProxy[BasketTradingServiceIF](viewportBasketTrading)

          //CJS: I don't like this forced cast, need to look at that a bit
          basketTradingService.editCellAction().func(basketTradeInstanceId, BT.Units, 100.asInstanceOf[Object], viewportBasketTrading, vuuServer.session)

          vuuServer.runOnce()
          Then("get all the updates that have occurred for all view ports from the outbound queue")
          val updates = combineQs(viewportBasketTrading)

          assertVpEq(filterByVp(viewportBasketTrading, updates)) {
            Table(
              ("instanceId", "basketId", "basketName", "units", "status", "filledPct", "totalNotionalUsd", "totalNotional", "fxRateToUsd", "side"),
              (basketTradeInstanceId, ".FTSE", "TestBasket", 100, "OFF-MARKET", null, null, null, null, "BUY")
            )
          }

          assertVpEq(filterByVp(viewportBasketTradingCons, updates)) {
            Table(
              ("quantity", "side", "instanceId", "instanceIdRic", "basketId", "ric", "description", "notionalUsd", "notionalLocal", "venue", "algo", "algoParams", "pctFilled", "weighting", "priceSpread", "limitPrice", "priceStrategyId", "filledQty", "orderStatus"),
              (10L, "BUY", basketTradeInstanceId, s"$basketTradeInstanceId.BP.L", ".FTSE", "BP.L", "Beyond Petroleum", null, null, null, -1, null, null, 0.1, null, null, 2, 0, "PENDING"),
              (10L, "SELL", basketTradeInstanceId, s"$basketTradeInstanceId.BT.L", ".FTSE", "BT.L", "British Telecom", null, null, null, -1, null, null, 0.1, null, null, 2, 0, "PENDING"),
              (10L, "BUY", basketTradeInstanceId, s"$basketTradeInstanceId.VOD.L", ".FTSE", "VOD.L", "Vodafone", null, null, null, -1, null, null, 0.1, null, 1.5, 2, 0, "PENDING"),
            )
          }
      }
    }
  }

}
