package org.finos.vuu.provider

import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.core.table.{DataTable, RowWithData}
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.Clock

import java.util.concurrent.ConcurrentHashMap

class MockProvider(table: DataTable)(implicit clock: Clock, lifecycle: LifecycleContainer) extends Provider with StrictLogging {

  lifecycle(this)

  private val subscriptionRequestsCount = new ConcurrentHashMap[String, Int]()

  def getSubRequestCount = subscriptionRequestsCount

  override def subscribe(key: String): Unit = {
    logger.debug(s"[mockProvider.${table.getTableDef.name}] was asked to subscribe to $key")
    val count = subscriptionRequestsCount.getOrDefault(key, 0)
    subscriptionRequestsCount.put(key, count + 1)
  }

  def tick(key: String, row: Map[String, Any]) =
    table.processUpdate(key, new RowWithData(key, row))

  def delete(key: String) = {
    table.processDelete(key)
  }

  override def doStart(): Unit = {
    logger.debug("Mock Provider - Starting")
  }

  override def doStop(): Unit = {
    logger.debug("Mock Provider - Stopping")
  }

  override def doInitialize(): Unit = {}

  override def doDestroy(): Unit = {}

  override val lifecycleId: String = "mockProvider-" + table.name
}
