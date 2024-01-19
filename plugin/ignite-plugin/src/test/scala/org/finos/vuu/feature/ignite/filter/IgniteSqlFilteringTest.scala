package org.finos.vuu.feature.ignite.filter

import org.finos.vuu.core.filter.FilterSpecParser
import org.finos.vuu.feature.ignite.TestInput._
import org.finos.vuu.feature.ignite.{IgniteTestStore, TestOrderEntity}
import org.scalatest.BeforeAndAfter
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class IgniteSqlFilteringTest extends AnyFeatureSpec with BeforeAndAfter with Matchers {

  private var filterTreeVisitor: IgniteSqlFilterTreeVisitor = _
  private var igniteTestStore: IgniteTestStore = _
  before {
    filterTreeVisitor = new IgniteSqlFilterTreeVisitor
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

      assertFilteredData(
        filterResult.toArray,
        Array(createTestOrderEntity(id = 2, ric = "AAPL.L"))
      )
    }
  }

  def assertFilteredData[T](filteredData: Array[T], expectedData: Array[T]): Unit = {
    filteredData shouldBe expectedData
  }

  def applyFilter(filter: String): Iterable[TestOrderEntity] = {
    info(s"FILTER: $filter")
    val clause = FilterSpecParser.parse[IgniteSqlFilterClause](filter, filterTreeVisitor)
    val criteria = clause.toSql()
    info(s"SQL WHERE: $filter")
    igniteTestStore.getFilteredBy(criteria)
  }

  def givenOrderExistInIgnite(existingData: TestOrderEntity*): Unit = {
    existingData.foreach(order => igniteTestStore.save(order))
  }
}