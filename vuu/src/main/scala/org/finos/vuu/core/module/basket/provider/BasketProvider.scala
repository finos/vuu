package org.finos.vuu.core.module.basket.provider

import org.finos.vuu.core.table.DataTable
import org.finos.vuu.provider.DefaultProvider

class BasketProvider(val table: DataTable) extends DefaultProvider {

  override val lifecycleId: String = "org.finos.vuu.core.module.basket.provider.BasketProvider"
}
