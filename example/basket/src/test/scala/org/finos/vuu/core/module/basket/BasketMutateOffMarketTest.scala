package org.finos.vuu.core.module.basket

import org.finos.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.{Clock, TestFriendlyClock}
import org.finos.vuu.api.ViewPortDef
import org.finos.vuu.core.module.TableDefContainer
import org.finos.vuu.core.module.basket.BasketModule.{BasketColumnNames as B, BasketConstituentColumnNames as BC}
import org.finos.vuu.core.module.basket.service.BasketTradingServiceIF
import org.finos.vuu.core.module.price.PriceModule
import org.finos.vuu.net.rpc.{RpcFunctionSuccess, RpcParams}
import org.finos.vuu.order.oms.OmsApi
import org.finos.vuu.test.{TestVuuServer, VuuServerTestCase}
import org.finos.vuu.util.table.TableAsserts.assertVpEq
import org.scalatest.prop.Tables.Table

class BasketMutateOffMarketTest extends VuuServerTestCase {

  Feature("Basket Service Test Case") {
    Scenario("Check the creation of the baskets and constituents") {
      import BasketModule.*
      import BasketTestCaseHelper.*
      implicit val clock: Clock = new TestFriendlyClock(10001L)
      implicit val lifecycle: LifecycleContainer = new LifecycleContainer()
      implicit val tableDefContainer: TableDefContainer = new TableDefContainer(Map())
      implicit val metricsProvider: MetricsProvider = new MetricsProviderImpl
      val omsApi = OmsApi()
      withVuuServer(PriceModule(), BasketModule(omsApi)) {
        vuuServer =>

          vuuServer.login("testUser")

          vuuServer.overrideViewPortDef("prices", (table, _, _, _) => ViewPortDef(table.getTableDef.getColumns, null))

          val pricesProvider = vuuServer.getProvider(PriceModule.NAME, "prices")
          val basketProvider = vuuServer.getProvider(BasketModule.NAME, BasketTable)
          val constituentProvider = vuuServer.getProvider(BasketModule.NAME, BasketConstituentTable)

          tickPrices(pricesProvider)
          tickBasketDef(basketProvider)
          tickConstituentsDef(constituentProvider)

          val vpBasket = vuuServer.createViewPort(BasketModule.NAME, BasketTable)

          vuuServer.runOnce()

          When("we have 2 basket definitions")
          assertVpEq(combineQsForVp(vpBasket)) {
            Table(
              ("id", "name", "notionalValue", "notionalValueUsd"),
              (".FTSE", ".FTSE 100", 1000001, 1500001),
              (".NASDAQ", ".NASDAQ", 3000001, 3500001)
            )
          }

          val vpConstituent = vuuServer.createViewPort(BasketModule.NAME, BasketConstituentTable)

          vuuServer.runOnce()

          And(".FTSE is composed of 3 constituents")
          assertVpEq(combineQsForVp(vpConstituent)) {
            Table(
              ("ricBasketId", "ric", "basketId", "weighting", "lastTrade", "change", "volume", "description", "side"),
              ("BP.L.FTSE", "BP.L", ".FTSE", 0.1, null, null, null, "Beyond Petroleum", "BUY"),
              ("BT.L.FTSE", "BT.L", ".FTSE", 0.1, null, null, null, "British Telecom", "SELL"),
              ("VOD.L.FTSE", "VOD.L", ".FTSE", 0.1, null, null, null, "Vodafone", "BUY")
            )
          }

          Then("Get the Basket RPC Service and call create basket")
          val basketService = vpBasket.getStructure.viewPortDef.service
          val rpcResult = basketService.processRpcRequest("createBasket", new RpcParams(Map("sourceBasketId" -> ".FTSE", "basketTradeName" -> "MyCustomBasket"), vpBasket, vuuServer.requestContext))
          assert(rpcResult.isInstanceOf[RpcFunctionSuccess])
          val basketTradeInstanceId = rpcResult.asInstanceOf[RpcFunctionSuccess].optionalResult.get.asInstanceOf[String]

          val vpBasketTrading = vuuServer.createViewPort(BasketModule.NAME, BasketTradingTable)

          vuuServer.runOnce()

          And("Check the basket trading record has been created")
          //BT.InstanceId.string(), BT.BasketId.string(), BT.BasketName.string(), BT.Status.string(), BT.Units.int(), BT.FilledPct.double(), BT.FxRateToUsd.double(), BT.TotalNotional.double(), BT.TotalNotionalUsd.double(), BT.Side.string()
          assertVpEq(combineQsForVp(vpBasketTrading)) {
            Table(
              ("instanceId", "basketId", "basketName", "status", "units", "filledPct", "fxRateToUsd", "totalNotional", "totalNotionalUsd", "side"),
              (basketTradeInstanceId, ".FTSE", "MyCustomBasket", "OFF-MARKET", 1, null, null, null, null, "BUY")
            )
          }

          val vpBasketTradingCons = vuuServer.createViewPort(BasketModule.NAME, BasketTradingConstituentTable)

          vuuServer.runOnce()

          assertVpEq(combineQsForVp(vpBasketTradingCons)) {
            Table(
              ("quantity", "side", "instanceId", "instanceIdRic", "basketId", "ric", "description", "notionalUsd", "notionalLocal", "venue", "algo", "algoParams", "pctFilled", "weighting", "priceSpread", "limitPrice", "priceStrategyId", "filledQty", "orderStatus"),
              (10L, "BUY", basketTradeInstanceId, s"$basketTradeInstanceId.BP.L", ".FTSE", "BP.L", "Beyond Petroleum", null, null, null, -1, null, null, 0.1, null, 301.5, 2, 0, "PENDING"),
              (10L, "SELL", basketTradeInstanceId, s"$basketTradeInstanceId.BT.L", ".FTSE", "BT.L", "British Telecom", null, null, null, -1, null, null, 0.1, null, 201.5, 2, 0, "PENDING"),
              (10L, "BUY", basketTradeInstanceId, s"$basketTradeInstanceId.VOD.L", ".FTSE", "VOD.L", "Vodafone", null, null, null, -1, null, null, 0.1, null, 101.5, 2, 0, "PENDING")
            )
          }

          val basketTradingService = vuuServer.getViewPortRpcServiceProxy[BasketTradingServiceIF](vpBasketTrading)

          When("we edit the side of the parent basket")
          basketTradingService.editCellAction().func(basketTradeInstanceId, "side", "SELL", vpBasketTrading, vuuServer.session)

          Then("get all the updates that have occurred for all view ports from the outbound queue")
          val updates = combineQs(vpBasketTrading)

          And("assert the basket trading table has flipped side....")
          assertVpEq(filterByVp(vpBasketTrading, updates)) {
            Table(
              ("instanceId", "basketId", "basketName", "status", "units", "filledPct", "fxRateToUsd", "totalNotional", "totalNotionalUsd", "side"),
              (basketTradeInstanceId, ".FTSE", "MyCustomBasket", "OFF-MARKET", 1, null, null, null, null, "SELL")
            )
          }

          //vuuServer.runOnce()
          And("assert the basket trading constituent table has flipped sides also")
          assertVpEq(filterByVp(vpBasketTradingCons, updates)) {
            Table(
              ("quantity", "side", "instanceId", "instanceIdRic", "basketId", "ric", "description", "notionalUsd", "notionalLocal", "venue", "algo", "algoParams", "pctFilled", "weighting", "priceSpread", "limitPrice", "priceStrategyId", "filledQty", "orderStatus"),
              (10L, "SELL", basketTradeInstanceId, s"$basketTradeInstanceId.BP.L", ".FTSE", "BP.L", "Beyond Petroleum", null, null, null, -1, null, null, 0.1, null, 301.5, 2, 0, "PENDING"),
              (10L, "BUY", basketTradeInstanceId, s"$basketTradeInstanceId.BT.L", ".FTSE", "BT.L", "British Telecom", null, null, null, -1, null, null, 0.1, null, 201.5, 2, 0, "PENDING"),
              (10L, "SELL", basketTradeInstanceId, s"$basketTradeInstanceId.VOD.L", ".FTSE", "VOD.L", "Vodafone", null, null, null, -1, null, null, 0.1, null, 101.5, 2, 0, "PENDING")
            )
          }

          When("we edit the units of the parent basket")
          basketTradingService.editCellAction().func(basketTradeInstanceId, "units", 1000L.asInstanceOf[Object], vpBasketTrading, vuuServer.session)

          And("assert the basket trading constituent table has increased the units")
          assertVpEq(filterByVp(vpBasketTradingCons, combineQs(vpBasketTrading))) {
            Table(
              ("quantity", "side", "instanceId", "instanceIdRic", "basketId", "ric", "description", "notionalUsd", "notionalLocal", "venue", "algo", "algoParams", "pctFilled", "weighting", "priceSpread", "limitPrice", "priceStrategyId", "filledQty", "orderStatus"),
              (100L, "SELL", basketTradeInstanceId, s"$basketTradeInstanceId.BP.L", ".FTSE", "BP.L", "Beyond Petroleum", null, null, null, -1, null, null, 0.1, null, 301.5, 2, 0, "PENDING"),
              (100L, "BUY", basketTradeInstanceId, s"$basketTradeInstanceId.BT.L", ".FTSE", "BT.L", "British Telecom", null, null, null, -1, null, null, 0.1, null, 201.5, 2, 0, "PENDING"),
              (100L, "SELL", basketTradeInstanceId, s"$basketTradeInstanceId.VOD.L", ".FTSE", "VOD.L", "Vodafone", null, null, null, -1, null, null, 0.1, null, 101.5, 2, 0, "PENDING")
            )
          }
      }
    }

    Scenario("Check updating trade basket side with no change does not update constituents side") {
      import BasketModule.*
      implicit val clock: Clock = new TestFriendlyClock(10001L)
      implicit val lifecycle: LifecycleContainer = new LifecycleContainer()
      implicit val tableDefContainer: TableDefContainer = new TableDefContainer(Map())
      implicit val metricsProvider: MetricsProvider = new MetricsProviderImpl

      val omsApi = OmsApi()
      withVuuServer(PriceModule(), BasketModule(omsApi)) {
        vuuServer =>

          vuuServer.login("testUser")

          val basketTradeInstanceId = GivenBasketTradeExist(vuuServer, ".FTSE", "MyCustomBasket")

          val vpBasketTrading = vuuServer.createViewPort(BasketModule.NAME, BasketTradingTable)
          val vpBasketTradingCons = vuuServer.createViewPort(BasketModule.NAME, BasketTradingConstituentTable)
          val basketTradingService = vuuServer.getViewPortRpcServiceProxy[BasketTradingServiceIF](vpBasketTrading)

          When("we edit the side of the parent basket to same side as current value")
          basketTradingService.editCellAction().func(basketTradeInstanceId, "side", "BUY", vpBasketTrading, vuuServer.session)
          vuuServer.runOnce()

          Then("get all the updates that have occurred for all view ports from the outbound queue")
          val updates2 = combineQs(vpBasketTrading)

          And("assert the basket trading table has not changed side....")
          assertVpEq(filterByVp(vpBasketTrading, updates2)) {
            Table(
              ("instanceId", "basketId", "basketName", "status", "units", "filledPct", "fxRateToUsd", "totalNotional", "totalNotionalUsd", "side"),
              (basketTradeInstanceId, ".FTSE", "MyCustomBasket", "OFF-MARKET", 1, null, null, null, null, "BUY")
            )
          }

          And("assert the basket trading constituent table has not changed sides")
          assertVpEq(filterByVp(vpBasketTradingCons, updates2)) {
            Table(
              ("quantity", "side", "instanceId", "instanceIdRic", "basketId", "ric", "description", "notionalUsd", "notionalLocal", "venue", "algo", "algoParams", "pctFilled", "weighting", "priceSpread", "limitPrice", "priceStrategyId", "filledQty", "orderStatus"),
              (10L, "BUY", basketTradeInstanceId, s"$basketTradeInstanceId.BP.L", ".FTSE", "BP.L", "Beyond Petroleum", null, null, null, -1, null, null, 0.1, null, null, 2, 0, "PENDING"),
              (10L, "SELL", basketTradeInstanceId, s"$basketTradeInstanceId.BT.L", ".FTSE", "BT.L", "British Telecom", null, null, null, -1, null, null, 0.1, null, null, 2, 0, "PENDING"),
              (10L, "BUY", basketTradeInstanceId, s"$basketTradeInstanceId.VOD.L", ".FTSE", "VOD.L", "Vodafone", null, null, null, -1, null, null, 0.1, null, null, 2, 0, "PENDING")
            )
          }
      }
    }

    //TODO join table cannot be tested currently as it doesnt get updated when underlying table gets updated
    ignore("Adding new constituents by ric should add it to basket trading") {
      import BasketModule.*
      implicit val clock: Clock = new TestFriendlyClock(10001L)
      implicit val lifecycle: LifecycleContainer = new LifecycleContainer()
      implicit val tableDefContainer: TableDefContainer = new TableDefContainer(Map())
      implicit val metricsProvider: MetricsProvider = new MetricsProviderImpl

      val omsApi = OmsApi()
      withVuuServer(PriceModule(), BasketModule(omsApi)) {
        vuuServer =>

          vuuServer.login("testUser")

          val basketTradeInstanceId = GivenBasketTradeExist(vuuServer, ".FTSE", "MyCustomBasket")

          val vpBasketTradingCons = vuuServer.createViewPort(BasketModule.NAME, BasketTradingConstituentTable)
          val vpBasketTradingConsJoin = vuuServer.createViewPort(BasketModule.NAME, BasketTradingConstituentJoin)
          val basketTradingConstituentJoinService = vpBasketTradingConsJoin.getStructure.viewPortDef.service

          vuuServer.runOnce()

          When("we edit the side of the parent basket to same side as current value")
          basketTradingConstituentJoinService.processRpcRequest("addConstituent", new RpcParams(Map("ric" -> "0001.HK"), vpBasketTradingConsJoin, vuuServer.requestContext))
          vuuServer.runOnce()

          Then("get all the updates that have occurred for all view ports from the outbound queue")
          val updates = combineQs(vpBasketTradingConsJoin)

          //todo should basketid be where the stock was sourced from? in this case .HSI?

          And("assert the basket trading constituent table has added row")
          assertVpEq(filterByVp(vpBasketTradingCons, updates)) {
            Table(
              ("quantity", "side", "instanceId", "instanceIdRic", "basketId", "ric", "description", "notionalUsd", "notionalLocal", "venue", "algo", "algoParams", "pctFilled", "weighting", "priceSpread", "limitPrice", "priceStrategyId", "filledQty", "orderStatus"),
              (10L, "BUY", basketTradeInstanceId, s"$basketTradeInstanceId.BP.L", ".FTSE", "BP.L", "Beyond Petroleum", null, null, null, -1, null, null, 0.1, null, null, 2, 0, "PENDING"),
              (10L, "SELL", basketTradeInstanceId, s"$basketTradeInstanceId.BT.L", ".FTSE", "BT.L", "British Telecom", null, null, null, -1, null, null, 0.1, null, null, 2, 0, "PENDING"),
              (10L, "BUY", basketTradeInstanceId, s"$basketTradeInstanceId.VOD.L", ".FTSE", "VOD.L", "Vodafone", null, null, null, -1, null, null, 0.1, null, null, 2, 0, "PENDING"),
              (10L, "BUY", basketTradeInstanceId, s"$basketTradeInstanceId.0001.HK", ".FTSE", "0001.HK", "", null, null, null, -1, null, null, 0.1, null, null, 2, 0, "PENDING")
            )
          }
      }
    }
  }

