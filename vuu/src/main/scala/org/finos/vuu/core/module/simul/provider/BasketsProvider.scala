package org.finos.vuu.core.module.simul.provider

import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.Clock
import org.finos.vuu.core.table.DataTable
import org.finos.vuu.provider.Provider

class BasketsProvider(val table: DataTable)(implicit clock: Clock, lifecycleContainer: LifecycleContainer) extends Provider {

  lifecycleContainer(this)

  def processDelete() = {

  }

  def processUpsert() = {

  }

  override def subscribe(key: String): Unit = {}

  override def doStart(): Unit = {}

  override def doStop(): Unit = {}

  override def doInitialize(): Unit = {}

  override def doDestroy(): Unit = {}

  override val lifecycleId: String = "BasketsProvider"
}
