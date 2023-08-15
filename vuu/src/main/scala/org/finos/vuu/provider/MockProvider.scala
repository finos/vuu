package org.finos.vuu.provider

import com.typesafe.scalalogging.StrictLogging
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.Clock
import org.finos.vuu.core.table.RowWithData
import org.finos.vuu.feature.spec.table.DataTable

import java.util.concurrent.ConcurrentHashMap

class MockProvider(table: DataTable)(implicit timeProvider: Clock, lifecycle: LifecycleContainer) extends Provider with StrictLogging {

  lifecycle(this)

  private val subscriptionRequestsCount = new ConcurrentHashMap[String, Int]()

  def getSubRequestCount = subscriptionRequestsCount

  override def subscribe(key: String): Unit = {
    logger.info(s"[mockProvider.${table.getTableDef.name}] was asked to subscribe to $key")
    val count = subscriptionRequestsCount.getOrDefault(key, 0)
    subscriptionRequestsCount.put(key, count + 1)
  }

  def tick(key: String, row: Map[String, Any]) =
    table.processUpdate(key, new RowWithData(key, row), timeProvider.now())

  def delete(key: String) = {
    table.processDelete(key)
  }

  override def doStart(): Unit = {
    logger.info("Mock Provider - Starting")
  }

  override def doStop(): Unit = {
    logger.info("Mock Provider - Stopping")
  }

  override def doInitialize(): Unit = {}

  override def doDestroy(): Unit = {}

  override val lifecycleId: String = "mockProvider-" + table.name
}
