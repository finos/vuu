package org.finos.vuu.feature.ignite.filter

import org.finos.vuu.api.TableDef
import org.finos.vuu.core.filter.FilterSpecParser
import org.finos.vuu.core.module.ModuleFactory.stringToString
import org.finos.vuu.core.table.Columns
import org.finos.vuu.feature.ignite.TestInput._
import org.finos.vuu.feature.ignite.{IgniteTestsBase, TestOrderEntity}

class IgniteSqlFilteringTest extends IgniteTestsBase {

  private val filterTreeVisitor: IgniteSqlFilterTreeVisitor = new IgniteSqlFilterTreeVisitor
  private val tableDef = TableDef(
    name = "bigOrders",
    keyField = "orderId",
    Columns.fromNames("id".int(), "parentId".string(), "ric".string(), "quantity".int(), "price".double(), "side".string(), "strategy".string(), "parentOrderId".int())
  )

  Feature("Parse and apply GREATER THAN filter") {
    Scenario("Support comparison to INT") {
      givenOrderExistInIgnite(
        createTestOrderEntity(id = 1, ric = "VOD.L", quantity = 600),
        createTestOrderEntity(id = 2, ric = "AAPL.L", quantity = 200),
        createTestOrderEntity(id = 3, ric = "AAPL.GA", quantity = 1000),
      )

      val filterResult = applyFilter("quantity > 500")

      assertEquavalent(
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

      assertEquavalent(
        filterResult.toArray,
        Array(
          createTestOrderEntity(id = 3, ric = "AAPL.L",  quantity = 1000),
        )
      )
    }
  }
  Feature("Parse and apply EQUALITY filter") {
    Scenario("Support comparison to STRING") {
      givenOrderExistInIgnite(
        createTestOrderEntity(id = 1, ric = "VOD.L"),
        createTestOrderEntity(id = 2, ric = "AAPL.L"),
        createTestOrderEntity(id = 3, ric = "AAPL.GA"),
      )

      val filterResult = applyFilter("ric = \"AAPL.L\"")

      assertEquavalent(
        filterResult.toArray,
        Array(createTestOrderEntity(id = 2, ric = "AAPL.L"))
      )
    }

    Scenario("Support comparison to INT") {
      givenOrderExistInIgnite(
        createTestOrderEntity(id = 1, ric = "VOD.L", parentId = 10),
        createTestOrderEntity(id = 2, ric = "AAPL.L", parentId = 11),
        createTestOrderEntity(id = 3, ric = "AAPL.GA", parentId = 10),
      )

      val filterResult = applyFilter("parentId = 10")

      assertEquavalent(
        filterResult.toArray,
        Array(
          createTestOrderEntity(id = 1, ric = "VOD.L", parentId = 10),
          createTestOrderEntity(id = 3, ric = "AAPL.GA", parentId = 10),
        )
      )
    }

    Scenario("Support comparison to DOUBLE") {
      givenOrderExistInIgnite(
        createTestOrderEntity(id = 1, ric = "VOD.L", price = 10.1),
        createTestOrderEntity(id = 2, ric = "AAPL.L", price = 10.15),
        createTestOrderEntity(id = 3, ric = "AAPL.GA", price = 11),
      )

      val filterResult = applyFilter("price = 10.1")

      assertEquavalent(
        filterResult.toArray,
        Array(
          createTestOrderEntity(id = 1, ric = "VOD.L", price = 10.1),
        )
      )
    }
  }
  Feature("Parse and apply AND filter") {
    //todo assert exception or handle error
    ignore("Support one clause") {
      givenOrderExistInIgnite(
        createTestOrderEntity(id = 1, ric = "VOD.L", quantity = 1000),
        createTestOrderEntity(id = 2, ric = "AAPL.L", quantity = 200),
        createTestOrderEntity(id = 3, ric = "AAPL.L", quantity = 1000),
      )

      val filterResult = applyFilter("ric = \"AAPL.L\" and")

      assertEquavalent(
        filterResult.toArray,
        Array(
          createTestOrderEntity(id = 2, ric = "AAPL.L", quantity = 200),
          createTestOrderEntity(id = 3, ric = "AAPL.L", quantity = 1000),
        )
      )
    }

    Scenario("Support two clause") {
      givenOrderExistInIgnite(
        createTestOrderEntity(id = 1, ric = "VOD.L", quantity = 1000),
        createTestOrderEntity(id = 2, ric = "AAPL.L", quantity = 200),
        createTestOrderEntity(id = 3, ric = "AAPL.L", quantity = 1000),
      )

      val filterResult = applyFilter("ric = \"AAPL.L\" and quantity > 500")

      assertEquavalent(
        filterResult.toArray,
        Array(
          createTestOrderEntity(id = 3, ric = "AAPL.L", quantity = 1000),
        )
      )
    }
  }

  private def applyFilter(filter: String): Iterable[TestOrderEntity] = {
    info(s"FILTER: $filter")
    val clause = FilterSpecParser.parse[IgniteSqlFilterClause](filter, filterTreeVisitor)
    val criteria = clause.toSql(tableDef)
    info(s"SQL WHERE: $filter")
    igniteTestStore.getFilteredBy(criteria)
  }

}