package org.finos.vuu.example.ignite

import org.apache.ignite.configuration.{CacheConfiguration, DataStorageConfiguration, IgniteConfiguration}
import org.finos.vuu.example.ignite.schema.IgniteChildOrderEntity

import java.nio.file.Paths
import java.util.concurrent.atomic.AtomicBoolean
import scala.jdk.CollectionConverters.IterableHasAsJava

object IgniteLocalConfig {
  val parentOrderCacheName = "ParentOrders"
  val childOrderCacheName = "ChildOrders"
  private val persistenceEnabled = new AtomicBoolean()

  def create(clientMode: Boolean): IgniteConfiguration = {
    val cfg = new IgniteConfiguration()

    cfg.setClientMode(clientMode)
    cfg.setPeerClassLoadingEnabled(true)
    cfg.setWorkDirectory(Paths.get("./target/ignite").toFile.getAbsolutePath)

    cfg.setCacheConfiguration(
      createParentOrderCacheConfig(),
      createChildOrderCacheConfig()
    )

    cfg.setDataStorageConfiguration(
      createDataStorageConfig()
    )

    cfg
  }

  def setPersistenceEnabled(enabled: Boolean): Unit = {
    persistenceEnabled.set(enabled)
  }

  private def createChildOrderCacheConfig(): CacheConfiguration[?, ?] = {
    val cacheConfiguration = new CacheConfiguration()

    val queryEntity = IgniteChildOrderEntity.buildQueryEntity
    cacheConfiguration.setQueryEntities(List(queryEntity).asJavaCollection)
    cacheConfiguration.setName(childOrderCacheName)
  }

  private def createParentOrderCacheConfig(): CacheConfiguration[?, ?] = {
    val cacheConfiguration = new CacheConfiguration()
    cacheConfiguration.setName(parentOrderCacheName)
  }

  private def createDataStorageConfig(): DataStorageConfiguration = {
    val storageConfiguration = new DataStorageConfiguration()

    storageConfiguration.getDefaultDataRegionConfiguration.setPersistenceEnabled(persistenceEnabled.get())

    storageConfiguration
  }
}
