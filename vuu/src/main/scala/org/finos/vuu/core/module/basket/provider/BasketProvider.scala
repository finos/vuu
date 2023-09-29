package org.finos.vuu.core.module.basket.provider

import org.finos.toolbox.time.Clock
import org.finos.vuu.core.module.basket.BasketModule.BasketColumnNames._
import org.finos.vuu.core.module.basket.csv.CsvStaticLoader
import org.finos.vuu.core.table.{DataTable, RowWithData}
import org.finos.vuu.provider.DefaultProvider

class BasketProvider(val table: DataTable)(implicit clock: Clock) extends DefaultProvider {
  def runOnce(): Unit = {
    val data = CsvStaticLoader.load

    data.foreach(id => {
      table.processUpdate(id, RowWithData(id, Map(
        Id -> id
      )), clock.now())
    })

  }


  override val lifecycleId: String = "org.finos.vuu.core.module.basket.provider.BasketProvider"
}
