package org.finos.vuu.core.module.basket

import org.finos.vuu.core.module.basket.BasketModule.{BasketColumnNames => B, BasketConstituentColumnNames => BC}
import org.finos.vuu.provider.MockProvider

object BasketTestCaseHelper {
  def tickPrices(provider: MockProvider): Unit = {
    provider.tick("VOD.L", Map("ric" -> "VOD.L", "phase" -> "C", "bid" -> 100, "ask" -> 101, "last" -> 101.5))
    provider.tick("BT.L", Map("ric" -> "BT.L", "phase" -> "C", "bid" -> 200, "ask" -> 201, "last" -> 201.5))
    provider.tick("BP.L", Map("ric" -> "BP.L", "phase" -> "C", "bid" -> 300, "ask" -> 301, "last" -> 301.5))
    provider.tick("AAPL", Map("ric" -> "AAPL", "phase" -> "C", "bid" -> 1000, "ask" -> 1001, "last" -> 1001.5))
    provider.tick("MSFT", Map("ric" -> "MSFT", "phase" -> "C", "bid" -> 1100, "ask" -> 1001, "last" -> 1001.5))
  }
  def tickBasketDef(provider: MockProvider): Unit = {
    provider.tick(".FTSE", Map(B.Id -> ".FTSE", B.Name -> ".FTSE 100", B.NotionalValue -> 1000001, B.NotionalValueUsd -> 1500001))
    provider.tick(".NASDAQ", Map(B.Id -> ".NASDAQ", B.Name -> ".NASDAQ", B.NotionalValue -> 3000001, B.NotionalValueUsd -> 3500001))
  }

  def tickConstituentsDef(provider: MockProvider): Unit = {
    //symbol + "." + basketId
    //Columns.fromNames(BC.RicBasketId.string(), BC.Ric.string(), BC.BasketId.string(), BC.Weighting.double(), BC.LastTrade.string(), BC.Change.string(),
    //            BC.Volume.string(), BC.Side.string())
    provider.tick("VOD.L.FTSE", Map(BC.RicBasketId -> "VOD.L.FTSE", BC.Ric -> "VOD.L", BC.BasketId -> ".FTSE", BC.Weighting -> 0.1, BC.Side -> "Buy", BC.Description -> "Vodafone"))
    provider.tick("BT.L.FTSE", Map(BC.RicBasketId -> "BT.L.FTSE", BC.Ric -> "BT.L", BC.BasketId -> ".FTSE", BC.Weighting -> 0.1, BC.Side -> "Sell", BC.Description -> "British Telecom"))
    provider.tick("BP.L.FTSE", Map(BC.RicBasketId -> "BP.L.FTSE", BC.Ric -> "BP.L", BC.BasketId -> ".FTSE", BC.Weighting -> 0.1, BC.Side -> "Buy", BC.Description -> "Beyond Petroleum"))
  }
}
