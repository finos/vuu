package org.finos.vuu.core.module.basket

import org.finos.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.{Clock, TestFriendlyClock}
import org.finos.vuu.api.JoinTableDef
import org.finos.vuu.core.module.TableDefContainer
import org.finos.vuu.core.module.basket.TestHelper.TestDataFactory
import org.finos.vuu.core.module.price.PriceModule
import org.finos.vuu.core.table.{DataTable, JoinTable, RowWithData, TableContainer}
import org.finos.vuu.net.rpc.RpcParams
import org.finos.vuu.order.oms.OmsApi
import org.finos.vuu.test.VuuServerTestCase
import org.finos.vuu.util.table.TableAsserts.assertVpEq
import org.finos.vuu.viewport.ViewPortSelection
import org.scalatest.Ignore
import org.scalatest.prop.Tables.Table

@Ignore //working progress
class BasketConstituentMutateTest extends VuuServerTestCase {

  import BasketModule._

  implicit val clock: Clock = new TestFriendlyClock(10001L)
  implicit val lifecycle: LifecycleContainer = new LifecycleContainer()
  implicit val tableDefContainer: TableDefContainer = new TableDefContainer(Map())
  implicit val metricsProvider: MetricsProvider = new MetricsProviderImpl
  val omsApi = OmsApi()
  Feature("Basket Trading Constituent Join Service Test Case") {
    Scenario("Update selected trade constituent sides when menu action is triggered") {
      withVuuServer(PriceModule(), BasketModule(omsApi)) {
        vuuServer =>

          vuuServer.login("testUser")

          val basketName = "test_basket1"
          val tradeId = GivenBasketTrade(vuuServer.tableContainer, basketName, "BUY")
          GivenPrices(vuuServer.tableContainer, List(("VOD.L", 1.1, 1.4), ("BP.L", 2.1, 2.4)))
          GivenBasketTradeConstituentsJoin(vuuServer.tableContainer, tradeId, Map(("VOD.L" -> "BUY"), ("BP.L" -> "SELL")))

          val vpBasketTrading = vuuServer.createViewPort(BasketModule.NAME, BasketTradingTable)
          val vpBasketTradingConsJoin = vuuServer.createViewPort(BasketModule.NAME, BasketTradingConstituentJoin)
          vuuServer.runOnce()

          When("we select multiple constituent rows ")
          //vpBasketTradingConsJoin.setSelection(Array(1, 2))
          // TODO: change setSelection to selectRowRange and use appropriate row keys

          And("select set sell context menu")
          val basketTradingConstituentJoinService = vpBasketTradingConsJoin.getStructure.viewPortDef.service
          val selection = vpBasketTradingConsJoin.getSelection
          val vpSelection = ViewPortSelection(selection, vpBasketTradingConsJoin)
          basketTradingConstituentJoinService.processRpcRequest("setSell", new RpcParams(Map("selection" -> vpSelection), vpBasketTradingConsJoin, vuuServer.requestContext))
          vuuServer.runOnce()

          Then("get all the updates that have occurred for all view ports from the outbound queue")
          val updates = combineQs(vpBasketTrading)

          And("assert only selected constituent has changed set side to sell")


          assertVpEq(filterByVp(vpBasketTradingConsJoin, updates)) {
            Table(
              ("quantity", "side", "instanceId", "instanceIdRic", "basketId", "ric", "description", "notionalUsd", "notionalLocal", "venue", "algo", "algoParams", "pctFilled", "weighting", "priceSpread", "limitPrice", "priceStrategyId", "bid", "ask", "filledQty", "orderStatus"),
              (10L, "BUY", "testUser-00001", "testUser-00001.BP.L", ".FTSE", "BP.L", "Beyond Petroleum", null, null, null, -1, null, null, 0.1, null, null, 2, 2.1, 2.4, 0, "PENDING"),
              (10L, "SELL", "testUser-00001", "testUser-00001.BT.L", ".FTSE", "BT.L", "British Telecom", null, null, null, -1, null, null, 0.1, null, null, 2, null, null, 0, "PENDING"),
              (10L, "SELL", "testUser-00001", "testUser-00001.VOD.L", ".FTSE", "VOD.L", "Vodafone", null, null, null, -1, null, null, 0.1, null, null, 2, 1.1, 1.4, 0, "PENDING")
            )
          }
      }
    }
  }

  def uuid = java.util.UUID.randomUUID.toString

  def GivenBasketTrade(tableContainer: TableContainer, basketName: String, side: String): String = {
    val table = tableContainer.getTable(BasketModule.BasketTradingTable)
    val rowKey = s"$uuid.$basketName"
    table.processUpdate(rowKey, TestDataFactory.createBasketTradingRow(rowKey, basketName, side))
    rowKey
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
        table.processUpdate(row.key, row)
      case None =>
      //log and throw?
    }
  }

  def GivenPrices(tableContainer: TableContainer, prices: List[(String, Double, Double)]) = {
    val table = tableContainer.getTable("prices")
    for ((ric, bid, ask) <- prices) {
      val rowKey = s"$uuid"
      table.processUpdate(rowKey, TestDataFactory.createPricesRow(rowKey, ric, bid, ask))
    }
  }

  //todo having issue importing side constant
  //todo introduce case class BasketTrading?


}
