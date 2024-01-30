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
    Columns.fromNames(
      "id".int(),
      "parentId".string(),
      "ric".string(),
      "quantity".int(),
      "price".double(),
      "side".string(),
      "strategy".string(),
      "parentOrderId".int(),
      "rating".char()
    )
  )

  Feature("Parse and apply GREATER THAN filter") {
    val testOrder1 = createTestOrderEntity(id = 1, ric = "VOD.L", price = 10.0, quantity = 600)
    val testOrder2 = createTestOrderEntity(id = 2, ric = "AAPL.L", price = 50.5, quantity = 200)
    val testOrder3 = createTestOrderEntity(id = 3, ric = "AAPL.L", price = 100.0, quantity = 1000)

    Scenario("Support comparison to INT") {
      givenOrderExistInIgnite(testOrder1, testOrder2, testOrder3)

      val filterResult = applyFilter("quantity > 500")

      assertEquavalent(filterResult.toArray, Array(testOrder1, testOrder3))
    }

    Scenario("Support comparison to DOUBLE") {
      givenOrderExistInIgnite(testOrder1, testOrder2, testOrder3)

      val filterResult = applyFilter("price > 50.0")

      assertEquavalent(filterResult.toArray, Array(testOrder2, testOrder3))
    }
  }

  Feature("Parse and apply GREATER THAN EQUAL filter") {
    val testOrder1 = createTestOrderEntity(id = 1, ric = "VOD.L", price = 10.0, quantity = 600)
    val testOrder2 = createTestOrderEntity(id = 2, ric = "AAPL.L", price = 50.5, quantity = 200)
    val testOrder3 = createTestOrderEntity(id = 3, ric = "AAPL.L", price = 100.0, quantity = 1000)

    Scenario("Support comparison to INT") {
      givenOrderExistInIgnite(testOrder1, testOrder2, testOrder3)

      val filterResult = applyFilter("quantity >= 600")

      assertEquavalent(filterResult.toArray, Array(testOrder1, testOrder3))
    }

    Scenario("Support comparison to DOUBLE") {
      givenOrderExistInIgnite(testOrder1, testOrder2, testOrder3)

      val filterResult = applyFilter("price >= 10.0")

      assertEquavalent(filterResult.toArray, Array(testOrder1, testOrder2, testOrder3))
    }
  }

  Feature("Parse and apply LESSER THAN filter") {
    val testOrder1 = createTestOrderEntity(id = 1, ric = "VOD.L", price = 10.0, quantity = 600)
    val testOrder2 = createTestOrderEntity(id = 2, ric = "AAPL.L", price = 50.0, quantity = 200)
    val testOrder3 = createTestOrderEntity(id = 3, ric = "AAPL.L", price = 100.5, quantity = 1000)

    Scenario("Support comparison to INT") {
      givenOrderExistInIgnite(testOrder1, testOrder2, testOrder3)

      val filterResult = applyFilter("quantity < 500")

      assertEquavalent(filterResult.toArray, Array(testOrder2))
    }

    Scenario("Support comparison to DOUBLE") {
      givenOrderExistInIgnite(testOrder1, testOrder2, testOrder3)

      val filterResult = applyFilter("price < 50.1")

      assertEquavalent(filterResult.toArray, Array(testOrder1, testOrder2))
    }
  }

  Feature("Parse and apply LESSER THAN EQUAL filter") {
    val testOrder1 = createTestOrderEntity(id = 1, ric = "VOD.L", price = 10.0, quantity = 600)
    val testOrder2 = createTestOrderEntity(id = 2, ric = "AAPL.L", price = 50.0, quantity = 200)
    val testOrder3 = createTestOrderEntity(id = 3, ric = "AAPL.L", price = 100.5, quantity = 1000)

    Scenario("Support comparison to INT") {
      givenOrderExistInIgnite(testOrder1, testOrder2, testOrder3)

      val filterResult = applyFilter("quantity <= 600")

      assertEquavalent(filterResult.toArray, Array(testOrder1, testOrder2))
    }

    Scenario("Support comparison to DOUBLE") {
      givenOrderExistInIgnite(testOrder1, testOrder2, testOrder3)

      val filterResult = applyFilter("price <= 50.0")

      assertEquavalent(filterResult.toArray, Array(testOrder1, testOrder2))
    }
  }

  Feature("Parse and apply EQUAL filter") {
    val testOrder1 = createTestOrderEntity(id = 1, ric = "VOD.L", rating = 'D', price = 10.1, parentId = 10)
    val testOrder2 = createTestOrderEntity(id = 2, ric = "AAPL.L", rating = 'B', price = 10.15, parentId = 11)
    val testOrder3 = createTestOrderEntity(id = 3, ric = "AAPL.GA", rating = 'C', price = 11, parentId = 10)

    Scenario("Support comparison to STRING") {
      givenOrderExistInIgnite(testOrder1, testOrder2, testOrder3)

      val filterResult = applyFilter("ric = \"AAPL.L\"")

      assertEquavalent(filterResult.toArray, Array(testOrder2))
    }

    Scenario("Support comparison to CHAR") {
      givenOrderExistInIgnite(testOrder1, testOrder2, testOrder3)

      val filterResult = applyFilter("rating = \"B\"")

      assertEquavalent(filterResult.toArray, Array(testOrder2))
    }

    Scenario("Support comparison to INT") {
      givenOrderExistInIgnite(testOrder1, testOrder2, testOrder3)

      val filterResult = applyFilter("parentId = 10")

      assertEquavalent(filterResult.toArray, Array(testOrder1, testOrder3))
    }

    Scenario("Support comparison to DOUBLE") {
      givenOrderExistInIgnite(testOrder1, testOrder2, testOrder3)

      val filterResult = applyFilter("price = 10.1")

      assertEquavalent(filterResult.toArray, Array(testOrder1))
    }
  }

  Feature("Parse and apply NOT-EQUAL filter") {
    val testOrder1 = createTestOrderEntity(id = 1, ric = "VOD.L", rating = 'D', price = 10.1, parentId = 10)
    val testOrder2 = createTestOrderEntity(id = 2, ric = "AAPL.L", rating = 'B', price = 10.15, parentId = 11)
    val testOrder3 = createTestOrderEntity(id = 3, ric = "AAPL.GA", rating = 'C', price = 11, parentId = 10)

    Scenario("Support comparison to STRING") {
      givenOrderExistInIgnite(testOrder1, testOrder2, testOrder3)

      val filterResult = applyFilter("ric != \"AAPL.L\"")

      assertEquavalent(filterResult.toArray, Array(testOrder1, testOrder3))
    }

    Scenario("Support comparison to CHAR") {
      givenOrderExistInIgnite(testOrder1, testOrder2, testOrder3)

      val filterResult = applyFilter("rating != \"B\"")

      assertEquavalent(filterResult.toArray, Array(testOrder1, testOrder3))
    }

    Scenario("Support comparison to INT") {
      givenOrderExistInIgnite(testOrder1, testOrder2, testOrder3)

      val filterResult = applyFilter("parentId != 10")

      assertEquavalent(filterResult.toArray, Array(testOrder2))
    }

    Scenario("Support comparison to DOUBLE") {
      givenOrderExistInIgnite(testOrder1, testOrder2, testOrder3)

      val filterResult = applyFilter("price != 10.1")

      assertEquavalent(filterResult.toArray, Array(testOrder2, testOrder3))
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

  Feature("Parse and apply OR filter") {
    Scenario("Support two clauses") {
      givenOrderExistInIgnite(
        createTestOrderEntity(id = 1, ric = "VOD.L", quantity = 150),
        createTestOrderEntity(id = 2, ric = "VOD.L", quantity = 200),
        createTestOrderEntity(id = 3, ric = "AAPL.L", quantity = 150),
      )

      val filterResult = applyFilter("ric = \"AAPL.L\" or quantity > 180")

      assertEquavalent(
        filterResult.toArray,
        Array(
          createTestOrderEntity(id = 2, ric = "VOD.L", quantity = 200),
          createTestOrderEntity(id = 3, ric = "AAPL.L", quantity = 150),
        )
      )
    }
  }

  Feature("Parse and apply nested AND/OR filters") {
    val testOrder1 = createTestOrderEntity(id = 1, ric = "VOD.L", price = 11.0, quantity = 200)
    val testOrder2 = createTestOrderEntity(id = 2, ric = "VOD.L", price = 4.0, quantity = 175)
    val testOrder3 = createTestOrderEntity(id = 3, ric = "AAPL.L", price = 5.0, quantity = 150)
    val testOrder4 = createTestOrderEntity(id = 4, ric = "AAPL.L", price = 7.0, quantity = 90)
    val testOrder5 = createTestOrderEntity(id = 5, ric = "ABC.L", price = 7.0, quantity = 150)

    Scenario("One level nesting - outer OR and nested AND") {
      givenOrderExistInIgnite(testOrder1, testOrder2, testOrder3)

      val filterResult = applyFilter("ric = \"AAPL.L\" or (ric = \"VOD.L\" and quantity = 200)")

      assertEquavalent(filterResult.toArray, Array(testOrder1, testOrder3))
    }

    Scenario("One level nesting - nested OR and outer AND") {
      givenOrderExistInIgnite(testOrder1, testOrder2, testOrder3)

      val filterResult = applyFilter("(ric = \"AAPL.L\" or ric = \"VOD.L\") and quantity = 200")

      assertEquavalent(filterResult.toArray, Array(testOrder1))
    }

    Scenario("Multilevel nesting") {
      givenOrderExistInIgnite(testOrder1, testOrder2, testOrder3, testOrder4, testOrder5)

      val filterResult = applyFilter("(ric = \"AAPL.L\" and quantity = 90) or (quantity > 100 and (price < 5 or price > 10))")

      assertEquavalent(filterResult.toArray, Array(testOrder1, testOrder2, testOrder4))
    }
  }

  Feature("Parse and apply STARTS filter") {
    val testOrder1 = createTestOrderEntity(id = 1, ric = "VOD.L")
    val testOrder2 = createTestOrderEntity(id = 2, ric = "VAD.L")
    val testOrder3 = createTestOrderEntity(id = 3, ric = "NVD.L")

    Scenario("supports String column type") {
      givenOrderExistInIgnite(testOrder1, testOrder2, testOrder3)

      val filterResult = applyFilter("ric starts \"V\"")

      assertEquavalent(filterResult.toArray, Array(testOrder1, testOrder2))
    }

    Scenario("empty filter for non-string column types") {
      givenOrderExistInIgnite(testOrder1, testOrder2, testOrder3)

      val filterResult = applyFilter("id starts \"1\"")

      filterResult.size shouldEqual 3
    }
  }

  Feature("Parse and apply ENDS filter") {
    val testOrder1 = createTestOrderEntity(id = 1, ric = "VOD.HK")
    val testOrder2 = createTestOrderEntity(id = 2, ric = "VAD.DDN")
    val testOrder3 = createTestOrderEntity(id = 3, ric = "NVD.LDN")

    Scenario("supports String column type") {
      givenOrderExistInIgnite(testOrder1, testOrder2, testOrder3)

      val filterResult = applyFilter("ric ends \"DN\"")

      assertEquavalent(filterResult.toArray, Array(testOrder2, testOrder3))
    }

    Scenario("empty filter for non-string column types") {
      givenOrderExistInIgnite(testOrder1, testOrder2, testOrder3)

      val filterResult = applyFilter("id ends \"1\"")

      filterResult.size shouldEqual 3
    }
  }

  Feature("Parse and apply IN filter") {
    val testOrder1 = createTestOrderEntity(id = 1, ric = "BABA.HK", rating = 'B', price = 10.5)
    val testOrder2 = createTestOrderEntity(id = 2, ric = "VAD.DDN", rating = 'C', price = 5.0)
    val testOrder3 = createTestOrderEntity(id = 3, ric = "NVD.LDN", rating = 'D', price = 3)

    Scenario("supports String column type") {
      givenOrderExistInIgnite(testOrder1, testOrder2, testOrder3)

      val filterResult = applyFilter("ric in [\"VAD.DDN\", \"NVD.LDN\"]")

      assertEquavalent(filterResult.toArray, Array(testOrder3, testOrder2))
    }

    Scenario("supports Char column type") {
      givenOrderExistInIgnite(testOrder1, testOrder2, testOrder3)

      val filterResult = applyFilter("rating in [\"B\", \"C\"]")

      assertEquavalent(filterResult.toArray, Array(testOrder1, testOrder2))
    }

    Scenario("supports Int column type") {
      givenOrderExistInIgnite(testOrder1, testOrder2, testOrder3)

      val filterResult = applyFilter("id in [1, 3]")

      assertEquavalent(filterResult.toArray, Array(testOrder1, testOrder3))
    }

    Scenario("supports Double column type") {
      givenOrderExistInIgnite(testOrder1, testOrder2, testOrder3)

      val filterResult = applyFilter("price in [10.5, 3]")

      assertEquavalent(filterResult.toArray, Array(testOrder1, testOrder3))
    }
  }

  private def applyFilter(filter: String): Iterable[TestOrderEntity] = {
    info(s"FILTER: $filter")
    val clause = FilterSpecParser.parse[IgniteSqlFilterClause](filter, filterTreeVisitor)
    info(s"CLAUSE: $clause")
    val criteria = clause.toSql(tableDef)
    info(s"SQL WHERE: $criteria")
    igniteTestStore.getFilteredBy(criteria)
  }

}