package org.finos.vuu.core.module.basket

import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.Clock
import org.finos.vuu.api.{TableDef, VisualLinks}
import org.finos.vuu.core.module.basket.provider.{BasketConstituentProvider, BasketProvider, NotYetImplementedProvider}
import org.finos.vuu.core.module.{DefaultModule, ModuleFactory, ViewServerModule}
import org.finos.vuu.core.table.Columns

object BasketModule extends DefaultModule {

  private final val NAME = "BASKET"

  def apply()(implicit clock: Clock, lifecycle: LifecycleContainer): ViewServerModule = {

    import BasketColumnNames._
    import BasketConstituentColumnNames._

    ModuleFactory.withNamespace(NAME)
      .addTable(
        TableDef(
          name = "basket",
          keyField = Id,
          columns = Columns.fromNames(Id.string(), Name.string(), NotionalValue.double(), NotionalValueUsd.double()),
          VisualLinks(),
          joinFields = Id
        ),
        (table, vs) => new BasketProvider(table),
      )
    ModuleFactory.withNamespace(NAME)
      .addTable(
        TableDef(
          name = "basketConstituent",
          keyField = Ric,
          columns = Columns.fromNames(Ric.string(), BasketId.string(), Weighting.double(), LastTrade.string(), Change.string(), Volume.string()), // we can join to instruments and other tables to get the rest of the data.....
          VisualLinks(),
          joinFields = Id
        ),
        (table, vs) => new BasketConstituentProvider(table),
      )
      .addTable(
        TableDef(
          name = "basketDesign",
          keyField = Ric,
          columns = Columns.fromNames(Ric.string(), BasketId.string(), Weighting.double()), // we can join to instruments and other tables to get the rest of the data.....
          VisualLinks(),
          joinFields = Id
        ),
        (table, vs) => new NotYetImplementedProvider(table),
      )
      .addTable(
        TableDef(
          name = "basketTrading",
          keyField = Ric,
          columns = Columns.fromNames(Ric.string(), BasketId.string(), Weighting.double()), // we can join to instruments and other tables to get the rest of the data.....
          VisualLinks(),
          joinFields = Id
        ),
        (table, vs) => new NotYetImplementedProvider(table),
      )
      .addTable(
        TableDef(
          name = "basketConstituentDesign",
          keyField = Ric,
          columns = Columns.fromNames(Ric.string(), BasketId.string(), Weighting.double()), // we can join to instruments and other tables to get the rest of the data.....
          VisualLinks(),
          joinFields = Id
        ),
        (table, vs) => new NotYetImplementedProvider(table),
      )
      .addTable(
        TableDef(
          name = "basketConstituentTrading",
          keyField = Ric,
          columns = Columns.fromNames(Ric.string(), BasketId.string(), Weighting.double()), // we can join to instruments and other tables to get the rest of the data.....
          VisualLinks(),
          joinFields = Id
        ),
        (table, vs) => new NotYetImplementedProvider(table),
      )
      .asModule()
  }

  object BasketColumnNames {
    final val Id = "id"
    final val Name = "name"
    final val NotionalValue = "notionalValue"
    final val NotionalValueUsd = "notionalValue"
  }

  object BasketConstituentColumnNames {
    final val Ric = "ric"
    final val BasketId = "basketId"
    final val Weighting = "weighting"
    final val LastTrade = "lastTrade"
    final val Change = "change"
    final val Volume = "volume"
  }

}
