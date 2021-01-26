/**
 * Copyright Whitebox Software Ltd. 2014
 * All Rights Reserved.

 * Created by chris on 26/02/2014.

 */
package io.venuu.vuu.provider

import java.util.concurrent.ConcurrentHashMap

import com.typesafe.scalalogging.StrictLogging
import io.venuu.toolbox.lifecycle.LifecycleContainer
import io.venuu.toolbox.time.Clock
import io.venuu.vuu.core.table.{DataTable, RowWithData}

class MockProvider(table: DataTable)(implicit timeProvider: Clock, lifecycle: LifecycleContainer) extends Provider with StrictLogging{

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
