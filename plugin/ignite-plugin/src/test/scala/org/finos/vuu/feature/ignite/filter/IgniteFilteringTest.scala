package org.finos.vuu.feature.ignite.filter

import org.finos.vuu.core.filter.FilterSpecParser
import org.finos.vuu.feature.ignite.TestInput._
import org.finos.vuu.feature.ignite.{IgniteTestStore, TestOrder}
import org.scalatest.BeforeAndAfter
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class IgniteFilteringTest extends AnyFeatureSpec with BeforeAndAfter with Matchers {

  //todo virtualised table filtering tests (with ignite data or can use fake big data source?)
  private var filterTreeVisitor: IgniteFilterTreeVisitor = _
  private var igniteTestStore: IgniteTestStore = _
  before {
    filterTreeVisitor = new IgniteFilterTreeVisitor
    igniteTestStore = IgniteTestStore()
  }

  Feature("Applying the parsed filters yields expected results") {
    Scenario("Equality comparison to STRING") {

      givenOrderExistInIgnite(
        createTestOrder(id = 1, ric = "VOD.L"),
        createTestOrder(id = 2, ric = "AAPL.L"),
        createTestOrder(id = 3, ric = "AAPL.GA"),
      )

      val filterResult = applyFilter("ric = \"AAPL.L\"")

      assertFilteredData(filterResult,
        createTestOrder(id = 2, ric = "AAPL.L", parentId = 11),
      )
    }

    //not yet support
    ignore("Equality comparison to Int") {

      givenOrderExistInIgnite(
        createTestOrder(id = 1, ric = "VOD.L", parentId = 11),
        createTestOrder(id = 2, ric = "AAPL.L", parentId = 11),
        createTestOrder(id = 3, ric = "AAPL.GA", parentId = 10),
      )

      val filterResult = applyFilter("parentId = 11")

      assertFilteredData(filterResult,
        createTestOrder(id = 1, ric = "VOD.L", parentId = 11),
        createTestOrder(id = 2, ric = "AAPL.L", parentId = 11),
      )
    }
  }

  def assertFilteredData[T](filteredData: Iterable[T], expectedData: T*): Unit = {
    filteredData shouldBe expectedData
  }

  def applyFilter(filter: String): Iterable[TestOrder] = {
    info(s"FILTER: $filter")
    val clause = FilterSpecParser.parse[IgniteFilterClause](filter, filterTreeVisitor)
    val criteria = clause.toCriteria()
    igniteTestStore.getFilteredBy(criteria)
  }

  def givenOrderExistInIgnite(existingData: TestOrder*): Unit = {
    existingData.foreach(order => igniteTestStore.save(order))
  }
}