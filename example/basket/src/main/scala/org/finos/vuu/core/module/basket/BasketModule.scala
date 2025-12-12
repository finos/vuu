package org.finos.vuu.core.module.basket

import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.Clock
import org.finos.vuu.api.*
import org.finos.vuu.core.module.basket.provider.*
import org.finos.vuu.core.module.basket.service.{BasketService, BasketTradingConstituentJoinService, BasketTradingConstituentService, BasketTradingService}
import org.finos.vuu.core.module.price.PriceModule
import org.finos.vuu.core.module.{DefaultModule, ModuleFactory, TableDefContainer, ViewServerModule}
import org.finos.vuu.core.table.Columns
import org.finos.vuu.order.oms.OmsApi

object BasketModule extends DefaultModule {

  final val NAME = "BASKET"

  final val BasketTable = "basket"
  final val BasketTradingTable = "basketTrading"
  final val BasketConstituentTable = "basketConstituent"
  final val BasketTradingConstituentTable = "basketTradingConstituent"
  final val BasketTradingConstituentJoin = "basketTradingConstituentJoin"

  def apply(omsApi: OmsApi)(implicit clock: Clock, lifecycle: LifecycleContainer, tableDefContainer: TableDefContainer): ViewServerModule = {

    import org.finos.vuu.core.module.basket.BasketModule.{BasketColumnNames => B, BasketConstituentColumnNames => BC, BasketTradingColumnNames => BT, BasketTradingConstituentColumnNames => BTC, PriceStrategy => PS}

    ModuleFactory.withNamespace(NAME)
      .addTable(
        //this table should contain one row for each of .FTSE, .DJI, .HSI, .etc...
        TableDef(
          name = BasketTable,
          keyField = B.Id,
          columns = Columns.fromNames(B.Id.string(), B.Name.string(), B.NotionalValue.double(), B.NotionalValueUsd.double()),
          VisualLinks(),
          joinFields = B.Id
        ),
        (table, _) => new BasketProvider(table),
        (table, _, _, tableContainer) => ViewPortDef(
          columns = table.getTableDef.getColumns,
          service = new BasketService(table, omsApi)(clock, tableContainer)
        )
      )
      .addTable(
        TableDef(
          name = BasketConstituentTable,
          keyField = BC.RicBasketId,
          columns = Columns.fromNames(BC.RicBasketId.string(), BC.Ric.string(), BC.BasketId.string(),
                                      BC.Weighting.double(), BC.LastTrade.string(), BC.Change.string(),
                                      BC.Volume.string(), BC.Side.string(), BC.Description.string()), // we can join to instruments and other tables to get the rest of the data.....
          VisualLinks(),
          joinFields = BC.RicBasketId, BC.Ric
        ),
        (table, vs) => new BasketConstituentProvider(table),
      )
      .addTable(
        TableDef(
          name = BasketTradingTable,
          keyField = BT.InstanceId,
          columns = Columns.fromNames(BT.InstanceId.string(), BT.BasketId.string(), BT.BasketName.string(),
                                      BT.Status.string(), BT.Units.int(), BT.FilledPct.double(), BT.FxRateToUsd.double(),
                                      BT.TotalNotional.double(), BT.TotalNotionalUsd.double(), BT.Side.string()
          ), // we can join to instruments and other tables to get the rest of the data.....
          VisualLinks(
            Link(BT.InstanceId, BasketTradingTable, BT.InstanceId)
          ),
          indices = Indices(
            Index(BT.InstanceId)
          ),
          joinFields = BT.BasketId
        ),
        (table, vs) => new BasketTradingProvider(table, vs.tableContainer),
        (table, _, _, tableContainer) => ViewPortDef(
          columns = table.getTableDef.getColumns,
          service = new BasketTradingService(table, omsApi)(using tableContainer)
        )
      )
      .addTable(
        TableDef(
          name = BasketTradingConstituentTable,
          keyField = BTC.InstanceIdRic,
          columns = Columns.fromNames(BTC.Quantity.long(), BTC.Side.string(),
                                      BTC.InstanceIdRic.string(), BTC.InstanceId.string(), BTC.Ric.string(),
                                      BTC.BasketId.string(), BTC.PriceStrategyId.int(),
                                      BTC.Description.string(),
                                      BTC.NotionalUsd.double(), BTC.NotionalLocal.double(),
                                      BTC.Venue.string(),
                                      BTC.Algo.string(), BTC.AlgoParams.string(),
                                      BTC.PctFilled.double(), BTC.Weighting.double(),
                                      BTC.PriceSpread.int(),
                                      BTC.LimitPrice.double(),
                                      BTC.FilledQty.long(),
                                      BTC.OrderStatus.string()
          ),// we can join to instruments and other tables to get the rest of the data.....
          VisualLinks(
            Link(BTC.BasketId, BasketTradingTable, BT.BasketId),
          ),
          indices = Indices(
            Index(BTC.BasketId)
          ),
          joinFields = BTC.InstanceIdRic, BTC.Ric
        ),
        (table, vs) => new BasketTradingConstituentProvider(table, omsApi),
        (table, _, _, tableContainer) => ViewPortDef(
          columns = table.getTableDef.getColumns,
          service = new BasketTradingConstituentService(table)(clock, tableContainer)
        )
      )
      .addTable(
        //lookup table for price strategies....
        TableDef(
          name = "priceStrategyType",
          keyField = PS.Id,
          columns = Columns.fromNames(PS.Id.int(), PS.PriceStrategy.string()), // we can join to instruments and other tables to get the rest of the data.....
          VisualLinks(),
          joinFields = PS.Id
        ),
        (table, _) => new PriceStrategyProvider(table)
      )
      .addTable(
        //lookup table for price strategies....
        TableDef(
          name = "algoType",
          keyField = Algo.Id,
          columns = Columns.fromNames(Algo.Id.int(), Algo.AlgoType.string()), // we can join to instruments and other tables to get the rest of the data.....
          VisualLinks(),
          joinFields = PS.Id
        ),
        (table, _) => new AlgoProvider(table)
      )
      .addJoinTable(tableDefs =>
        JoinTableDef(
          name = BasketTradingConstituentJoin,
          baseTable = tableDefs.get(NAME, BasketTradingConstituentTable),
          joinColumns = Columns.allFrom(tableDefs.get(NAME, BasketTradingConstituentTable)) ++ Columns.allFromExceptDefaultAnd(tableDefs.get(PriceModule.NAME, "prices"), "ric"),
          VisualLinks(
            Link(BTC.BasketId, BasketTradingTable, BT.BasketId)
          ),
          joins =
            JoinTo(
              table = tableDefs.get(PriceModule.NAME, PriceModule.PriceTable),
              joinSpec = JoinSpec(left = "ric", right = "ric", LeftOuterJoin)
            ),
          joinFields = Seq(),
        ),
        (table, _, _, tableContainer) => ViewPortDef(
          columns = table.getTableDef.getColumns,
          service = new BasketTradingConstituentJoinService(table)(clock, tableContainer)
        )
      )
      .asModule()
  }

  object PriceStrategy {
    final val Id = "id"
    final val PriceStrategy = "priceStrategy"
  }

  object Algo {
    final val Id = "id"
    final val AlgoType = "algoType"
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
    final val Description = "description"
    final val Side = "side"
  }

  object BasketTradingColumnNames {
    final val BasketId = "basketId"
    final val InstanceId = "instanceId"
    final val BasketName = "basketName"
    final val FxRateToUsd = "fxRateToUsd"
    final val Units = "units"
    final val TotalNotionalUsd = "totalNotionalUsd"
    final val TotalNotional = "totalNotional"
    final val Status = "status"
    final val FilledPct = "filledPct"
    final val Side = "side"
  }

  object BasketTradingConstituentColumnNames {
    final val InstanceIdRic = "instanceIdRic"
    final val Side          = "side"
    final val InstanceId = "instanceId"
    final val BasketId = "basketId"
    final val Ric = "ric"
    final val Description = "description"
    final val Quantity = "quantity"
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
    final val OrderStatus = "orderStatus"
    final val FilledQty = "filledQty"
  }
}