  def GivenBasketTradeExist(vuuServer: TestVuuServer, basketId: String, basketTradeName: String): String = {
    val basketProvider = vuuServer.getProvider(BasketModule.NAME, BasketModule.BasketTable)
    basketProvider.tick(basketId, Map(B.Id -> basketId, B.Name -> ".FTSE 100", B.NotionalValue -> 1000001, B.NotionalValueUsd -> 1500001))

    val constituentProvider = vuuServer.getProvider(BasketModule.NAME, BasketModule.BasketConstituentTable)
    constituentProvider.tick(s"VOD.L.$basketId", Map(BC.RicBasketId -> s"VOD.L.$basketId", BC.Ric -> "VOD.L", BC.BasketId -> basketId, BC.Weighting -> 0.1, BC.Side -> "BUY", BC.Description -> "Vodafone"))
    constituentProvider.tick(s"BT.L.$basketId", Map(BC.RicBasketId -> s"BT.L.$basketId", BC.Ric -> "BT.L", BC.BasketId -> basketId, BC.Weighting -> 0.1, BC.Side -> "SELL", BC.Description -> "British Telecom"))
    constituentProvider.tick(s"BP.L.$basketId", Map(BC.RicBasketId -> s"BP.L.$basketId", BC.Ric -> "BP.L", BC.BasketId -> basketId, BC.Weighting -> 0.1, BC.Side -> "BUY", BC.Description -> "Beyond Petroleum"))

    val vpBasket = vuuServer.createViewPort(BasketModule.NAME, BasketModule.BasketTable)
    val basketService = vpBasket.getStructure.viewPortDef.service
    val rpcResult = basketService.processRpcRequest("createBasket", new RpcParams(Map("sourceBasketId" -> basketId, "basketTradeName" -> basketTradeName), vpBasket, vuuServer.requestContext))
    assert(rpcResult.isInstanceOf[RpcFunctionSuccess])
    rpcResult.asInstanceOf[RpcFunctionSuccess].optionalResult.get.asInstanceOf[String]
  }
}