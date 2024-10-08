package org.finos.vuu.example.ignite

import com.typesafe.scalalogging.StrictLogging
import org.apache.ignite.cache.CachePeekMode
import org.apache.ignite.cache.query._
import org.apache.ignite.cluster.ClusterState
import org.apache.ignite.{IgniteCache, Ignition}
import org.finos.vuu.core.module.simul.model.{ChildOrder, OrderStore, ParentOrder}
import org.finos.vuu.example.ignite.schema.ChildOrderSchema.toChildOrder
import org.finos.vuu.feature.ignite.IgniteSqlQuery
import org.finos.vuu.feature.ignite.IgniteSqlQuery.QuerySeparator

import java.util
import scala.collection.mutable
import scala.collection.mutable.ListBuffer
import scala.jdk.CollectionConverters._
import scala.jdk.javaapi.CollectionConverters.asJava

object IgniteOrderStore {

  /**
   * Creates an instance of IgniteOrderStore
   *
   * @param clientMode defines whether the node is a client or a server that is, if cluster node keeps cache data in current jvm or not
   * @return an instance of IgniteOrderStore
   */
  def apply(clientMode: Boolean = true, persistenceEnabled: Boolean = false): IgniteOrderStore = {
    val config = IgniteLocalConfig.create(clientMode = clientMode, persistenceEnabled = persistenceEnabled)
    val ignite = Ignition.getOrStart(config.igniteConfiguration())

    ignite.cluster().state(ClusterState.ACTIVE)

    val parentOrderCache = ignite.getOrCreateCache[Int, ParentOrder](IgniteLocalConfig.parentOrderCacheName)
    val childOrderCache = ignite.getOrCreateCache[Int, ChildOrder](IgniteLocalConfig.childOrderCacheName)

    new IgniteOrderStore(parentOrderCache, childOrderCache)
  }
}

