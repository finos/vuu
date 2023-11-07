package org.finos.vuu.core.module.basket.provider

import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.thread.RunOnceLifeCycleRunner
import org.finos.toolbox.time.Clock
import org.finos.vuu.core.module.basket.BasketModule.BasketColumnNames._
import org.finos.vuu.core.module.basket.csv.CsvStaticLoader
import org.finos.vuu.core.table.{DataTable, RowWithData}
import org.finos.vuu.provider.DefaultProvider

class BasketProvider(val table: DataTable)(implicit lifecycle: LifecycleContainer, clock: Clock) extends DefaultProvider {

  private val runner = new RunOnceLifeCycleRunner("BasketProvider", runOnce)

  lifecycle(this).dependsOn(runner)
  def runOnce(): Unit = {
    val data = CsvStaticLoader.load

    data.foreach(id => {
      table.processUpdate(id, RowWithData(id, Map(
        Id -> id,
        Name -> id
      )), clock.now())
    })
  }


  override val lifecycleId: String = "org.finos.vuu.core.module.basket.provider.BasketProvider"
}
