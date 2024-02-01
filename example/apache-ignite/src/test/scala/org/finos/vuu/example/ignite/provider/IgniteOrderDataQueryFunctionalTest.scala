package org.finos.vuu.example.ignite.provider

import org.apache.ignite.IgniteCache
import org.finos.vuu.core.module.simul.model.{ChildOrder, ParentOrder}
import org.finos.vuu.core.sort.SortDirection
import org.finos.vuu.example.ignite.module.IgniteOrderDataModule
import org.finos.vuu.example.ignite.{IgniteOrderStore, TestUtils}
import org.finos.vuu.net.FilterSpec
import org.scalatest.funsuite.AnyFunSuiteLike
import org.scalatest.matchers.should.Matchers

class IgniteOrderDataQueryFunctionalTest extends AnyFunSuiteLike with Matchers {

  private val ignite = TestUtils.setupIgnite()
  private val parentOrderCache: IgniteCache[Int, ParentOrder] = ignite.getOrCreateCache("parentOrderCache")
  private val childOrderCache: IgniteCache[Int, ChildOrder] = ignite.getOrCreateCache("childOrderCache")
  private val orderStore = new IgniteOrderStore(parentOrderCache, childOrderCache)
  private val dataQuery = IgniteOrderDataQuery(orderStore, IgniteOrderDataModule.schemaMapper)

  test("Can parse and apply filtering and sorting when fetching") {
    val testOrder1 = TestUtils.createChildOrder(1, ric = "ABC.HK", price = 5.55)
    val testOrder2 = TestUtils.createChildOrder(2, ric = "ABC.LDN", price = 6.0)
    val testOrder3 = TestUtils.createChildOrder(3, ric = "ABC.NY", price = 4.5)
    givenChildOrdersExist(testOrder1, testOrder2, testOrder3)

    val filterSpec = FilterSpec("orderId > 1 and ric starts \"ABC\"")
    val sortSpec = Map("price" -> SortDirection.Ascending)

    val res = dataQuery.fetch(filterSpec, sortSpec, startIndex = 0, rowCount = 3)

    res.toList shouldEqual List(testOrder3, testOrder2)
  }

  private def givenChildOrdersExist(childOrders: ChildOrder*): Unit = {
    val parentOrder = TestUtils.createParentOrder(1)
    childOrders.foreach(o => orderStore.storeChildOrder(parentOrder, o))
  }
}
