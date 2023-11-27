package org.finos.vuu.core.module.basket

import org.finos.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.{Clock, TestFriendlyClock}
import org.finos.vuu.api.{JoinTableDef, ViewPortDef}
import org.finos.vuu.core.module.TableDefContainer
import org.finos.vuu.core.module.basket.BasketModule.{BasketColumnNames => B, BasketConstituentColumnNames => BC}
import org.finos.vuu.core.module.basket.TestHelper.TestDataFactory
import org.finos.vuu.core.module.basket.service.{BasketServiceIF, BasketTradingConstituentJoinServiceIF, BasketTradingServiceIF}
import org.finos.vuu.core.module.price.PriceModule
import org.finos.vuu.order.oms.OmsApi
import org.finos.vuu.core.table.{DataTable, JoinTable, RowWithData, TableContainer}
import org.finos.vuu.test.{TestVuuServer, VuuServerTestCase}
import org.finos.vuu.util.table.TableAsserts.assertVpEq
import org.finos.vuu.viewport.ViewPortSelection
import org.scalatest.prop.Tables.Table

class BasketMutateOffMarketTest extends VuuServerTestCase {

  import BasketTestCaseHelper._
  import BasketModule._

  implicit val clock: Clock = new TestFriendlyClock(10001L)
  implicit val lifecycle: LifecycleContainer = new LifecycleContainer()
  implicit val tableDefContainer: TableDefContainer = new TableDefContainer(Map())
  implicit val metricsProvider: MetricsProvider = new MetricsProviderImpl

