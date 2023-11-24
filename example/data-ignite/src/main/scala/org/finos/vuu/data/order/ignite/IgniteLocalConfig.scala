package org.finos.vuu.data.order.ignite

import org.apache.ignite.cache.{QueryEntity, QueryIndex, QueryIndexType}
import org.apache.ignite.configuration.{CacheConfiguration, DataStorageConfiguration, IgniteConfiguration}
import org.finos.vuu.data.order.ChildOrder

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

    val fields = new java.util.LinkedHashMap[String, String]()
    fields.put("parentId", classOf[Int].getName)
    fields.put("id", classOf[Int].getName)
    fields.put("ric", classOf[String].getName)
    fields.put("price", classOf[Double].getName)
    fields.put("quantity", classOf[Int].getName)
    fields.put("side", classOf[String].getName)
    fields.put("account", classOf[String].getName)
    fields.put("strategy", classOf[String].getName)
    fields.put("exchange", classOf[String].getName)
    fields.put("ccy", classOf[String].getName)
    fields.put("volLimit", classOf[Double].getName)
    fields.put("filledQty", classOf[Int].getName)
    fields.put("openQty", classOf[Int].getName)
    fields.put("averagePrice", classOf[Double].getName)
    fields.put("status", classOf[String].getName)

    val indexes = new java.util.ArrayList[QueryIndex]()
    indexes.add(new QueryIndex(List("parentId").asJavaCollection, QueryIndexType.SORTED).setName("PARENTID_IDX"))
    indexes.add(new QueryIndex(List("id").asJavaCollection, QueryIndexType.SORTED).setName("CHILDID_IDX"))

    val queryEntity: QueryEntity = new QueryEntity(classOf[Int], classOf[ChildOrder])
      .setFields(fields)
      .setIndexes(indexes)
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
