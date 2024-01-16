package org.finos.vuu.feature.ignite

import com.typesafe.scalalogging.StrictLogging
import org.apache.ignite.cache.{QueryEntity, QueryIndex, QueryIndexType}
import org.apache.ignite.{Ignite, IgniteCache, Ignition}
import org.apache.ignite.cache.query.{IndexQuery, IndexQueryCriteriaBuilder, IndexQueryCriterion}
import org.apache.ignite.cluster.ClusterState
import org.apache.ignite.configuration.{CacheConfiguration, IgniteConfiguration}
import org.apache.ignite.lang.IgniteBiPredicate

import java.util
import scala.jdk.CollectionConverters._
import scala.reflect.ClassTag

object IgniteTestStore {
  val orderCacheName = "OrderCache"

  def apply(): IgniteTestStore = {
    val ignite = startIgniteServer()
    val orderCache = ignite.getOrCreateCache[Int, TestOrder](orderCacheName)
    new IgniteTestStore(orderCache)
  }

  private def startIgniteServer(): Ignite = {
    val orderCacheConfiguration = createCacheConfiguration[TestOrder](orderCacheName)

    val igniteConfiguration = new IgniteConfiguration()
    igniteConfiguration.setCacheConfiguration(orderCacheConfiguration)

    val ignite = Ignition.getOrStart(igniteConfiguration)
    ignite.cluster().state(ClusterState.ACTIVE)
    ignite
  }

  private def createCacheConfiguration[T](name: String)(implicit tag: ClassTag[T]): CacheConfiguration[Int, T] = {
    val orderCacheConfiguration = new CacheConfiguration[Int, T]
    orderCacheConfiguration.setName(name)

    val queryEntities = createIndexes()
    orderCacheConfiguration.setQueryEntities(queryEntities.asJavaCollection)
    //orderCacheConfiguration.setIndexedTypes(classOf[Int], tag.runtimeClass)

    orderCacheConfiguration
  }

  private def createIndexes(): List[QueryEntity] = {
    val fields = new util.LinkedHashMap[String, String]()
    fields.put("parentId", classOf[Int].getName)
    fields.put("ric", classOf[String].getName)

    val indexes = new util.ArrayList[QueryIndex]()
    indexes.add(new QueryIndex(List("parentId").asJavaCollection, QueryIndexType.SORTED).setName("PARENTID_IDX"))
    indexes.add(new QueryIndex(List("ric").asJavaCollection, QueryIndexType.SORTED).setName("RIC_IDX"))

    val queryEntity: QueryEntity = new QueryEntity(classOf[Int], classOf[TestOrder])
      .setFields(fields)
      .setIndexes(indexes)

    List(queryEntity)
  }
}
class IgniteTestStore (private val orderCache: IgniteCache[Int, TestOrder]) extends StrictLogging {

  def save(order: TestOrder): Unit =
    orderCache.put(order.id, order)

  def get(key: Int): TestOrder =
    orderCache.get(key)

  def getFilteredBy(filterQueryCriteria: List[IndexQueryCriterion]): Iterable[TestOrder] = {
    //  val filter: IgniteBiPredicate[Int, TestOrder]  = (key, p) => p.filledQty > 0
    val query: IndexQuery[Int, TestOrder] =
      new IndexQuery[Int, TestOrder](classOf[TestOrder])
        .setCriteria(filterQueryCriteria.asJava)
    // .setFilter(filter)

    orderCache
      .query(query)
      .getAll.asScala
      .map(x => x.getValue)
  }
}
