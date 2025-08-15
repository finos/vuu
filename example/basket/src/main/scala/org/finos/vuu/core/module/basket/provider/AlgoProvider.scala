package org.finos.vuu.core.module.basket.provider

import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.Clock
import org.finos.vuu.core.table.{DataTable, RowWithData}
import org.finos.vuu.provider.DefaultProvider

class AlgoProvider(val table: DataTable)(implicit lifecycle: LifecycleContainer, clock: Clock) extends DefaultProvider{

  lifecycle(this)

  private final val Algos = List(
    (-1, "None"),
    (1, "Sniper"),
    (2, "Dark Liquidity"),
    (3, "VWAP"),
    (4, "POV"),
    (5, "Dynamic CLose"),
  )

  override def doStart(): Unit = {

    import org.finos.vuu.core.module.basket.BasketModule.{Algo => PS}

    Algos.foreach {
      {
        case (id, text) =>
          table.processUpdate(id.toString, RowWithData(id.toString, Map(PS.Id -> id, PS.AlgoType -> text)))
      }
    }

  }

  override val lifecycleId: String = "org.finos.vuu.core.module.basket.provider.AlgoProvider"
}
