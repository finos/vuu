package org.finos.vuu.example.ignite.provider

import org.apache.ignite.Ignite
import org.finos.vuu.core.module.simul.model.{ChildOrder, ParentOrder}
import org.finos.vuu.core.sort.SortDirection
import org.finos.vuu.example.ignite.module.IgniteOrderDataModule
import org.finos.vuu.example.ignite.schema.ChildOrderSchema
import org.finos.vuu.example.ignite.{IgniteOrderStore, TestUtils}
import org.finos.vuu.net.{FilterSpec, SortDef, SortSpec}
import org.finos.vuu.util.schema.SchemaMapperBuilder
import org.scalatest.funsuite.AnyFunSuiteLike
import org.scalatest.matchers.should.Matchers
import org.scalatest.BeforeAndAfterAll

class IgniteOrderDataQueryFunctionalTest extends AnyFunSuiteLike with BeforeAndAfterAll with Matchers {
  private val schemaMapper = SchemaMapperBuilder(ChildOrderSchema.schema, IgniteOrderDataModule.columns)
    .withFieldsMap(IgniteOrderDataProvider.columnNameByExternalField)
    .build()
  private var ignite: Ignite = _
  private var orderStore: IgniteOrderStore = _
  private var dataQuery: IgniteOrderDataQuery = _

  override def beforeAll(): Unit = {
    ignite = TestUtils.setupIgnite(testName = this.toString)
    val parentOrderCache = ignite.getOrCreateCache[Int, ParentOrder]("parentOrderCache")
    val childOrderCache = ignite.getOrCreateCache[Int, ChildOrder]("childOrderCache")
    orderStore = new IgniteOrderStore(parentOrderCache, childOrderCache)
    dataQuery = IgniteOrderDataQuery(orderStore, schemaMapper)
  }

  override def afterAll(): Unit = {
    ignite.close()
  }

  test("Can parse and apply filters and sort when fetching") {
    val testOrder1 = TestUtils.createChildOrder(1, ric = "ABC.HK", price = 5.55)
    val testOrder2 = TestUtils.createChildOrder(2, ric = "ABC.LDN", price = 6.0)
    val testOrder3 = TestUtils.createChildOrder(3, ric = "ABC.NY", price = 4.5)
    givenChildOrdersExist(testOrder1, testOrder2, testOrder3)

    val filterSpec = FilterSpec("orderId > 1 and ric starts \"ABC\"")
    val sortSpec = SortSpec(List(SortDef("price", SortDirection.Ascending.external)))

    val res = dataQuery.fetch(filterSpec, sortSpec, startIndex = 0, rowCount = 3)

    res.toList shouldEqual List(testOrder3, testOrder2)
  }

  private def givenChildOrdersExist(childOrders: ChildOrder*): Unit = {
    val parentOrder = TestUtils.createParentOrder(1)
    childOrders.foreach(o => orderStore.storeChildOrder(parentOrder, o))
  }
}
