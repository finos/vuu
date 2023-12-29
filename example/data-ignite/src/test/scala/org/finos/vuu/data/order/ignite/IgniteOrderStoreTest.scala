package org.finos.vuu.data.order.ignite

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
      orderStore.storeParentOrder(TestUtils.createParentOrder(1))

    val parentOrder = orderStore.findParentOrderById(1)

    assert(parentOrder != null)
    assert(parentOrder.id == 1)
  }

  test("Ignite Store And Find Child Order") {
    val parentOrder = TestUtils.createParentOrder(1)
    orderStore.storeParentOrder(parentOrder)
    orderStore.storeChildOrder(parentOrder, TestUtils.createChildOrder(1, 1))

    val childOrder = orderStore.findChildOrderByParentId(1)
    val persistedParentOrder  = orderStore.findParentOrderById(1)
    assert(childOrder != null)
    assert(persistedParentOrder != null)
    assert(persistedParentOrder.activeChildren == 1)
  }

  after {
    ignite.close()
  }
}
