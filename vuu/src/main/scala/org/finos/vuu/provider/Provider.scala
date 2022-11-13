package org.finos.vuu.provider

import org.finos.toolbox.lifecycle.LifecycleEnabled

class NullProvider extends Provider {
  override def subscribe(key: String): Unit = {}

  override def doStart(): Unit = {}

  override def doStop(): Unit = {}

  override def doInitialize(): Unit = {}

  override def doDestroy(): Unit = {}

  override val lifecycleId: String = "NullProvider"
}

trait Provider extends LifecycleEnabled {

  def subscribe(key: String): Unit

  //def processUpdate(key: String, data: Map[String, Any])
  //def processDelete(key: String, data: Map[String, Any])

}
