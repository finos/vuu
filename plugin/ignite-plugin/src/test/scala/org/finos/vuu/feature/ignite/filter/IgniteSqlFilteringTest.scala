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
    Scenario("EQUALITY comparison to STRING") {

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
    Scenario("GREATER THAN clause") {

      givenOrderExistInIgnite(
        createTestOrderEntity(id = 1, ric = "VOD.L", quantity = 600),
        createTestOrderEntity(id = 2, ric = "AAPL.L", quantity = 200),
        createTestOrderEntity(id = 3, ric = "AAPL.GA", quantity = 1000),
      )

      val filterResult = applyFilter("quantity > 500")

      assertFilteredData(
        filterResult.toArray,
        Array(
          createTestOrderEntity(id = 1, ric = "VOD.L", quantity = 600),
          createTestOrderEntity(id = 3, ric = "AAPL.GA", quantity = 1000),
        )
      )
    }

    Scenario("AND clause for two conditions") {

      givenOrderExistInIgnite(
        createTestOrderEntity(id = 1, ric = "VOD.L", quantity = 1000),
        createTestOrderEntity(id = 2, ric = "AAPL.L", quantity = 200),
        createTestOrderEntity(id = 3, ric = "AAPL.L", quantity = 1000),
      )

      val filterResult = applyFilter("ric = \"AAPL.L\" and quantity > 500")

      assertFilteredData(
        filterResult.toArray,
        Array(
          createTestOrderEntity(id = 3, ric = "AAPL.L",  quantity = 1000),
        )
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