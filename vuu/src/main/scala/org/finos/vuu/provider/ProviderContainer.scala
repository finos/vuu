package org.finos.vuu.provider

import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.core.table.DataTable
import org.finos.toolbox.lifecycle.{LifecycleContainer, LifecycleEnabled}

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
    logger.debug("[PROVIDERS] Starting....")
  }

  override def doStop(): Unit = {
    logger.debug("[PROVIDERS] Stopping....")
  }

  override def doInitialize(): Unit = {
    logger.debug("[PROVIDERS] INITIALIZING....")
  }

  override def doDestroy(): Unit = {
    logger.debug("[PROVIDERS] DESTROYING....")
  }

  override val lifecycleId: String = "providerContainer"
}
