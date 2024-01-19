package org.finos.vuu.feature.ignite

import com.typesafe.scalalogging.StrictLogging
import org.apache.ignite.cache.{QueryEntity, QueryIndex, QueryIndexType}
import org.apache.ignite.{Ignite, IgniteCache, Ignition}
import org.apache.ignite.cache.query.{IndexQuery, IndexQueryCriteriaBuilder, IndexQueryCriterion, SqlFieldsQuery}
import org.apache.ignite.cluster.ClusterState
import org.apache.ignite.configuration.{CacheConfiguration, IgniteConfiguration}
import org.apache.ignite.lang.IgniteBiPredicate
import org.finos.vuu.data.order.ChildOrder

import java.util
import scala.collection.mutable
import scala.jdk.CollectionConverters._
import scala.reflect.ClassTag

object IgniteTestStore {
  val orderCacheName = "OrderCache"

  def apply(): IgniteTestStore = {
    val ignite = startIgniteServer()
    val orderCache = ignite.getOrCreateCache[Int, TestOrderEntity](orderCacheName)
    new IgniteTestStore(orderCache)
  }

  private def startIgniteServer(): Ignite = {
    val orderCacheConfiguration = createCacheConfiguration[TestOrderEntity](orderCacheName)

    val igniteConfiguration = new IgniteConfiguration()
    igniteConfiguration.setCacheConfiguration(orderCacheConfiguration)

    val ignite = Ignition.getOrStart(igniteConfiguration)
    ignite.cluster().state(ClusterState.ACTIVE)
    ignite
  }

  private def createCacheConfiguration[T](name: String)(implicit tag: ClassTag[T]): CacheConfiguration[Int, T] = {
    val orderCacheConfiguration = new CacheConfiguration[Int, T]
    orderCacheConfiguration.setName(name)

    val queryEntities = createEntitySchema()
    orderCacheConfiguration.setQueryEntities(queryEntities.asJavaCollection)
    //orderCacheConfiguration.setIndexedTypes(classOf[Int], tag.runtimeClass)

    orderCacheConfiguration
  }

  private def createEntitySchema(): List[QueryEntity] = {
    val fields = defineFields()
    val indexes = defineIndexes()

    val queryEntity: QueryEntity = new QueryEntity(classOf[Int], classOf[TestOrderEntity])
      .setFields(fields)
      .setIndexes(indexes)

    List(queryEntity)
  }

  private def defineFields() = {
    val fields = new util.LinkedHashMap[String, String]()
    fields.put("parentId", classOf[Int].getName)
    fields.put("id", classOf[Int].getName)
    fields.put("ric", classOf[String].getName)
    fields.put("price", classOf[Double].getName)
    fields.put("quantity", classOf[Int].getName)
    fields
  }

  private def defineIndexes() = {
    val indexes = new util.ArrayList[QueryIndex]()
    indexes.add(new QueryIndex(List("parentId").asJavaCollection, QueryIndexType.SORTED).setName("PARENTID_IDX"))
    indexes.add(new QueryIndex(List("id").asJavaCollection, QueryIndexType.SORTED).setName("ID_IDX"))
    indexes.add(new QueryIndex(List("ric").asJavaCollection, QueryIndexType.SORTED).setName("RIC_IDX"))
    indexes
  }
}
class IgniteTestStore (private val orderCache: IgniteCache[Int, TestOrderEntity]) extends StrictLogging {

  def save(order: TestOrderEntity): Unit =
    orderCache.put(order.id, order)

  def get(key: Int): TestOrderEntity =
    orderCache.get(key)

  def getFilteredBy(filterQueryCriteria: List[IndexQueryCriterion]): Iterable[TestOrderEntity] = {
    //  val filter: IgniteBiPredicate[Int, TestOrder]  = (key, p) => p.filledQty > 0
    val query: IndexQuery[Int, TestOrderEntity] =
      new IndexQuery[Int, TestOrderEntity](classOf[TestOrderEntity])
        .setCriteria(filterQueryCriteria.asJava)
    // .setFilter(filter)

    orderCache
      .query(query)
      .getAll.asScala
      .map(x => x.getValue)
  }

  def getFilteredBy(sqlFilterClause: String): Iterable[TestOrderEntity] = {

    val whereClause = if (sqlFilterClause == null || sqlFilterClause.isEmpty) "" else s" where $sqlFilterClause"
    val value = s"select * from TestOrderEntity$whereClause"

    logger.info("Querying ignite for "+ value)
    val query = new SqlFieldsQuery(value)

    val results = orderCache.query(query)

    var counter = 0
    val buffer = mutable.ListBuffer[TestOrderEntity]()
    results.forEach(item => {
      buffer.addOne(TestOrderEntity.createFrom(item))
      counter += 1
    })

    buffer
  }
}
