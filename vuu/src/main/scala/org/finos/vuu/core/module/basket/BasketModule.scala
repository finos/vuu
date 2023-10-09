package org.finos.vuu.core.module.basket

import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.Clock
import org.finos.vuu.api.{TableDef, VisualLinks}
import org.finos.vuu.core.module.basket.provider.{BasketConstituentProvider, BasketProvider, NotYetImplementedProvider, PriceStrategyProvider}
import org.finos.vuu.core.module.{DefaultModule, ModuleFactory, ViewServerModule}
import org.finos.vuu.core.table.Columns

object BasketModule extends DefaultModule {

  private final val NAME = "BASKET"

  def apply()(implicit clock: Clock, lifecycle: LifecycleContainer): ViewServerModule = {

    import org.finos.vuu.core.module.basket.BasketModule.{BasketColumnNames => B}
    import org.finos.vuu.core.module.basket.BasketModule.{BasketConstituentColumnNames => BC}
    import org.finos.vuu.core.module.basket.BasketModule.{BasketTradingColumnNames => BT}
    import org.finos.vuu.core.module.basket.BasketModule.{BasketTradingConstituentColumnNames => BTC}
    import org.finos.vuu.core.module.basket.BasketModule.{PriceStrategy => PS}

    ModuleFactory.withNamespace(NAME)
      .addTable(
        //this table should contain one row for each of .FTSE, .DJI, .HSI, .etc...
        TableDef(
          name = "basket",
          keyField = B.Id,
          columns = Columns.fromNames(B.Id.string(), B.Name.string(), B.NotionalValue.double(), B.NotionalValueUsd.double()),
          VisualLinks(),
          joinFields = B.Id
        ),
        (table, vs) => new BasketProvider(table),
      )
      .addTable(
        TableDef(
          name = "basketConstituent",
          keyField = BC.RicBasketId,
          columns = Columns.fromNames(BC.RicBasketId.string(), BC.Ric.string(), BC.BasketId.string(), BC.Weighting.double(), BC.LastTrade.string(), BC.Change.string(), BC.Volume.string()), // we can join to instruments and other tables to get the rest of the data.....
          VisualLinks(),
          joinFields = BC.RicBasketId
        ),
        (table, vs) => new BasketConstituentProvider(table),
      )
      .addTable(
        TableDef(
          name = "basketTrading",
          keyField = BT.InstanceId,
          columns = Columns.fromNames(BT.InstanceId.string(), BT.BasketId.string(), BT.BasketName.string(), BT.Status.string(), BT.Units.int(), BT.FilledPct.double(), BT.FxRateToUsd.double(), BT.TotalNotional.double(), BT.TotalNotionalUsd.double()), // we can join to instruments and other tables to get the rest of the data.....
          VisualLinks(),
          joinFields = BT.BasketId
        ),
        (table, vs) => new NotYetImplementedProvider(table),
      )
      .addTable(
        TableDef(
          name = "basketTradingConstituent",
          keyField = BTC.InstanceIdRic,
          columns = Columns.fromNames(BTC.InstanceIdRic.string(), BTC.InstanceId.string(), BTC.Ric.string(),
                                      BTC.BasketId.string(), BTC.PriceStrategyId.int(),
                                      BTC.Description.string(),
                                      BTC.Bid.double(), BTC.Offer.double(), BTC.Last.double(),
                                      BTC.NotionalUsd.double(), BTC.NotionalLocal.double(),
                                      BTC.Venue.string(),
                                      BTC.Algo.string(), BTC.AlgoParams.string(),
                                      BTC.PctFilled.double(), BTC.Weighting.double(),
                                      BTC.PriceSpread.int(),
                                      BTC.LimitPrice.double()
          ),// we can join to instruments and other tables to get the rest of the data.....
          VisualLinks(),
          joinFields = BTC.InstanceIdRic
        ),
        (table, vs) => new NotYetImplementedProvider(table),
      )
      .addTable(
        //lookup table for price strategies....
        TableDef(
          name = "priceStrategy",
          keyField = PS.Id,
          columns = Columns.fromNames(PS.Id.int(), PS.PriceStrategy.string()), // we can join to instruments and other tables to get the rest of the data.....
          VisualLinks(),
          joinFields = PS.Id
        ),
        (table, _) => new PriceStrategyProvider(table),
      )
      .asModule()
  }

  object PriceStrategy {
    final val Id = "id"
    final val PriceStrategy = "priceStrategy"
    final val NotionalValue = "notionalValue"
    final val NotionalValueUsd = "notionalValue"
  }

  object BasketColumnNames {
    final val Id = "id"
    final val Name = "name"
    final val NotionalValue = "notionalValue"
    final val NotionalValueUsd = "notionalValueUsd"
  }

  object BasketConstituentColumnNames {
    final val RicBasketId = "ricBasketId"
    final val Ric = "ric"
    final val BasketId = "basketId"
    final val Weighting = "weighting"
    final val LastTrade = "lastTrade"
    final val Change = "change"
    final val Volume = "volume"
  }

  object BasketTradingColumnNames {
    final val BasketId = "basketId"
    final val InstanceId = "instanceId"
    final val BasketName = "basketName"
    final val FxRateToUsd = "fxRateToUsd"
    final val Units = "units"
    final val TotalNotionalUsd = "totalNotionalUsd"
    final val TotalNotional = "totalNotional"
    //BasketTrading Screen
    final val Status = "status"
    final val FilledPct = "filledPct"
  }

  object BasketTradingConstituentColumnNames {
    final val InstanceIdRic = "instanceIdRic"
    final val InstanceId = "instanceId"
    final val BasketId = "basketId"
    final val Ric = "ric"
    final val Description = "description"
    final val Quantity = "quantity"
    final val Last = "last"
    final val Bid = "bid"
    final val Offer = "offer"
    final val LimitPrice = "limitPrice"
    final val PriceStrategyId = "priceStrategyId"
    final val NotionalUsd = "notionalUsd"
    final val NotionalLocal = "notionalLocal"
    final val Venue = "venue"
    final val Algo = "algo"
    final val AlgoParams = "algoParams"
    final val PctFilled = "pctFilled"
    final val Weighting = "weighting"
    final val PriceSpread = "priceSpread"
  }
}
