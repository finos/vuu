package org.finos.vuu.core.module.basket

import org.finos.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.{Clock, TestFriendlyClock}
import org.finos.vuu.api.ViewPortDef
import org.finos.vuu.core.module.TableDefContainer
import org.finos.vuu.core.module.basket.service.{BasketServiceIF, BasketTradingServiceIF}
import org.finos.vuu.core.module.price.PriceModule
import org.finos.vuu.test.VuuServerTestCase
import org.finos.vuu.util.table.TableAsserts.assertVpEq
import org.scalatest.prop.Tables.Table

class BasketMutateOffMarketTest extends VuuServerTestCase {

  import BasketTestCaseHelper._

  Feature("Basket Service Test Case") {

    Scenario("Check the creation of the baskets and constituents") {

      implicit val clock: Clock = new TestFriendlyClock(10001L)
      implicit val lifecycle: LifecycleContainer = new LifecycleContainer()
      implicit val tableDefContainer: TableDefContainer = new TableDefContainer(Map())
      implicit val metricsProvider: MetricsProvider = new MetricsProviderImpl

      import BasketModule._

      withVuuServer(PriceModule(), BasketModule()) {
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
              ("BP.L.FTSE", "BP.L", ".FTSE", 0.1, null, null, null, "Beyond Petroleum", "Buy"),
              ("BT.L.FTSE", "BT.L", ".FTSE", 0.1, null, null, null, "British Telecom", "Sell"),
              ("VOD.L.FTSE", "VOD.L", ".FTSE", 0.1, null, null, null, "Vodafone", "Buy")
            )
          }

          Then("Get the Basket RPC Service and call create basket")
          val basketService = vuuServer.getViewPortRpcServiceProxy[BasketServiceIF](vpBasket)
          basketService.createBasket(".FTSE", "chris-001")(vuuServer.requestContext)

          val vpBasketTrading = vuuServer.createViewPort(BasketModule.NAME, BasketTradingTable)

          vuuServer.runOnce()

          And("Check the basket trading record has been created")
          //BT.InstanceId.string(), BT.BasketId.string(), BT.BasketName.string(), BT.Status.string(), BT.Units.int(), BT.FilledPct.double(), BT.FxRateToUsd.double(), BT.TotalNotional.double(), BT.TotalNotionalUsd.double(), BT.Side.string()
          assertVpEq(combineQsForVp(vpBasketTrading)) {
            Table(
              ("instanceId", "basketId", "basketName", "status", "units", "filledPct", "fxRateToUsd", "totalNotional", "totalNotionalUsd", "side"),
              ("chris-001", ".FTSE", "chris-001", "OFF-MARKET", 1, null, null, null, null, "Buy")
            )
          }

          val vpBasketTradingCons = vuuServer.createViewPort(BasketModule.NAME, BasketTradingConstituentTable)

          vuuServer.runOnce()

          assertVpEq(combineQsForVp(vpBasketTradingCons)) {
            Table(
              ("quantity", "side", "instanceId", "instanceIdRic", "basketId", "ric", "description", "notionalUsd", "notionalLocal", "venue", "algo", "algoParams", "pctFilled", "weighting", "priceSpread", "limitPrice", "priceStrategyId"),
              (10L, "Buy", "chris-001", "chris-001.BP.L", ".FTSE", "BP.L", "Beyond Petroleum", null, null, null, -1, null, null, 0.1, null, null, 2),
              (10L, "Sell", "chris-001", "chris-001.BT.L", ".FTSE", "BT.L", "British Telecom", null, null, null, -1, null, null, 0.1, null, null, 2),
              (10L, "Buy", "chris-001", "chris-001.VOD.L", ".FTSE", "VOD.L", "Vodafone", null, null, null, -1, null, null, 0.1, null, null, 2)
            )
          }

          val basketTradingService = vuuServer.getViewPortRpcServiceProxy[BasketTradingServiceIF](vpBasketTrading)

          When("we edit the side of the parent basket")
          basketTradingService.editCellAction().func("chris-001", "side", "Sell", vpBasketTrading, vuuServer.session)

          Then("get all the updates that have occurred for all view ports from the outbound queue")
          val updates = combineQs(vpBasketTrading)

          And("assert the basket trading table has flipped side....")
          assertVpEq(filterByVp(vpBasketTrading, updates)) {
            Table(
              ("instanceId", "basketId", "basketName", "status", "units", "filledPct", "fxRateToUsd", "totalNotional", "totalNotionalUsd", "side"),
              ("chris-001", ".FTSE", "chris-001", "OFF-MARKET", 1, null, null, null, null, "Sell")
            )
          }

          //vuuServer.runOnce()
          And("assert the basket trading constituent table has flipped sides also")
          assertVpEq(filterByVp(vpBasketTradingCons,updates)) {
            Table(
              ("quantity", "side", "instanceId", "instanceIdRic", "basketId", "ric", "description", "notionalUsd", "notionalLocal", "venue", "algo", "algoParams", "pctFilled", "weighting", "priceSpread", "limitPrice", "priceStrategyId"),
              (10L, "Sell", "chris-001", "chris-001.BP.L", ".FTSE", "BP.L", "Beyond Petroleum", null, null, null, -1, null, null, 0.1, null, null, 2),
              (10L, "Buy", "chris-001", "chris-001.BT.L", ".FTSE", "BT.L", "British Telecom", null, null, null, -1, null, null, 0.1, null, null, 2),
              (10L, "Sell", "chris-001", "chris-001.VOD.L", ".FTSE", "VOD.L", "Vodafone", null, null, null, -1, null, null, 0.1, null, null, 2)
            )
          }

          When("we edit the units of the parent basket")
          basketTradingService.editCellAction().func("chris-001", "units", 1000L.asInstanceOf[Object], vpBasketTrading, vuuServer.session)

          And("assert the basket trading constituent table has increased the units")
          assertVpEq(filterByVp(vpBasketTradingCons, combineQs(vpBasketTrading))) {
            Table(
              ("quantity", "side", "instanceId", "instanceIdRic", "basketId", "ric", "description", "notionalUsd", "notionalLocal", "venue", "algo", "algoParams", "pctFilled", "weighting", "priceSpread", "limitPrice", "priceStrategyId"),
              (100L, "Sell", "chris-001", "chris-001.BP.L", ".FTSE", "BP.L", "Beyond Petroleum", null, null, null, -1, null, null, 0.1, null, null, 2),
              (100L, "Buy", "chris-001", "chris-001.BT.L", ".FTSE", "BT.L", "British Telecom", null, null, null, -1, null, null, 0.1, null, null, 2),
              (100L, "Sell", "chris-001", "chris-001.VOD.L", ".FTSE", "VOD.L", "Vodafone", null, null, null, -1, null, null, 0.1, null, null, 2)
            )
          }
      }
    }
  }
}