  Feature("Basket Service Test Case") {
    val omsApi = OmsApi()

    Scenario("Check updating trade basket side with no change does not update constituents side") {
      withVuuServer(PriceModule(), BasketModule(omsApi)) {
        vuuServer =>

          vuuServer.login("testUser", "testToken")

          GivenBasketTradeExist(vuuServer, ".FTSE", "chris-001")

          val vpBasketTrading = vuuServer.createViewPort(BasketModule.NAME, BasketTradingTable)
          val vpBasketTradingCons = vuuServer.createViewPort(BasketModule.NAME, BasketTradingConstituentTable)
          val basketTradingService = vuuServer.getViewPortRpcServiceProxy[BasketTradingServiceIF](vpBasketTrading)

          When("we edit the side of the parent basket to same side as current value")
          basketTradingService.editCellAction().func("chris-001", "side", "Buy", vpBasketTrading, vuuServer.session)
          vuuServer.runOnce()

          Then("get all the updates that have occurred for all view ports from the outbound queue")
          val updates = combineQs(vpBasketTrading)

          And("assert the basket trading table has not changed side....")
          assertVpEq(filterByVp(vpBasketTrading, updates)) {
            Table(
              ("instanceId", "basketId", "basketName", "status", "units", "filledPct", "fxRateToUsd", "totalNotional", "totalNotionalUsd", "side"),
              ("chris-001", ".FTSE", "chris-001", "OFF-MARKET", 1, null, null, null, null, "Buy")
            )
          }

          And("assert the basket trading constituent table has not changed sides")
          assertVpEq(filterByVp(vpBasketTradingCons, updates)) {
            Table(
              ("quantity", "side", "instanceId", "instanceIdRic", "basketId", "ric", "description", "notionalUsd", "notionalLocal", "venue", "algo", "algoParams", "pctFilled", "weighting", "priceSpread", "limitPrice", "priceStrategyId", "filledQty", "orderStatus"),
              (10L, "Buy", "chris-001", "chris-001.BP.L", ".FTSE", "BP.L", "Beyond Petroleum", null, null, null, -1, null, null, 0.1, null, null, 2, 0, "PENDING"),
              (10L, "Sell", "chris-001", "chris-001.BT.L", ".FTSE", "BT.L", "British Telecom", null, null, null, -1, null, null, 0.1, null, null, 2, 0, "PENDING"),
              (10L, "Buy", "chris-001", "chris-001.VOD.L", ".FTSE", "VOD.L", "Vodafone", null, null, null, -1, null, null, 0.1, null, null, 2, 0, "PENDING")
            )
          }
      }
    }

    def GivenBasketTradeExist(vuuServer: TestVuuServer, basketId: String, basketTradeName: String): Unit = {
      val basketProvider = vuuServer.getProvider(BasketModule.NAME, BasketTable)
      basketProvider.tick(".FTSE", Map(B.Id -> ".FTSE", B.Name -> ".FTSE 100", B.NotionalValue -> 1000001, B.NotionalValueUsd -> 1500001))

      val constituentProvider = vuuServer.getProvider(BasketModule.NAME, BasketConstituentTable)
      constituentProvider.tick("VOD.L.FTSE", Map(BC.RicBasketId -> "VOD.L.FTSE", BC.Ric -> "VOD.L", BC.BasketId -> basketId, BC.Weighting -> 0.1, BC.Side -> "Buy", BC.Description -> "Vodafone"))
      constituentProvider.tick("BT.L.FTSE", Map(BC.RicBasketId -> "BT.L.FTSE", BC.Ric -> "BT.L", BC.BasketId -> basketId, BC.Weighting -> 0.1, BC.Side -> "Sell", BC.Description -> "British Telecom"))
      constituentProvider.tick("BP.L.FTSE", Map(BC.RicBasketId -> "BP.L.FTSE", BC.Ric -> "BP.L", BC.BasketId -> basketId, BC.Weighting -> 0.1, BC.Side -> "Buy", BC.Description -> "Beyond Petroleum"))

      val vpBasket = vuuServer.createViewPort(BasketModule.NAME, BasketTable)
      val basketService = vuuServer.getViewPortRpcServiceProxy[BasketServiceIF](vpBasket)
      basketService.createBasket(basketId, basketTradeName)(vuuServer.requestContext)
    }

    Scenario("Check the creation of the baskets and constituents") {

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
              ("quantity", "side", "instanceId", "instanceIdRic", "basketId", "ric", "description", "notionalUsd", "notionalLocal", "venue", "algo", "algoParams", "pctFilled", "weighting", "priceSpread", "limitPrice", "priceStrategyId", "filledQty", "orderStatus"),
              (10L, "Buy", "chris-001", "chris-001.BP.L", ".FTSE", "BP.L", "Beyond Petroleum", null, null, null, -1, null, null, 0.1, null, null, 2, 0, "PENDING"),
              (10L, "Sell", "chris-001", "chris-001.BT.L", ".FTSE", "BT.L", "British Telecom", null, null, null, -1, null, null, 0.1, null, null, 2, 0, "PENDING"),
              (10L, "Buy", "chris-001", "chris-001.VOD.L", ".FTSE", "VOD.L", "Vodafone", null, null, null, -1, null, null, 0.1, null, null, 2, 0, "PENDING")
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
          assertVpEq(filterByVp(vpBasketTradingCons, updates)) {
            Table(
              ("quantity", "side", "instanceId", "instanceIdRic", "basketId", "ric", "description", "notionalUsd", "notionalLocal", "venue", "algo", "algoParams", "pctFilled", "weighting", "priceSpread", "limitPrice", "priceStrategyId", "filledQty", "orderStatus"),
              (10L, "Sell", "chris-001", "chris-001.BP.L", ".FTSE", "BP.L", "Beyond Petroleum", null, null, null, -1, null, null, 0.1, null, null, 2, 0, "PENDING"),
              (10L, "Buy", "chris-001", "chris-001.BT.L", ".FTSE", "BT.L", "British Telecom", null, null, null, -1, null, null, 0.1, null, null, 2, 0, "PENDING"),
              (10L, "Sell", "chris-001", "chris-001.VOD.L", ".FTSE", "VOD.L", "Vodafone", null, null, null, -1, null, null, 0.1, null, null, 2, 0, "PENDING")
            )
          }

          When("we edit the units of the parent basket")
          basketTradingService.editCellAction().func("chris-001", "units", 1000L.asInstanceOf[Object], vpBasketTrading, vuuServer.session)

          And("assert the basket trading constituent table has increased the units")
          assertVpEq(filterByVp(vpBasketTradingCons, combineQs(vpBasketTrading))) {
            Table(
              ("quantity", "side", "instanceId", "instanceIdRic", "basketId", "ric", "description", "notionalUsd", "notionalLocal", "venue", "algo", "algoParams", "pctFilled", "weighting", "priceSpread", "limitPrice", "priceStrategyId", "filledQty", "orderStatus"),
              (100L, "Sell", "chris-001", "chris-001.BP.L", ".FTSE", "BP.L", "Beyond Petroleum", null, null, null, -1, null, null, 0.1, null, null, 2, 0, "PENDING"),
              (100L, "Buy", "chris-001", "chris-001.BT.L", ".FTSE", "BT.L", "British Telecom", null, null, null, -1, null, null, 0.1, null, null, 2, 0, "PENDING"),
              (100L, "Sell", "chris-001", "chris-001.VOD.L", ".FTSE", "VOD.L", "Vodafone", null, null, null, -1, null, null, 0.1, null, null, 2, 0, "PENDING")
            )
          }
      }
    }

