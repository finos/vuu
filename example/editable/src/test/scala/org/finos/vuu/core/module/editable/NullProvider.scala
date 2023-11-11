package org.finos.vuu.core.module.editable

import org.finos.vuu.provider.Provider

class NullProvider extends Provider {
  override def subscribe(key: String): Unit = {}

  override def doStart(): Unit = {}

  override def doStop(): Unit = {}

  override def doInitialize(): Unit = {}

  override def doDestroy(): Unit = {}

  override val lifecycleId: String = "NullProvider"
}
