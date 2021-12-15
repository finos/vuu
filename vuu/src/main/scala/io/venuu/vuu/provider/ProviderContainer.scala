/**
 * Copyright Whitebox Software Ltd. 2014
 * All Rights Reserved.
 *
 * Created by chris on 15/12/14.
 *
 */
package io.venuu.vuu.provider

import com.typesafe.scalalogging.StrictLogging
import io.venuu.toolbox.lifecycle.{LifecycleContainer, LifecycleEnabled}
import io.venuu.vuu.core.table.DataTable

import java.util.concurrent.ConcurrentHashMap

class ProviderContainer(joinTableProvider: JoinTableProvider)(implicit lifecycle: LifecycleContainer) extends LifecycleEnabled with StrictLogging {

  private val providersByTable = new ConcurrentHashMap[String, (DataTable, Provider)]()

  lifecycle(this)

  def getProviderForTable(tableName: String): Option[Provider] = {
    val (table, provider) = providersByTable.get(tableName)
    Some(provider)
  }

  def add(table: DataTable, provider: Provider) = {
    if (providersByTable.contains(table.name))
      throw new Exception(s"provider already exists for table ${table.name}")

    providersByTable.put(table.name, (table, provider))

    lifecycle(this).dependsOn(provider)
    lifecycle(provider).dependsOn(joinTableProvider)
  }

  override def doStart(): Unit = {
    logger.info("[PROVIDERS] Starting....")
  }

  override def doStop(): Unit = {
    logger.info("[PROVIDERS] Stopping....")
  }

  override def doInitialize(): Unit = {
    logger.info("[PROVIDERS] INITIALIZING....")
  }

  override def doDestroy(): Unit = {
    logger.info("[PROVIDERS] DESTROYING....")
  }

  override val lifecycleId: String = "providerContainer"
}