    Scenario("Check updating trade basket side with no change does not update constituents side") {
      withVuuServer(PriceModule(), BasketModule()) {
        vuuServer =>

          vuuServer.login("testUser", "testToken")

          GivenBasketTradeExist(vuuServer, ".FTSE", "chris-001")

          val vpBasketTrading = vuuServer.createViewPort(BasketModule.NAME, BasketTradingTable)
          val vpBasketTradingCons = vuuServer.createViewPort(BasketModule.NAME, BasketTradingConstituentTable)
          val basketTradingService = vuuServer.getViewPortRpcServiceProxy[BasketTradingServiceIF](vpBasketTrading)

          When("we edit the side of the parent basket to same side as current value")
          basketTradingService.editCellAction().func("chris-001", "side", "Buy", vpBasketTrading, vuuServer.session)
          vuuServer.runOnce()

          Then("get all the updates that have occurred for all view ports from the outbound queue")
          val updates = combineQs(vpBasketTrading)

          And("assert the basket trading table has not changed side....")
          assertVpEq(filterByVp(vpBasketTrading, updates)) {
            Table(
              ("instanceId", "basketId", "basketName", "status", "units", "filledPct", "fxRateToUsd", "totalNotional", "totalNotionalUsd", "side"),
              ("chris-001", ".FTSE", "chris-001", "OFF-MARKET", 1, null, null, null, null, "Buy")
            )
          }

          And("assert the basket trading constituent table has not changed sides")
          assertVpEq(filterByVp(vpBasketTradingCons, updates)) {
            Table(
              ("quantity", "side", "instanceId", "instanceIdRic", "basketId", "ric", "description", "notionalUsd", "notionalLocal", "venue", "algo", "algoParams", "pctFilled", "weighting", "priceSpread", "limitPrice", "priceStrategyId"),
              (10L, "Buy", "chris-001", "chris-001.BP.L", ".FTSE", "BP.L", "Beyond Petroleum", null, null, null, -1, null, null, 0.1, null, null, 2),
              (10L, "Sell", "chris-001", "chris-001.BT.L", ".FTSE", "BT.L", "British Telecom", null, null, null, -1, null, null, 0.1, null, null, 2),
              (10L, "Buy", "chris-001", "chris-001.VOD.L", ".FTSE", "VOD.L", "Vodafone", null, null, null, -1, null, null, 0.1, null, null, 2)
            )
          }
      }
    }
  }

  Feature("Basket Trading Constituent Join Service Test Case") {
    Scenario("Update selected trade constituent sides when menu action is triggered") {
      withVuuServer(PriceModule(), BasketModule()) {
        vuuServer =>

          vuuServer.login("testUser", "testToken")

          val basketName = "test_basket1"
          val tradeId = GivenBasketTrade(vuuServer.tableContainer, basketName, "Buy")
          GivenPrices(vuuServer.tableContainer, List(("VOD.L", 1.1, 1.4), ("BP.L", 2.1, 2.4)))
          GivenBasketTradeConstituentsJoin(vuuServer.tableContainer, tradeId, Map(("VOD.L" -> "Buy"), ("BP.L" -> "Sell")))

          val vpBasketTrading = vuuServer.createViewPort(BasketModule.NAME, BasketTradingTable)
          val vpBasketTradingConsJoin = vuuServer.createViewPort(BasketModule.NAME, BasketTradingConstituentJoin)
          vuuServer.runOnce()

          When("we select multiple constituent rows ")
          vpBasketTradingConsJoin.setSelection(Array(1, 2))

          And("select set sell context menu")
          val basketTradingConstituentJoinService = vuuServer.getViewPortRpcServiceProxy[BasketTradingConstituentJoinServiceIF](vpBasketTradingConsJoin)
          val selection = vpBasketTradingConsJoin.getSelection
          val vpSelection = ViewPortSelection(selection, vpBasketTradingConsJoin)
          basketTradingConstituentJoinService.setSell(vpSelection, vuuServer.session)
          vuuServer.runOnce()

          Then("get all the updates that have occurred for all view ports from the outbound queue")
          val updates = combineQs(vpBasketTrading)

          And("assert only selected constituent has changed set side to sell")
          assertVpEq(filterByVp(vpBasketTradingConsJoin, updates)) {
            Table(
              ("quantity", "side", "instanceId", "instanceIdRic", "basketId", "ric", "description", "notionalUsd", "notionalLocal", "venue", "algo", "algoParams", "pctFilled", "weighting", "priceSpread", "limitPrice", "priceStrategyId", "bid", "bidSize", "ask", "askSize"),
              (10L, "Buy", "chris-001", "chris-001.BP.L", ".FTSE", "BP.L", "Beyond Petroleum", null, null, null, -1, null, null, 0.1, null, null, 2, 2.1, 1, 2.4, 1),
              (10L, "Sell", "chris-001", "chris-001.BT.L", ".FTSE", "BT.L", "British Telecom", null, null, null, -1, null, null, 0.1, null, null, 2, null, null, null, null),
              (10L, "Sell", "chris-001", "chris-001.VOD.L", ".FTSE", "VOD.L", "Vodafone", null, null, null, -1, null, null, 0.1, null, null, 2, 1.1, 1, 1.4, 1)
            )
          }
      }
    }
  }

  def uuid = java.util.UUID.randomUUID.toString
  def GivenBasketTradeExist(vuuServer: TestVuuServer, basketId: String, basketTradeName: String): Unit = {
    val basketProvider = vuuServer.getProvider(BasketModule.NAME, BasketTable)
    basketProvider.tick(".FTSE", Map(B.Id -> ".FTSE", B.Name -> ".FTSE 100", B.NotionalValue -> 1000001, B.NotionalValueUsd -> 1500001))

    val constituentProvider = vuuServer.getProvider(BasketModule.NAME, BasketConstituentTable)
    constituentProvider.tick("VOD.L.FTSE", Map(BC.RicBasketId -> "VOD.L.FTSE", BC.Ric -> "VOD.L", BC.BasketId -> basketId, BC.Weighting -> 0.1, BC.Side -> "Buy", BC.Description -> "Vodafone"))
    constituentProvider.tick("BT.L.FTSE", Map(BC.RicBasketId -> "BT.L.FTSE", BC.Ric -> "BT.L", BC.BasketId -> basketId, BC.Weighting -> 0.1, BC.Side -> "Sell", BC.Description -> "British Telecom"))
    constituentProvider.tick("BP.L.FTSE", Map(BC.RicBasketId -> "BP.L.FTSE", BC.Ric -> "BP.L", BC.BasketId -> basketId, BC.Weighting -> 0.1, BC.Side -> "Buy", BC.Description -> "Beyond Petroleum"))

    val vpBasket = vuuServer.createViewPort(BasketModule.NAME, BasketTable)
    val basketService = vuuServer.getViewPortRpcServiceProxy[BasketServiceIF](vpBasket)
    basketService.createBasket(basketId, basketTradeName)(vuuServer.requestContext)
  }

  def GivenBasketTrade(tableContainer: TableContainer, basketName: String, side: String): String = {
    val table = tableContainer.getTable(BasketModule.BasketTradingTable)
    val rowKey = s"$uuid.$basketName"
    table.processUpdate(rowKey, TestDataFactory.createBasketTradingRow(rowKey, basketName, side), clock.now())
    rowKey
  }

  def GivenBasketTradeConstituents(tableContainer: TableContainer, tradeId: String, ricToSide: Map[String, String]): Unit = {
    val table = tableContainer.getTable(BasketModule.BasketTradingConstituentTable)
    ricToSide.foreach(item => {
      val (ric, side) = item
      val row = TestDataFactory.createBasketTradingConstituentRow(tradeId, ric, side)
      table.processUpdate(row.key, row, clock.now())
    })
  }

  def GivenBasketTradeConstituentsJoin(tableContainer: TableContainer, tradeId: String, ricToSide: Map[String, String]): Unit = {
    val table = tableContainer.getTable(BasketModule.BasketTradingConstituentJoin)
    ricToSide.foreach(item => {
      val (ric, side) = item
      val row = TestDataFactory.createBasketTradingConstituentJoinRow(tradeId, ric, side)
      updateJoinTable(table, row)
    })
  }

  def updateJoinTable(table: DataTable, row: RowWithData): Unit = {
    val joinTable = table.asTable.asInstanceOf[JoinTable]
    val baseTableDef = joinTable.getTableDef.asInstanceOf[JoinTableDef].baseTable
    joinTable.sourceTables.get(baseTableDef.name) match {
      case Some(table: DataTable) =>
        table.processUpdate(row.key, row, clock.now())
      case None =>
        //log and throw?
    }
  }

  def GivenPrices(tableContainer: TableContainer, prices: List[(String, Double, Double)]) = {
    val table = tableContainer.getTable("prices")
    for ((ric, bid, ask) <- prices) {
      val rowKey = s"$uuid"
      table.processUpdate(rowKey, TestDataFactory.createPricesRow(rowKey, ric, bid, ask), clock.now())
    }
  }

  //todo having issue importing side constant
  //todo introduce case class BasketTrading?

}