package org.finos.vuu.core.module.basket.provider

import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.vuu.core.table.{DataTable, RowWithData}
import org.finos.vuu.provider.DefaultProvider

class PriceStrategyProvider(val table: DataTable)(implicit lifecycle: LifecycleContainer) extends DefaultProvider{

  lifecycle(this)

  final val Strategies = List(
    (0, "Peg To Near Touch"),
    (1, "Far Touch"),
    (2, "Limit"),
    (3, "Algo"),
  )


  override def doStart(): Unit = {

    import org.finos.vuu.core.module.basket.BasketModule.{PriceStrategy => PS}

    Strategies.foreach {
      {
        case (id, text) =>
          table.processUpdate(id.toString, RowWithData(id.toString, Map(PS.Id -> id, PS.PriceStrategy -> text)))
      }
    }

  }

  override val lifecycleId: String = "org.finos.vuu.core.module.basket.provider.PriceStrategyProvider"
}
