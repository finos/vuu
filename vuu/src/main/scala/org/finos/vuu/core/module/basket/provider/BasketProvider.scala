package org.finos.vuu.core.module.basket.provider

import org.finos.toolbox.time.Clock
import org.finos.vuu.core.table.DataTable
import org.finos.vuu.provider.DefaultProvider

class BasketProvider(val table: DataTable)(implicit clock: Clock) extends DefaultProvider {

  override val lifecycleId: String = "org.finos.vuu.core.module.basket.provider.BasketProvider"
}
