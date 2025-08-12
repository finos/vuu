package org.finos.vuu.core.module.basket

import org.finos.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.{Clock, TestFriendlyClock}
import org.finos.vuu.api.ViewPortDef
import org.finos.vuu.core.module.TableDefContainer
import org.finos.vuu.core.module.basket.BasketTestCaseHelper.{tickBasketDef, tickConstituentsDef, tickPrices}
import org.finos.vuu.core.module.price.PriceModule
import org.finos.vuu.net.rpc.{RpcFunctionSuccess, RpcParams}
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
          val basketService = vpBasket.getStructure.viewPortDef.service

          val rpcResult = basketService.processRpcRequest("createBasket", new RpcParams(null, Map("sourceBasketId" -> ".FTSE", "basketTradeName" -> "TestBasket"), None, None, vuuServer.requestContext))
          assert(rpcResult.isInstanceOf[RpcFunctionSuccess])
          val basketTradeInstanceId = rpcResult.asInstanceOf[RpcFunctionSuccess].optionalResult.get.asInstanceOf[String]

          val vpBasketTrading = vuuServer.createViewPort(BasketModule.NAME, BasketTradingTable)
          val vpBasketTradingCons = vuuServer.createViewPort(BasketModule.NAME, BasketTradingConstituentTable)

          vuuServer.runOnce()

          And("Check the trading constituents are created")
          assertVpEq(combineQsForVp(vpBasketTradingCons)) {
            Table(
              ("quantity", "side", "instanceId", "instanceIdRic", "basketId", "ric", "description", "notionalUsd", "notionalLocal", "venue", "algo", "algoParams", "pctFilled", "weighting", "priceSpread", "limitPrice", "priceStrategyId", "filledQty", "orderStatus"),
              (10L, "BUY", basketTradeInstanceId, s"$basketTradeInstanceId.BP.L", ".FTSE", "BP.L", "Beyond Petroleum", null, null, null, -1, null, null, 0.1, null, 301.5, 2, 0, "PENDING"),
              (10L, "SELL", basketTradeInstanceId, s"$basketTradeInstanceId.BT.L", ".FTSE", "BT.L", "British Telecom", null, null, null, -1, null, null, 0.1, null, 201.5, 2, 0, "PENDING"),
              (10L, "BUY", basketTradeInstanceId, s"$basketTradeInstanceId.VOD.L", ".FTSE", "VOD.L", "Vodafone", null, null, null, -1, null, null, 0.1, null, 101.5, 2, 0, "PENDING")
            )
          }

          val tradingService = vpBasketTrading.getStructure.viewPortDef.service
          And("send the basket to market")
          tradingService.processRpcRequest("sendToMarket", new RpcParams(null, Map("basketInstanceId"-> basketTradeInstanceId), None, None, vuuServer.requestContext))

          vuuServer.runOnce()

          Then("verify basket is on market")
          assertVpEq(combineQsForVp(vpBasketTrading)) {
            Table(
              ("instanceId", "basketId", "basketName", "status", "units", "filledPct", "fxRateToUsd", "totalNotional", "totalNotionalUsd", "side"),
              (basketTradeInstanceId, ".FTSE", "TestBasket", "ON_MARKET", 1, null, null, null, null, "BUY")
            )
          }

          Then("Take the basket off the market")
          tradingService.processRpcRequest("takeOffMarket", new RpcParams(null, Map("basketInstanceId"-> basketTradeInstanceId), None, None, vuuServer.requestContext))

          vuuServer.runOnce()

          And("verify basket is on market")
          assertVpEq(combineQsForVp(vpBasketTrading)) {
            Table(
              ("instanceId", "basketId", "basketName", "status", "units", "filledPct", "fxRateToUsd", "totalNotional", "totalNotionalUsd", "side"),
              (basketTradeInstanceId, ".FTSE", "TestBasket", "OFF_MARKET", 1, null, null, null, null, "BUY")
            )
          }
      }
    }
  }
}