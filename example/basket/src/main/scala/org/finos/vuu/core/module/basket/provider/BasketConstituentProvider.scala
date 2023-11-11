package org.finos.vuu.core.module.basket.provider

import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.thread.RunOnceLifeCycleRunner
import org.finos.toolbox.time.Clock
import org.finos.vuu.core.module.basket.BasketConstants
import org.finos.vuu.core.module.basket.csv.CsvStaticLoader
import org.finos.vuu.core.table.{DataTable, RowWithData}
import org.finos.vuu.provider.DefaultProvider

class BasketConstituentProvider(val table: DataTable)(implicit lifecycle: LifecycleContainer, clock: Clock) extends DefaultProvider {

  private val runner = new RunOnceLifeCycleRunner("BasketConstituentProvider", runOnce)

  lifecycle(this).dependsOn(runner)

  import org.finos.vuu.core.module.basket.BasketModule.BasketConstituentColumnNames._

  def runOnce(): Unit = {
    val baskets = CsvStaticLoader.load
    baskets.foreach(basketId => updateBasketConstituents(basketId))
  }

  def updateBasketConstituents(basketId: String): Unit = {
    val list = CsvStaticLoader.loadConstituent(basketId)
    list.foreach(row => {

      if (row.nonEmpty) {
        val symbol = row("Symbol").asInstanceOf[String]
        val name = row("Name")
        val lastTrade = row("Last Trade")
        val change = row("Change")
        val volume = row("Volume")
        val weighting = row("Weighting")
        val side = BasketConstants.Side.Buy
        val ricBasketId = symbol + "." + basketId
        table.processUpdate(ricBasketId, RowWithData(symbol, Map(
          Ric -> symbol,
          BasketId -> basketId,
          RicBasketId -> ricBasketId,
          LastTrade -> lastTrade,
          Change -> change,
          Weighting -> weighting,
          Volume -> volume,
          Description -> name,
          Side -> side
        )), clock.now())
      }
    })

  }

  override val lifecycleId: String = "org.finos.vuu.core.module.basket.provider.BasketConstituentProvider"
}
