package org.finos.vuu.example.ignite

import org.apache.ignite.cache.query.IndexQueryCriteriaBuilder
import org.apache.ignite.{Ignite, IgniteCache}
import org.finos.vuu.core.module.simul.model.{ChildOrder, ParentOrder}
import org.scalatest.BeforeAndAfter
import org.scalatest.funsuite.AnyFunSuiteLike
import org.scalatest.matchers.should.Matchers

class IgniteOrderStoreTest extends AnyFunSuiteLike with BeforeAndAfter with Matchers {
  private var ignite: Ignite = _
  private var parentOrderCache: IgniteCache[Int, ParentOrder] = _
  private var childOrderCache: IgniteCache[Int, ChildOrder] = _
  private var orderStore: IgniteOrderStore = _

  private val emptySortQueries: String = ""
  private val emptyFilterQueries: String = ""

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

  test("Ignite Store And Find Window of Rows") {
    var parentOrder: ParentOrder = GivenParentOrder(1)
    parentOrder = GivenParentHasChildOrder(parentOrder, 1)
    parentOrder = GivenParentHasChildOrder(parentOrder, 2)
    parentOrder = GivenParentHasChildOrder(parentOrder, 3)

    val childOrder = orderStore.findWindow(1,1)
    assert(childOrder != null)
    assert(childOrder.size == 1)
    assert(childOrder.head.id == 2)
  }

  //https://ignite.apache.org/docs/latest/key-value-api/using-cache-queries#additional-filtering
  //https://ptupitsyn.github.io/Getting-Started-With-Apache-Ignite-Net-3-Sql/
  test("Ignite Store With Custom Index Query Filters") {
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

  test("Ignite Store With Custom Sql Filters") {
    var parentOrder: ParentOrder = GivenParentOrder(1)
    parentOrder = GivenParentHasChildOrder(parentOrder, 1)
    parentOrder = GivenParentHasChildOrder(parentOrder, 2)
    parentOrder = GivenParentHasChildOrder(parentOrder, 3)

    var parentOrder2: ParentOrder = GivenParentOrder(2)
    parentOrder2 = GivenParentHasChildOrder(parentOrder2, 4)
    parentOrder2 = GivenParentHasChildOrder(parentOrder2, 5)
    parentOrder2 = GivenParentHasChildOrder(parentOrder2, 6)

    val filterQueries = "parentId = 2"
    val childOrder = orderStore.findChildOrder(filterQueries, emptySortQueries, 2, 1)

    assert(childOrder != null)
    assert(childOrder.size == 2)
    assert(childOrder.head.id == 5)
    assert(childOrder.last.id == 6)
  }


  test("Ignite Store With Custom Sql Filters Include String") {
    var parentOrder: ParentOrder = GivenParentOrder(1)
    parentOrder = GivenParentHasChildOrder(parentOrder, 1)
    parentOrder = GivenParentHasChildOrder(parentOrder, 2)
    parentOrder = GivenParentHasChildOrder(parentOrder, 3)

    var parentOrder2: ParentOrder = GivenParentOrder(2)
    parentOrder2 = GivenParentHasChildOrder(parentOrder2, 4)
    parentOrder2 = GivenParentHasChildOrder(parentOrder2, 5)
    parentOrder2 = GivenParentHasChildOrder(parentOrder2, 6)

    val filterQueries = "ric = \'ric\'"
    val childOrder = orderStore.findChildOrder(filterQueries, emptySortQueries, 100, 0)

    assert(childOrder != null)
    assert(childOrder.size == 6)
  }

  test("Ignite Store With Empty Custom Sql Filters") {
    var parentOrder: ParentOrder = GivenParentOrder(1)
    parentOrder = GivenParentHasChildOrder(parentOrder, 1)

    var parentOrder2: ParentOrder = GivenParentOrder(2)
    parentOrder2 = GivenParentHasChildOrder(parentOrder2, 4)
    parentOrder2 = GivenParentHasChildOrder(parentOrder2, 5)

    val childOrder = orderStore.findChildOrder(emptyFilterQueries, emptySortQueries, 100, 0)

    assert(childOrder != null)
    assert(childOrder.size == 3)
  }

  test("Ignite Store With Custom Sql Sort Single Column") {
    var parentOrder: ParentOrder = GivenParentOrder(1)
    parentOrder = GivenParentHasChildOrder(parentOrder, 1)
    parentOrder = GivenParentHasChildOrder(parentOrder, 3)

    var parentOrder2: ParentOrder = GivenParentOrder(2)
    parentOrder2 = GivenParentHasChildOrder(parentOrder2, 2)

    val sortByValues = "parentId ASC"
    val childOrder = orderStore.findChildOrder(emptyFilterQueries, sortByValues, 100, 0)

    assert(childOrder != null)
    assert(childOrder.size == 3)
    childOrder.map(c => c.id).toArray shouldBe Array(1,3,2)
  }

  test("Ignite Store With Custom Sql Sort Multiple Columns") {
    var parentOrder: ParentOrder = GivenParentOrder(1)
    parentOrder = GivenParentHasChildOrder(parentOrder, 1)
    parentOrder = GivenParentHasChildOrder(parentOrder, 3)

    var parentOrder2: ParentOrder = GivenParentOrder(2)
    parentOrder2 = GivenParentHasChildOrder(parentOrder2, 2)

    val sortByValues = "parentId DESC, id ASC"
    val childOrder = orderStore.findChildOrder(emptyFilterQueries, sortByValues, 100, 0)

    assert(childOrder != null)
    assert(childOrder.size == 3)
    childOrder.map(c => c.id).toArray shouldBe Array(2, 1, 3)
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
