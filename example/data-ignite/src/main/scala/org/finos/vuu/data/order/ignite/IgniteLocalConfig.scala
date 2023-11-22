package org.finos.vuu.data.order.ignite

import org.apache.ignite.configuration.{CacheConfiguration, DataStorageConfiguration, IgniteConfiguration}

import java.util.concurrent.atomic.AtomicBoolean


object IgniteLocalConfig {
  val parentOrderCacheName = "ParentOrders"
  val childOrderCacheName = "ChildOrders"
  private val persistenceEnabled = new AtomicBoolean()
  def create(clientMode: Boolean): IgniteConfiguration = {
    val cfg = new IgniteConfiguration()

    cfg.setClientMode(clientMode)
    cfg.setPeerClassLoadingEnabled(true)

    cfg.setCacheConfiguration(
      createCacheConfig(parentOrderCacheName),
      createCacheConfig(childOrderCacheName)
    )

    cfg.setDataStorageConfiguration(
      createDataStorageConfig()
    )

    cfg
  }

  def setPersistenceEnabled(enabled: Boolean): Unit = {
    persistenceEnabled.set(enabled)
  }
  private def createCacheConfig(name: String): CacheConfiguration[?, ?] = {
    val cacheConfiguration = new CacheConfiguration()
    cacheConfiguration.setName(name)
  }

  private def createDataStorageConfig(): DataStorageConfiguration= {
    val storageConfiguration = new DataStorageConfiguration()

    storageConfiguration.getDefaultDataRegionConfiguration.setPersistenceEnabled(persistenceEnabled.get())

    storageConfiguration
  }
}