class IgniteOrderStore(private val parentOrderCache: IgniteCache[Int, ParentOrder],
                       private val childOrderCache: IgniteCache[Int, ChildOrder]) extends OrderStore with StrictLogging {

  def storeParentOrder(parentOrder: ParentOrder): Unit = {
    parentOrderCache.put(parentOrder.id, parentOrder)
  }

  def storeChildOrder(parentOrder: ParentOrder, childOrder: ChildOrder): Unit = {
    storeParentOrder(parentOrder)
    childOrderCache.put(childOrder.id, childOrder)
  }

  def storeParentOrderWithChildren(parentOrder: ParentOrder, childOrders: Iterable[ChildOrder]): Unit = {
    storeParentOrder(parentOrder)

    val localCache = mutable.Map.empty[Int, ChildOrder]
    childOrders.foreach(order => localCache(order.id) = order)

    childOrderCache.putAll(asJava(localCache))
  }

  def findParentOrderById(id: Int): ParentOrder = {
    parentOrderCache.get(id)
  }

  def getDistinct(columnName: String, rowCount: Int): Iterable[String] = {
    val query = new SqlFieldsQuery(s"select distinct $columnName from ChildOrder limit ?")
    query.setArgs(rowCount)

    val results = childOrderCache.query(query)

    val (counter, buffer) = mapToString(results)

    logger.debug(s"Loaded Distinct Ignite ChildOrder column $columnName for $counter rows")

    buffer
  }

  def getDistinct(columnName: String, startsWith: String, rowCount: Int): Iterable[String] = {
    val query = new SqlFieldsQuery(s"select distinct $columnName from ChildOrder where $columnName LIKE \'$startsWith%\' limit ?")
    query.setArgs(rowCount)
    logger.debug(query.getSql)
    val results = childOrderCache.query(query)

    val (counter, buffer) = mapToString(results)

    logger.debug(s"Loaded Distinct Ignite ChildOrder column $columnName that starts with $startsWith for $counter rows")

    buffer

  }

  def getCount(filterSql: IgniteSqlQuery): Long = {
    //todo should this be COUNT_BIG?
    val whereClause = if (filterSql.isEmpty) filterSql else filterSql.prependSql("WHERE", QuerySeparator.SPACE)
    val query = IgniteSqlQuery("SELECT COUNT(1) FROM ChildOrder").appendQuery(whereClause, QuerySeparator.SPACE)

    val cursor = childOrderCache.query(query.buildFieldsQuery())
    val countValue = cursor.getAll.get(0).get(0)
    val totalCount = countValue.asInstanceOf[Long]

    logger.debug(s"Ignite returned total count of `$totalCount` for ChildOrder with filter `$filterSql`")
    totalCount
  }

  def findChildOrder(filterSql: IgniteSqlQuery, sortSql: IgniteSqlQuery, rowCount: Int, startIndex: Long): Iterator[ChildOrder] = {
    val whereClause = if (filterSql.isEmpty) filterSql else filterSql.prependSql("WHERE", QuerySeparator.SPACE)
    val orderByClause = if (sortSql.isEmpty) IgniteSqlQuery("ORDER BY id") else sortSql.prependSql("ORDER BY", QuerySeparator.SPACE)
    val limitAndOffsetClause = IgniteSqlQuery("limit ? offset ?", List(rowCount, startIndex))

    val query = IgniteSqlQuery("SELECT * FROM ChildOrder")
      .appendQuery(whereClause, QuerySeparator.SPACE)
      .appendQuery(orderByClause, QuerySeparator.SPACE)
      .appendQuery(limitAndOffsetClause, QuerySeparator.SPACE)

    val results = childOrderCache.query(query.buildFieldsQuery()).asScala.iterator.map(i => toChildOrder(i.asScala.toList))
    logger.debug(s"Loaded Ignite ChildOrder for $rowCount rows, from index : $startIndex with " +
      s"WHERE CLAUSE: `$whereClause` | ORDER BY CLAUSE: `$orderByClause`")

    results
  }

  def findChildOrderFilteredBy(filterQueryCriteria: List[IndexQueryCriterion]): Iterable[ChildOrder] = {
  //  val filter: IgniteBiPredicate[Int, ChildOrder]  = (key, p) => p.openQty > 0

    val query: IndexQuery[Int, ChildOrder] =
      new IndexQuery[Int, ChildOrder](classOf[ChildOrder])
        .setCriteria(filterQueryCriteria.asJava)
       // .setFilter(filter)

    childOrderCache
      .query(query)
      .getAll.asScala
      .map(x => x.getValue)
  }

  def findChildOrderByParentId(parentId: Int): Iterable[ChildOrder] = {
    val query: IndexQuery[Int, ChildOrder] = new IndexQuery[Int, ChildOrder](classOf[ChildOrder])

    val criterion = IndexQueryCriteriaBuilder.eq("parentId", parentId)
    query.setCriteria(criterion)
    childOrderCache.query(query)
      .getAll.asScala
      .map(x => x.getValue)
  }

  private def mapToString(results: FieldsQueryCursor[util.List[_]]): (Int, ListBuffer[String]) = {
    var counter = 0
    val buffer = mutable.ListBuffer[String]()
    results.forEach(row => {
      buffer.addOne(row.get(0).asInstanceOf[String])
      counter += 1
    })
    (counter, buffer)
  }

  def childOrderCount(): Long = {
    val cacheSize = childOrderCache.sizeLong(CachePeekMode.ALL)
    logger.debug(s"Ignite Child order has cache size of $cacheSize")
    cacheSize
  }

  def findWindow(startIndex: Long, rowCount: Int): Iterable[ChildOrder] = {
    val query = new SqlFieldsQuery(s"select * from ChildOrder order by id limit ? offset ?")
    query.setArgs(rowCount, startIndex)
 //   val query = new SqlFieldsQuery(s"select * from ChildOrder")
    val results = childOrderCache.query(query)

    val buffer = mutable.ListBuffer[ChildOrder]()
    results.forEach(item => buffer.addOne(toChildOrder(item.asScala.toList)))

    logger.debug(s"Loaded ${buffer.length} rows, from index : $startIndex, rowCou")

    buffer
  }
}
