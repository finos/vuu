package org.finos.vuu.feature.ignite.filter

import org.finos.vuu.core.filter.FilterSpecParser
import org.finos.vuu.feature.ignite.TestInput._
import org.finos.vuu.feature.ignite.{IgniteTestStore, TestOrderEntity}
import org.scalatest.BeforeAndAfter
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class IgniteIndexFilteringTest extends AnyFeatureSpec with BeforeAndAfter with Matchers {

  //todo virtualised table filtering tests (with ignite data or can use fake big data source?)
  private var filterTreeVisitor: IgniteIndexFilterTreeVisitor = _
  private var igniteTestStore: IgniteTestStore = _
  before {
    filterTreeVisitor = new IgniteIndexFilterTreeVisitor
    igniteTestStore = IgniteTestStore()
  }

  Feature("Applying the parsed filters yields expected results") {
    Scenario("Equality comparison to STRING") {

      givenOrderExistInIgnite(
        createTestOrderEntity(id = 1, ric = "VOD.L"),
        createTestOrderEntity(id = 2, ric = "AAPL.L"),
        createTestOrderEntity(id = 3, ric = "AAPL.GA"),
      )

      val filterResult = applyFilter("ric = \"AAPL.L\"")

      assertFilteredData(filterResult,
        createTestOrderEntity(id = 2, ric = "AAPL.L"),
      )
    }

    //not yet support
    ignore("Equality comparison to Int") {

      givenOrderExistInIgnite(
        createTestOrderEntity(id = 1, ric = "VOD.L", parentId = 11),
        createTestOrderEntity(id = 2, ric = "AAPL.L", parentId = 11),
        createTestOrderEntity(id = 3, ric = "AAPL.GA", parentId = 10),
      )

      val filterResult = applyFilter("parentId = 11")

      assertFilteredData(filterResult,
        createTestOrderEntity(id = 1, ric = "VOD.L", parentId = 11),
        createTestOrderEntity(id = 2, ric = "AAPL.L", parentId = 11),
      )
    }
  }

  def assertFilteredData[T](filteredData: Iterable[T], expectedData: T*): Unit = {
    filteredData shouldBe expectedData
  }

  def applyFilter(filter: String): Iterable[TestOrderEntity] = {
    info(s"FILTER: $filter")
    val clause = FilterSpecParser.parse[IgniteIndexFilterClause](filter, filterTreeVisitor)
    val criteria = clause.toCriteria()
    igniteTestStore.getFilteredBy(criteria)
  }

  def givenOrderExistInIgnite(existingData: TestOrderEntity*): Unit = {
    existingData.foreach(order => igniteTestStore.save(order))
  }
}