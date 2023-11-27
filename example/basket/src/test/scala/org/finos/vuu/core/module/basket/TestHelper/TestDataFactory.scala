package org.finos.vuu.core.module.basket.TestHelper

import org.finos.vuu.core.table.RowWithData
import org.finos.vuu.core.module.basket.BasketModule.{Sides, BasketColumnNames => B, BasketConstituentColumnNames => BC, BasketTradingColumnNames => BT,  BasketTradingConstituentColumnNames => BTC}

object TestDataFactory {
  def uuid = java.util.UUID.randomUUID.toString
  def createBasketTradingRow(rowKey: String, basketName: String, side: String): RowWithData =
    RowWithData(rowKey, Map(BT.InstanceId -> rowKey, BT.Status -> "OFF-MARKET", BT.BasketId -> ".FTSE", BT.BasketName -> basketName, BT.Side -> side, BT.Units -> 1))

  def createBasketTradingConstituentRow(basketTradeInstanceId: String, constituentRic: String, side: String): RowWithData = {
    RowWithData(
      key = uuid,
      data = Map(
        BTC.BasketId -> "someBasketId",
        BTC.Ric -> constituentRic,
        BTC.InstanceId -> basketTradeInstanceId,
        BTC.Quantity -> 40 ,
        BTC.InstanceIdRic -> s"$basketTradeInstanceId.$constituentRic",
        BTC.Description -> "some instrument description",
        BTC.Side -> side,
        BTC.Weighting -> 0.4,
        BTC.PriceStrategyId -> 2,
        BTC.Algo -> -1,
      )
    )
  }


  //todo does row key need to match instance id (primary key)
  def createBasketTradingConstituentJoinRow(basketTradeInstanceId: String, constituentRic: String, side: String): RowWithData = {
    RowWithData(
      key = uuid,
      data = Map(
        BTC.BasketId -> "someBasketId",
        BTC.Ric -> constituentRic,
        BTC.InstanceId -> basketTradeInstanceId,
        BTC.Quantity -> 40,
        BTC.InstanceIdRic -> s"$basketTradeInstanceId.$constituentRic",
        BTC.Description -> "some instrument description",
        BTC.Side -> side,
        BTC.Weighting -> 0.4,
        BTC.PriceStrategyId -> 2,
        BTC.Algo -> -1,
        "bid" -> 1.1,
        "bidSize" -> 1,
        "ask" -> 1.5,
        "askSize" -> 1,
      )
    )
  }

  def createPricesRow(rowKey: String, ric: String, bid: Double, ask: Double): RowWithData = {
    RowWithData(
      key = rowKey,
      data = Map(
        "ric" -> ric,
        "bid" -> bid,
        "bidSize" -> 1,
        "ask" -> ask,
        "askSize" -> 1,
      )
    )
  }
}
