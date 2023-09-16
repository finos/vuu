package org.finos.vuu.core.module.basket.provider

import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.thread.{LifeCycleRunner, RunOnceLifeCycleRunner}
import org.finos.toolbox.time.Clock
import org.finos.vuu.core.module.basket.csv.CsvStaticLoader
import org.finos.vuu.core.table.{DataTable, RowWithData}
import org.finos.vuu.provider.DefaultProvider

class BasketConstituentProvider(val table: DataTable)(implicit lifecycle: LifecycleContainer, clock: Clock) extends DefaultProvider{

  private val runner = new RunOnceLifeCycleRunner("BasketConstituentProvider", runOnce)

  lifecycle(this).dependsOn(runner)

  import org.finos.vuu.core.module.basket.BasketModule.BasketConstituentColumnNames._

  def runOnce(): Unit = {
     val ftse = CsvStaticLoader.loadStatic

    val index = ".FTSE"

    ftse.tail.foreach( row => {

      if(row.length >= 5){
        val symbol = row(0)
        val name = row(1)
        val lastTrade = row(2)
        val change = row(3)
        val volume = row(4)

        table.processUpdate(symbol, RowWithData(symbol, Map(
          Ric -> symbol,
          BasketId -> index,
          LastTrade -> lastTrade,
          Change -> change,
          //Volume -> volume
        )), clock.now())
      }

    })

  }

  override val lifecycleId: String = "org.finos.vuu.core.module.basket.provider.BasketConstituentProvider"
}
