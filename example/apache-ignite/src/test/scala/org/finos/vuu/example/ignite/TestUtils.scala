package org.finos.vuu.example.ignite

import org.apache.ignite.calcite.CalciteQueryEngineConfiguration
import org.apache.ignite.configuration.{IgniteConfiguration, SqlConfiguration}
import org.apache.ignite.{Ignite, Ignition}
import org.finos.vuu.core.module.simul.model.{ChildOrder, ParentOrder}
import org.finos.vuu.example.ignite.schema.ChildOrderEntityObject

import java.util
import scala.jdk.CollectionConverters.IterableHasAsJava

object TestUtils {
  def createChildOrder(
                        id: Int,
                        parentId: Int = 1,
                        ric: String = "ric",
                        price: Double = 1.22,
                        quantity: Int = 100,
                        side: String = "Buy",
                        account: String = "account",
                        ccy: String = "EUR"): ChildOrder = {
    ChildOrder(
      parentId = parentId,
      id = id,
      ric = ric,
      price = price,
      quantity = quantity,
      side = side,
      account = account,
      ccy = ccy,
      strategy = "",
      exchange = "",
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

    childOrderCacheConfiguration.setName("childOrderCache")

    childOrderCacheConfiguration.setQueryEntities(List(ChildOrderEntityObject.buildQueryEntity).asJavaCollection)
    igniteConfiguration.setCacheConfiguration(parentOrderCacheConfiguration, childOrderCacheConfiguration)

    val sqlConfiguration = new SqlConfiguration
    sqlConfiguration.setQueryEnginesConfiguration(new CalciteQueryEngineConfiguration().setDefault(true))
    igniteConfiguration.setSqlConfiguration(sqlConfiguration)

    Ignition.getOrStart(igniteConfiguration)
  }
}
