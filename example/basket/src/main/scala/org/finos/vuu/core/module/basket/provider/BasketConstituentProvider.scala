package org.finos.vuu.core.module.basket.provider

import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.thread.RunOnceLifeCycleRunner
import org.finos.toolbox.time.Clock
import org.finos.vuu.core.module.basket.BasketConstants
import org.finos.vuu.core.module.basket.BasketModule.BasketConstituentColumnNames.{BasketId, Change, Description, LastTrade, Ric, RicBasketId, Side, Volume, Weighting}
import org.finos.vuu.core.module.basket.csv.BasketLoader
import org.finos.vuu.core.table.{DataTable, RowWithData}
import org.finos.vuu.provider.DefaultProvider

class BasketConstituentProvider(val table: DataTable)(implicit lifecycle: LifecycleContainer, clock: Clock) extends DefaultProvider {

  private val runner = new RunOnceLifeCycleRunner("BasketConstituentProvider", runOnce)
  private val basketLoader = new BasketLoader()

  private val ricCol = table.getTableDef.columnForName(Ric)
  private val basketIdCol = table.getTableDef.columnForName(BasketId)
  private val ricBasketIdCol = table.getTableDef.columnForName(RicBasketId)
  private val lastTradeCol = table.getTableDef.columnForName(LastTrade)
  private val changeCol = table.getTableDef.columnForName(Change)
  private val weightingCol = table.getTableDef.columnForName(Weighting)
  private val volumeCol = table.getTableDef.columnForName(Volume)
  private val sideCol = table.getTableDef.columnForName(Side)
  private val descCol = table.getTableDef.columnForName(Description)

  lifecycle(this).dependsOn(runner)

  import org.finos.vuu.core.module.basket.BasketModule.BasketConstituentColumnNames._

  def runOnce(): Unit = {
    val baskets = basketLoader.loadBasketIds()
    baskets.foreach(basketId => updateBasketConstituents(basketId))
  }

  def updateBasketConstituents(basketId: String): Unit = {

    val list = basketLoader.loadConstituents(basketId)

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

        val rowData = table.newRow(ricBasketId)
          .setString(ricCol, symbol)
          .setString(basketIdCol, basketId)
          .setString(ricBasketIdCol, ricBasketId)
          .setString(lastTradeCol, Option(lastTrade).getOrElse("").toString)
          .setString(changeCol, Option(change).getOrElse("").toString)
          .setDouble(weightingCol, weighting.asInstanceOf[Double])
          .setString(volumeCol, Option(volume).getOrElse("").toString)
          .setString(descCol, name.toString)
          .setString(sideCol, side)
          .asRow

        table.processUpdate(rowData)
      }
    })

  }

  override val lifecycleId: String = "org.finos.vuu.core.module.basket.provider.BasketConstituentProvider"
}
