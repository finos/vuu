package org.finos.vuu.data.order.ignite

import org.apache.ignite.cache.{QueryEntity, QueryIndex, QueryIndexType}
import org.apache.ignite.calcite.CalciteQueryEngineConfiguration
import org.apache.ignite.configuration.{IgniteConfiguration, SqlConfiguration}
import org.apache.ignite.{Ignite, Ignition}
import org.finos.vuu.data.order.{ChildOrder, ParentOrder}

import java.util
import scala.jdk.CollectionConverters.IterableHasAsJava

object TestUtils {
  def createChildOrder(parentId: Int, id: Int): ChildOrder = {
    ChildOrder(parentId = parentId,
      id = id,
      ric = "ric",
      price = 1.22,
      quantity = 100,
      side = "Buy",
      account = "account",
      strategy = "",
      exchange = "",
      ccy = "EUR",
      volLimit = 100,
      filledQty = 0,
      openQty = 100,
      averagePrice = 0,
      status = "New"
    )
  }

  def createParentOrder(id: Int): ParentOrder = {
    ParentOrder(id = id,
      ric = "ric",
      price = 1.0,
      quantity = 1,
      side = "Buy",
      account = "account",
      exchange = "exchange",
      ccy = "EUR",
      algo = "Sniper",
      volLimit = 1.0,
      filledQty = 1,
      openQty = 1,
      averagePrice = 0,
      status = "New",
      remainingQty = 100,
      activeChildren = 0)
  }

  def setupIgnite(): Ignite = {
    val igniteConfiguration = new IgniteConfiguration()

    val parentOrderCacheConfiguration = new org.apache.ignite.configuration.CacheConfiguration[Int, ParentOrder]
    val childOrderCacheConfiguration = new org.apache.ignite.configuration.CacheConfiguration[Int, ChildOrder]

    parentOrderCacheConfiguration.setIndexedTypes(classOf[Int], classOf[ParentOrder])
    parentOrderCacheConfiguration.setName("parentOrderCache")

    //childOrderCacheConfiguration.setIndexedTypes(classOf[Int], classOf[ChildOrder])
    childOrderCacheConfiguration.setName("childOrderCache")

    val fields = new util.LinkedHashMap[String, String]()
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

    val indexes = new util.ArrayList[QueryIndex]()
    indexes.add(new QueryIndex(List("id").asJavaCollection, QueryIndexType.SORTED).setName("ID_IDX"))
    indexes.add(new QueryIndex(List("parentId").asJavaCollection, QueryIndexType.SORTED).setName("PARENTID_IDX"))

    val queryEntity: QueryEntity = new QueryEntity(classOf[Int], classOf[ChildOrder])
      .setFields(fields)
      .setIndexes(indexes)

    childOrderCacheConfiguration.setQueryEntities(List(queryEntity).asJavaCollection)
    igniteConfiguration.setCacheConfiguration(parentOrderCacheConfiguration, childOrderCacheConfiguration)

    val sqlConfiguration = new SqlConfiguration
    sqlConfiguration.setQueryEnginesConfiguration(new CalciteQueryEngineConfiguration().setDefault(true))
    igniteConfiguration.setSqlConfiguration(sqlConfiguration)

    Ignition.getOrStart(igniteConfiguration)
  }
}
