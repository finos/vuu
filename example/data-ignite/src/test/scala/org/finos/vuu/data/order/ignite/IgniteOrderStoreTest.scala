package org.finos.vuu.data.order.ignite

import org.apache.ignite.cache.query.IndexQueryCriteriaBuilder
import org.apache.ignite.{Ignite, IgniteCache}
import org.finos.vuu.data.order.{ChildOrder, ParentOrder}
import org.scalatest.BeforeAndAfter
import org.scalatest.funsuite.AnyFunSuiteLike

class IgniteOrderStoreTest extends AnyFunSuiteLike with BeforeAndAfter {
  private var ignite: Ignite = _
  private var parentOrderCache: IgniteCache[Int, ParentOrder] = _
  private var childOrderCache: IgniteCache[Int, ChildOrder] = _
  private var orderStore: IgniteOrderStore = _

  before {
    ignite = TestUtils.setupIgnite()
    parentOrderCache = ignite.getOrCreateCache("parentOrderCache")
    childOrderCache = ignite.getOrCreateCache("childOrderCache")
    orderStore = new IgniteOrderStore(parentOrderCache, childOrderCache)
  }

  test("Ignite Store And Find Order") {
    GivenParentOrder(1)

    val parentOrder = orderStore.findParentOrderById(1)

    assert(parentOrder != null)
    assert(parentOrder.id == 1)
  }

  test("Ignite Store And Find Child Order") {
    val parentOrder: ParentOrder = GivenParentOrder(1)
    GivenParentHasChildOrder(parentOrder, 1)

    val childOrder = orderStore.findChildOrderByParentId(1)
    val persistedParentOrder  = orderStore.findParentOrderById(1)
    assert(childOrder != null)
    assert(persistedParentOrder != null)
    assert(persistedParentOrder.activeChildren == 1)
  }

  //https://ignite.apache.org/docs/latest/key-value-api/using-cache-queries#additional-filtering
  //https://ptupitsyn.github.io/Getting-Started-With-Apache-Ignite-Net-3-Sql/
  test("Ignite Store with custom filters") {
    var parentOrder: ParentOrder = GivenParentOrder(1)
    parentOrder = GivenParentHasChildOrder(parentOrder, 1)
    parentOrder = GivenParentHasChildOrder(parentOrder, 2)

    // "Order where parentID = parentValue or second = something"
    // "Order where parentID = parentValue and second = something OR (foo = bar and chris = true)"
    val filterQueries = List(
      IndexQueryCriteriaBuilder.eq("parentId", 1),
    )

    val childOrder = orderStore.findChildOrderFilteredBy(filterQueries)
    val persistedParentOrder = orderStore.findParentOrderById(1)

    assert(childOrder != null)
    assert(childOrder.size == 2)
    assert(persistedParentOrder != null)
    assert(persistedParentOrder.activeChildren == 2)
  }

  private def GivenParentOrder(parentOrderId: Int): ParentOrder = {
    val parentOrder = TestUtils.createParentOrder(parentOrderId)
    orderStore.storeParentOrder(parentOrder)
    parentOrder
  }

  private def GivenParentHasChildOrder(parentOrder: ParentOrder, childOrderId: Int): ParentOrder = {
    val updatedParentOrder = parentOrder.copy(activeChildren = parentOrder.activeChildren + 1)
    orderStore.storeChildOrder(
      updatedParentOrder,
      TestUtils.createChildOrder(parentOrder.id, childOrderId))
    updatedParentOrder
  }

  after {
    ignite.close()
  }
}
