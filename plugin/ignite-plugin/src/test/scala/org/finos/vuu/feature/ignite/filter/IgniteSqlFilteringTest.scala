package org.finos.vuu.feature.ignite.filter

import org.finos.vuu.core.filter.FilterSpecParser
import org.finos.vuu.core.table.{Column, SimpleColumn}
import org.finos.vuu.feature.ignite.TestInput._
import org.finos.vuu.feature.ignite.{IgniteTestsBase, TestOrderEntity}
import org.finos.vuu.util.schema.{ExternalEntitySchema, SchemaField, SchemaMapper}

class IgniteSqlFilteringTest extends IgniteTestsBase {

  private val filterTreeVisitor: IgniteSqlFilterTreeVisitor = new IgniteSqlFilterTreeVisitor
  private val testSchemaMapper = SchemaMapper(new TestEntitySchema, internalColumns, fieldsMap)

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

    Scenario("Support mapped column names") {
      givenOrderExistInIgnite(testOrder1, testOrder2, testOrder3)

      val filterResult = applyFilter("key > 2")

      assertEquavalent(filterResult.toArray, Array(testOrder3))
    }

    Scenario("no filters applied when internal column not in schema") {
      givenOrderExistInIgnite(testOrder1, testOrder2, testOrder3)

      val filterResult = applyFilter("id > 2")

      filterResult.size shouldEqual 3
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

    Scenario("Support mapped column names") {
      givenOrderExistInIgnite(testOrder1, testOrder2, testOrder3)

      val filterResult = applyFilter("key >= 3")

      assertEquavalent(filterResult.toArray, Array(testOrder3))
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

    Scenario("Support mapped column names") {
      givenOrderExistInIgnite(testOrder1, testOrder2, testOrder3)

      val filterResult = applyFilter("key < 2")

      assertEquavalent(filterResult.toArray, Array(testOrder1))
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

    Scenario("Support mapped column names") {
      givenOrderExistInIgnite(testOrder1, testOrder2, testOrder3)

      val filterResult = applyFilter("key <= 2")

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

    Scenario("Support mapped column name") {
      givenOrderExistInIgnite(testOrder1, testOrder2, testOrder3)

      val filterResult = applyFilter("key = 2")

      assertEquavalent(filterResult.toArray, Array(testOrder2))
    }

    Scenario("no filters applied when internal column not in schema") {
      givenOrderExistInIgnite(testOrder1, testOrder2, testOrder3)

      val filterResult = applyFilter("id = 2")

      filterResult.size shouldEqual 3
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

    Scenario("Support mapped column name") {
      givenOrderExistInIgnite(testOrder1, testOrder2, testOrder3)

      val filterResult = applyFilter("key != 1")

      assertEquavalent(filterResult.toArray, Array(testOrder2, testOrder3))
    }

    Scenario("no filters applied when internal column not in schema") {
      givenOrderExistInIgnite(testOrder1, testOrder2, testOrder3)

      val filterResult = applyFilter("id != 1")

      filterResult.size shouldEqual 3
    }
  }

  Feature("Parse and apply AND filter") {
    val testOrder1 = createTestOrderEntity(id = 1, ric = "VOD.L", quantity = 1000)
    val testOrder2 = createTestOrderEntity(id = 2, ric = "AAPL.L", quantity = 200)
    val testOrder3 = createTestOrderEntity(id = 3, ric = "AAPL.L", quantity = 1000)

    //todo assert exception or handle error
    ignore("Support one clause") {
      givenOrderExistInIgnite(testOrder1, testOrder2, testOrder3)

      val filterResult = applyFilter("ric = \"AAPL.L\" and")

      assertEquavalent(filterResult.toArray, Array(testOrder2, testOrder3)
      )
    }

    Scenario("Support two clause") {
      givenOrderExistInIgnite(testOrder1, testOrder2, testOrder3)

      val filterResult = applyFilter("ric = \"AAPL.L\" and quantity > 500")

      assertEquavalent(filterResult.toArray, Array(testOrder3))
    }

    Scenario("ignores the clause if it returns empty sql (aka invalid)") {
      givenOrderExistInIgnite(testOrder1, testOrder2, testOrder3)

      val filterResult = applyFilter("ric = \"AAPL.L\" and doesNotExist > 500")

      assertEquavalent(filterResult.toArray, Array(testOrder2, testOrder3))
    }
  }

  Feature("Parse and apply OR filter") {
    val testOrder1 = createTestOrderEntity(id = 1, ric = "VOD.L", quantity = 150)
    val testOrder2 = createTestOrderEntity(id = 2, ric = "VOD.L", quantity = 200)
    val testOrder3 = createTestOrderEntity(id = 3, ric = "AAPL.L", quantity = 150)

    Scenario("Support two clauses") {
      givenOrderExistInIgnite(testOrder1, testOrder2, testOrder3)

      val filterResult = applyFilter("ric = \"AAPL.L\" or quantity > 180")

      assertEquavalent(filterResult.toArray, Array(testOrder2, testOrder3))
    }

    Scenario("ignores the clause if it returns empty sql (aka invalid)") {
      givenOrderExistInIgnite(testOrder1, testOrder2, testOrder3)

      val filterResult = applyFilter("ric = \"AAPL.L\" or doesNotExist > 180")

      assertEquavalent(filterResult.toArray, Array(testOrder3))
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

      val filterResult = applyFilter("key starts \"1\"")

      filterResult.size shouldEqual 3
    }

    Scenario("no filters applied when internal column not in schema") {
      givenOrderExistInIgnite(testOrder1, testOrder2, testOrder3)

      val filterResult = applyFilter("ricX starts \"V\"")

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

      val filterResult = applyFilter("key ends \"1\"")

      filterResult.size shouldEqual 3
    }

    Scenario("no filters applied when internal column not in schema") {
      givenOrderExistInIgnite(testOrder1, testOrder2, testOrder3)

      val filterResult = applyFilter("ricX ends \"DN\"")

      filterResult.size shouldEqual 3
    }
  }

  Feature("Parse and apply IN filter") {
    val testOrder1 = createTestOrderEntity(id = 1, parentId = 2, ric = "BABA.HK", rating = 'B', price = 10.5)
    val testOrder2 = createTestOrderEntity(id = 2, parentId = 3, ric = "VAD.DDN", rating = 'C', price = 5.0)
    val testOrder3 = createTestOrderEntity(id = 3, parentId = 4, ric = "NVD.LDN", rating = 'D', price = 3)

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

      val filterResult = applyFilter("parentId in [2, 4]")

      assertEquavalent(filterResult.toArray, Array(testOrder1, testOrder3))
    }

    Scenario("supports Double column type") {
      givenOrderExistInIgnite(testOrder1, testOrder2, testOrder3)

      val filterResult = applyFilter("price in [10.5, 3]")

      assertEquavalent(filterResult.toArray, Array(testOrder1, testOrder3))
    }

    Scenario("supports mapped column name") {
      givenOrderExistInIgnite(testOrder1, testOrder2, testOrder3)

      val filterResult = applyFilter("key in [1, 3]")

      assertEquavalent(filterResult.toArray, Array(testOrder1, testOrder3))
    }

    Scenario("no filters applied when internal column not in schema") {
      givenOrderExistInIgnite(testOrder1, testOrder2, testOrder3)

      val filterResult = applyFilter("id in [1, 3]")

      filterResult.size shouldEqual 3
    }
  }

  private def applyFilter(filter: String): Iterable[TestOrderEntity] = {
    info(s"FILTER: $filter")
    val clause = FilterSpecParser.parse[IgniteSqlFilterClause](filter, filterTreeVisitor)
    info(s"CLAUSE: $clause")
    val criteria = clause.toSql(testSchemaMapper)
    info(s"SQL WHERE: $criteria")
    igniteTestStore.getFilteredBy(criteria)
  }

  private def fieldsMap: Map[String, String] = Map(
    "id"       -> "key",
    "ric"      -> "ric",
    "price"    -> "price",
    "quantity" -> "quantity",
    "parentId" -> "parentId",
    "rating"   -> "rating"
  )

  private def internalColumns: Array[Column] = Array(
  ("key", classOf[Int]),
  ("ric", classOf[String]),
  ("price", classOf[Double]),
  ("quantity", classOf[Int]),
  ("parentId", classOf[Int]),
  ("rating", classOf[String]),
  ).zipWithIndex.map({ case ((name, t), i) => SimpleColumn(name, i, t) })

  private class TestEntitySchema extends ExternalEntitySchema {
    override val fields: List[SchemaField] = List(
      SchemaField("id", classOf[Int], 0),
      SchemaField("parentId", classOf[String], 1),
      SchemaField("ric", classOf[String], 2),
      SchemaField("strategy", classOf[String], 3),
      SchemaField("quantity", classOf[Int], 4),
      SchemaField("price", classOf[Double], 5),
      SchemaField("rating", classOf[Char], 6),
    )
  }

}
