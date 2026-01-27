package org.finos.vuu.core.module.basket.provider

import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.thread.RunOnceLifeCycleRunner
import org.finos.toolbox.time.Clock
import org.finos.vuu.core.module.basket.BasketModule.BasketColumnNames._
import org.finos.vuu.core.module.basket.csv.BasketLoader
import org.finos.vuu.core.table.{DataTable, RowWithData}
import org.finos.vuu.provider.DefaultProvider

class BasketProvider(val table: DataTable)(implicit lifecycle: LifecycleContainer, clock: Clock) extends DefaultProvider {

  private val runner = new RunOnceLifeCycleRunner("BasketProvider", runOnce)
  private val basketLoader = new BasketLoader()

  private val idColumn = table.columnForName(Id)
  private val nameColumn = table.columnForName(Name)

  lifecycle(this).dependsOn(runner)
  def runOnce(): Unit = {
    val data = basketLoader.loadBasketIds()

    //reuse of the builder...
    val builder = table.rowBuilder

    data.foreach(id => {
      table.processUpdate(id, builder.setKey(id)
        .setString(idColumn, id)
        .setString(nameColumn, id)
        //as row clears out the data from the builder
        .build)
    })
  }
  override val lifecycleId: String = "org.finos.vuu.core.module.basket.provider.BasketProvider"
}
