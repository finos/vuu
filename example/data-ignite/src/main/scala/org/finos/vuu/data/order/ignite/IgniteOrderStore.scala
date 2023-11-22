package org.finos.vuu.data.order.ignite

import org.apache.ignite.{IgniteCache, Ignition}
import org.apache.ignite.cache.query.{IndexQuery, IndexQueryCriteriaBuilder}
import org.apache.ignite.cluster.ClusterState
import org.finos.vuu.data.order.{ChildOrder, OrderStore, ParentOrder}

import scala.collection.mutable
import scala.jdk.CollectionConverters.CollectionHasAsScala
import scala.jdk.javaapi.CollectionConverters.asJava

object IgniteOrderStore {

  /**
   * Creates an instance of IgniteOrderStore
   *
   * @param clientMode defines whether the node is a client or a server that is, if cluster node keeps cache data in current jvm or not
   * @return an instance of IgniteOrderStore
   */
  def apply(clientMode: Boolean = true, persistenceEnabled: Boolean = false):IgniteOrderStore = {
    IgniteLocalConfig.setPersistenceEnabled(persistenceEnabled)
    val config = IgniteLocalConfig.create(clientMode = clientMode)
    val ignite = Ignition.getOrStart(config)

    ignite.cluster().state(ClusterState.ACTIVE)

    val parentOrderCache = ignite.getOrCreateCache[Int, ParentOrder](IgniteLocalConfig.parentOrderCacheName)
    val childOrderCache = ignite.getOrCreateCache[Int, ChildOrder](IgniteLocalConfig.childOrderCacheName)

    new IgniteOrderStore(parentOrderCache, childOrderCache)
  }
}

class IgniteOrderStore(private val parentOrderCache: IgniteCache[Int, ParentOrder],
                       private val childOrderCache: IgniteCache[Int, ChildOrder]) extends OrderStore {


  def storeParentOrder(parentOrder: ParentOrder): Unit= {
    parentOrderCache.put(parentOrder.id, parentOrder)
  }

  def storeChildOrder(parentOrder: ParentOrder, childOrder: ChildOrder): Unit= {
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

  def findChildOrderByParentId(parentId: Int): Iterable[ChildOrder] = {
    val query: IndexQuery[Int, ChildOrder] = new IndexQuery[Int, ChildOrder](classOf[ChildOrder])

    val criterion = IndexQueryCriteriaBuilder.eq("parentId", parentId)
    query.setCriteria(criterion)
    childOrderCache.query(query)
      .getAll.asScala
      .map(x => x.getValue)
  }
}
