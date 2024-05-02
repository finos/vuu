package org.finos.vuu.feature.ignite.filter

import org.finos.vuu.core.filter.FilterSpecParser
import org.finos.vuu.core.table.{Column, SimpleColumn}
import org.finos.vuu.feature.ignite.TestInput._
import org.finos.vuu.feature.ignite.{IgniteTestsBase, TestOrderEntity}
import org.finos.vuu.util.schema.{ExternalEntitySchema, SchemaField, SchemaMapperBuilder}
import org.finos.vuu.util.types.{TypeConverterContainer, TypeConverterContainerBuilder}

import java.sql.Date
import java.math.BigDecimal
import java.time.LocalDate

class IgniteSqlFilteringTest extends IgniteTestsBase {

  private val filterTreeVisitor: IgniteSqlFilterTreeVisitor = new IgniteSqlFilterTreeVisitor
  private val testSchemaMapper = SchemaMapperBuilder(new TestEntitySchema, internalColumns)
    .withFieldsMap(fieldsMap)
    .withTypeConverters(typeConverterContainer)
    .build()

  Feature("Parse and apply GREATER THAN filter") {
    val testOrder1 = createTestOrderEntity(id = 1, ric = "VOD.L", price = 10.0, quantity = 600, createdAt = Date.valueOf("2024-01-01"), totalFill = BigDecimal.valueOf(10.05))
    val testOrder2 = createTestOrderEntity(id = 2, ric = "AAPL.L", price = 50.5, quantity = 200, createdAt = Date.valueOf("2023-12-30"), totalFill = BigDecimal.valueOf(10.55))
    val testOrder3 = createTestOrderEntity(id = 3, ric = "AAPL.L", price = 100.0, quantity = 1000, createdAt = Date.valueOf("2024-04-30"), totalFill = BigDecimal.valueOf(9.99))

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

    Scenario("Support mapped field types - [ java.sql.Date -> Long ]") {
      givenOrderExistInIgnite(testOrder1, testOrder2, testOrder3)

      val filterResult = applyFilter(s"createdAt > ${getTime("2024-01-01")}")

      assertEquavalent(filterResult.toArray, Array(testOrder3))
    }

    Scenario("Support mapped field types and names - [ java.math.BigDecimal -> Double]") {
      givenOrderExistInIgnite(testOrder1, testOrder2, testOrder3)

      val filterResult = applyFilter("fill > 10.1")

      assertEquavalent(filterResult.toArray, Array(testOrder2))
    }

    Scenario("no filters applied when internal column not in schema") {
      givenOrderExistInIgnite(testOrder1, testOrder2, testOrder3)

      val filterResult = applyFilter("id > 2")

      filterResult.size shouldEqual 3
    }
  }

  Feature("Parse and apply GREATER THAN EQUAL filter") {
    val testOrder1 = createTestOrderEntity(id = 1, ric = "VOD.L", price = 10.0, quantity = 600, updatedAt = LocalDate.of(2024, 3, 3))
    val testOrder2 = createTestOrderEntity(id = 2, ric = "AAPL.L", price = 50.5, quantity = 200, updatedAt = LocalDate.of(2024, 2, 2))
    val testOrder3 = createTestOrderEntity(id = 3, ric = "AAPL.L", price = 100.0, quantity = 1000, updatedAt = LocalDate.of(2024, 1, 1))

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

    Scenario("Support mapped field types - [ java.time.LocalDate -> Long ]") {
      givenOrderExistInIgnite(testOrder1, testOrder2, testOrder3)

      val filterResult = applyFilter(s"updatedAt >= ${getTime("2024-02-02")}")

      assertEquavalent(filterResult.toArray, Array(testOrder1, testOrder2))
    }

    Scenario("Support mapped column names") {
      givenOrderExistInIgnite(testOrder1, testOrder2, testOrder3)

      val filterResult = applyFilter("key >= 3")

      assertEquavalent(filterResult.toArray, Array(testOrder3))
    }
  }

  Feature("Parse and apply LESSER THAN filter") {
    val testOrder1 = createTestOrderEntity(id = 1, ric = "VOD.L", price = 10.0, quantity = 600, totalFill = BigDecimal.valueOf(10.95))
    val testOrder2 = createTestOrderEntity(id = 2, ric = "AAPL.L", price = 50.0, quantity = 200, totalFill = BigDecimal.valueOf(10.55))
    val testOrder3 = createTestOrderEntity(id = 3, ric = "AAPL.L", price = 100.5, quantity = 1000, totalFill = BigDecimal.valueOf(0.0005))

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

    Scenario("Support mapped field types - [ java.math.BigDecimal -> Double]") {
      givenOrderExistInIgnite(testOrder1, testOrder2, testOrder3)

      val filterResult = applyFilter("fill < 10.1")

      assertEquavalent(filterResult.toArray, Array(testOrder3))
    }
  }

  Feature("Parse and apply LESSER THAN EQUAL filter") {
    val testOrder1 = createTestOrderEntity(id = 1, ric = "VOD.L", price = 10.0, quantity = 600, createdAt = Date.valueOf("2024-01-01"))
    val testOrder2 = createTestOrderEntity(id = 2, ric = "AAPL.L", price = 50.0, quantity = 200, createdAt = Date.valueOf("2023-12-30"))
    val testOrder3 = createTestOrderEntity(id = 3, ric = "AAPL.L", price = 100.5, quantity = 1000, createdAt = Date.valueOf("2024-04-30"))

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


    Scenario("Support mapped field types - [ java.sql.Date -> Long]") {
      givenOrderExistInIgnite(testOrder1, testOrder2, testOrder3)

      val filterResult = applyFilter(s"createdAt <= ${getTime("2024-01-01")}")

      assertEquavalent(filterResult.toArray, Array(testOrder1, testOrder2))
    }
  }

  Feature("Parse and apply EQUAL filter") {
    val testOrder1 = createTestOrderEntity(id = 1, ric = "VOD.L", rating = 'D', price = 10.1, parentId = 10, createdAt = Date.valueOf("2024-03-10"), totalFill = BigDecimal.valueOf(10.5))
    val testOrder2 = createTestOrderEntity(id = 2, ric = "AAPL.L", rating = 'B', price = 10.15, parentId = 11, createdAt = Date.valueOf("2024-02-10"), totalFill = BigDecimal.valueOf(10.99))
    val testOrder3 = createTestOrderEntity(id = 3, ric = "AAPL.GA", rating = 'C', price = 11, parentId = 10, createdAt = Date.valueOf("2020-10-10"), totalFill = BigDecimal.valueOf(11.32))

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

      val filterResult = applyFilter("parentOrderId = \"10\"")

      assertEquavalent(filterResult.toArray, Array(testOrder1, testOrder3))
    }

    Scenario("Support comparison to DOUBLE") {
      givenOrderExistInIgnite(testOrder1, testOrder2, testOrder3)

      val filterResult = applyFilter("price = 10.1")

      assertEquavalent(filterResult.toArray, Array(testOrder1))
    }

    Scenario("Support comparison to BOOLEAN") {
      givenOrderExistInIgnite(testOrder1, testOrder2, testOrder3)

      val filterResult = applyFilter("isFilled = false")

      assertEquavalent(filterResult.toArray, Array.empty)
    }

    Scenario("Support mapped column name") {
      givenOrderExistInIgnite(testOrder1, testOrder2, testOrder3)

      val filterResult = applyFilter("key = 2")

      assertEquavalent(filterResult.toArray, Array(testOrder2))
    }

    Scenario("Support mapped type - [java.sql.Date -> Long]") {
      givenOrderExistInIgnite(testOrder1, testOrder2, testOrder3)

      val filterResult = applyFilter(s"createdAt = ${getTime("2020-10-10")}")

      assertEquavalent(filterResult.toArray, Array(testOrder3))
    }

    Scenario("Support mapped type and name - [java.math.BigDecimal -> Double] & [totalFill -> fill]") {
      givenOrderExistInIgnite(testOrder1, testOrder2, testOrder3)

      val filterResult = applyFilter("fill = 10.99")

      assertEquavalent(filterResult.toArray, Array(testOrder2))
    }

    Scenario("no filters applied when internal column not in schema") {
      givenOrderExistInIgnite(testOrder1, testOrder2, testOrder3)

      val filterResult = applyFilter("id = 2")

      filterResult.size shouldEqual 3
    }
  }

  Feature("Parse and apply NOT-EQUAL filter") {
    val testOrder1 = createTestOrderEntity(id = 1, ric = "VOD.L", rating = 'D', price = 10.1, parentId = 10, createdAt = Date.valueOf("2024-01-11"), totalFill = BigDecimal.valueOf(10.167))
    val testOrder2 = createTestOrderEntity(id = 2, ric = "AAPL.L", rating = 'B', price = 10.15, parentId = 11, createdAt = Date.valueOf("2024-02-02"), totalFill = BigDecimal.valueOf(10.5))
    val testOrder3 = createTestOrderEntity(id = 3, ric = "AAPL.GA", rating = 'C', price = 11, parentId = 10, createdAt = Date.valueOf("2024-03-02"), totalFill = BigDecimal.valueOf(10.5))

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

      val filterResult = applyFilter("parentOrderId != \"10\"")

      assertEquavalent(filterResult.toArray, Array(testOrder2))
    }

    Scenario("Support comparison to DOUBLE") {
      givenOrderExistInIgnite(testOrder1, testOrder2, testOrder3)

      val filterResult = applyFilter("price != 10.1")

      assertEquavalent(filterResult.toArray, Array(testOrder2, testOrder3))
    }

    Scenario("Support comparison to BOOLEAN") {
      givenOrderExistInIgnite(testOrder1, testOrder2, testOrder3)

      val filterResult = applyFilter("isFilled != false")

      assertEquavalent(filterResult.toArray, Array(testOrder1, testOrder2, testOrder3))
    }

    Scenario("Support mapped column name") {
      givenOrderExistInIgnite(testOrder1, testOrder2, testOrder3)

      val filterResult = applyFilter("key != 1")

      assertEquavalent(filterResult.toArray, Array(testOrder2, testOrder3))
    }

    Scenario("Support mapped type - [java.sql.Date -> Long]") {
      givenOrderExistInIgnite(testOrder1, testOrder2, testOrder3)

      val filterResult = applyFilter(s"createdAt != ${getTime("2024-01-11")}")

      assertEquavalent(filterResult.toArray, Array(testOrder2, testOrder3))
    }

    Scenario("Support mapped type and name - [java.math.BigDecimal -> Double] & [totalFill -> fill]") {
      givenOrderExistInIgnite(testOrder1, testOrder2, testOrder3)

      val filterResult = applyFilter("fill != 10.5")

      assertEquavalent(filterResult.toArray, Array(testOrder1))
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
    val testOrder2 = createTestOrderEntity(id = 2, ric = "VA_D.L")
    val testOrder3 = createTestOrderEntity(id = 3, ric = "%A_VD.L")
    val testOrder4 = createTestOrderEntity(id = 4, ric = "%AVD.L")

    Scenario("supports String column type") {
      givenOrderExistInIgnite(testOrder1, testOrder2, testOrder3)

      val filterResult = applyFilter("ric starts \"V\"")

      assertEquavalent(filterResult.toArray, Array(testOrder1, testOrder2))
    }

    Scenario("can handle special characters") {
      givenOrderExistInIgnite(testOrder1, testOrder2, testOrder3, testOrder4)

      val filterResult = applyFilter("ric starts \"%A_\"")

      assertEquavalent(filterResult.toArray, Array(testOrder3))
    }

    Scenario("no filters applied when internal column not in schema") {
      givenOrderExistInIgnite(testOrder1, testOrder2, testOrder3)

      val filterResult = applyFilter("ricX starts \"V\"")

      filterResult.size shouldEqual 3
    }
  }

  Feature("Parse and apply ENDS filter") {
    val testOrder1 = createTestOrderEntity(id = 1, ric = "VOD._DD%")
    val testOrder2 = createTestOrderEntity(id = 2, ric = "VAD._DDN")
    val testOrder3 = createTestOrderEntity(id = 3, ric = "NVD.LDN")
    val testOrder4 = createTestOrderEntity(id = 4, ric = "VOD.LDD%")

    Scenario("supports String column type") {
      givenOrderExistInIgnite(testOrder1, testOrder2, testOrder3)

      val filterResult = applyFilter("ric ends \"DN\"")

      assertEquavalent(filterResult.toArray, Array(testOrder2, testOrder3))
    }

    Scenario("can handle special characters") {
      givenOrderExistInIgnite(testOrder1, testOrder2, testOrder3, testOrder4)

      val filterResult = applyFilter("ric ends \"_DD%\"")

      assertEquavalent(filterResult.toArray, Array(testOrder1))
    }

    Scenario("no filters applied when internal column not in schema") {
      givenOrderExistInIgnite(testOrder1, testOrder2, testOrder3)

      val filterResult = applyFilter("ricX ends \"DN\"")

      filterResult.size shouldEqual 3
    }
  }

  Feature("Parse and apply CONTAINS filter") {
    val testOrder1 = createTestOrderEntity(id = 1, ric = "VOD.A.HK")
    val testOrder2 = createTestOrderEntity(id = 2, ric = "VA[_]D.A.HK")
    val testOrder3 = createTestOrderEntity(id = 3, ric = "NV[_]D%.B.HK")
    val testOrder4 = createTestOrderEntity(id = 4, ric = "N[V]D%.B.HK")

    Scenario("supports String column type") {
      givenOrderExistInIgnite(testOrder1, testOrder2, testOrder3)

      val filterResult = applyFilter("ric contains \".A.\"")

      assertEquavalent(filterResult.toArray, Array(testOrder1, testOrder2))
    }

    Scenario("can handle special characters") {
      givenOrderExistInIgnite(testOrder1, testOrder2, testOrder3, testOrder4)

      // some SQL engines treat `[`, `]` as special chars in `LIKE`, adding `[_]` makes sure that our underlying engine is not treating these as special chars
      val filterResult = applyFilter("ric contains \"[_]D%\"")

      assertEquavalent(filterResult.toArray, Array(testOrder3))
    }

    Scenario("no filters applied when internal column not in schema") {
      givenOrderExistInIgnite(testOrder1, testOrder2, testOrder3)

      val filterResult = applyFilter("ricX contains \".A.\"")

      filterResult.size shouldEqual 3
    }
  }

  Feature("Parse and apply IN filter") {
    val testOrder1 = createTestOrderEntity(id = 1, parentId = 2, ric = "BABA.HK", rating = 'B', price = 10.5, createdAt = Date.valueOf("2024-02-03"))
    val testOrder2 = createTestOrderEntity(id = 2, parentId = 3, ric = "VAD.DDN", rating = 'C', price = 5.0, createdAt = Date.valueOf("2024-03-03"))
    val testOrder3 = createTestOrderEntity(id = 3, parentId = 4, ric = "NVD.LDN", rating = 'D', price = 3, createdAt = Date.valueOf("2020-01-30"))

    Scenario("supports String column type") {
      givenOrderExistInIgnite(testOrder1, testOrder2, testOrder3)

      val filterResult = applyFilter("ric in [\"VAD.DDN\", \"NVD.LDN\"]")

      assertEquavalent(filterResult.toArray, Array(testOrder2, testOrder3))
    }

    Scenario("supports Char column type") {
      givenOrderExistInIgnite(testOrder1, testOrder2, testOrder3)

      val filterResult = applyFilter("rating in [\"B\", \"C\"]")

      assertEquavalent(filterResult.toArray, Array(testOrder1, testOrder2))
    }

    Scenario("supports Int column type") {
      givenOrderExistInIgnite(testOrder1, testOrder2, testOrder3)

      val filterResult = applyFilter("parentOrderId in [\"2\", \"4\"]")

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

    Scenario("supports mapped field types - [ java.sql.Date -> Long ]") {
      givenOrderExistInIgnite(testOrder1, testOrder2, testOrder3)

      val filterResult = applyFilter(s"createdAt in [${getTime("2020-01-30")}]")

      assertEquavalent(filterResult.toArray, Array(testOrder3))
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
    "parentId" -> "parentOrderId",
    "rating"   -> "rating",
    "isFilled" -> "isFilled",
    "createdAt" -> "createdAt",
    "updatedAt" -> "updatedAt",
    "totalFill" -> "fill",
  )

  private def internalColumns: Array[Column] = Array(
  ("key", classOf[Int]),
  ("ric", classOf[String]),
  ("price", classOf[Double]),
  ("quantity", classOf[Int]),
  ("parentOrderId", classOf[String]),
  ("rating", classOf[String]),
  ("isFilled", classOf[Boolean]),
  ("createdAt", classOf[Long]),
  ("updatedAt", classOf[Long]),
  ("fill", classOf[Double]),
  ).zipWithIndex.map({ case ((name, t), i) => SimpleColumn(name, i, t) })

  private class TestEntitySchema extends ExternalEntitySchema {
    override val fields: List[SchemaField] = List(
      SchemaField("id", classOf[Int], 0),
      SchemaField("parentId", classOf[Int], 1),
      SchemaField("ric", classOf[String], 2),
      SchemaField("strategy", classOf[String], 3),
      SchemaField("quantity", classOf[Int], 4),
      SchemaField("price", classOf[Double], 5),
      SchemaField("rating", classOf[Char], 6),
      SchemaField("isFilled", classOf[Boolean], 7),
      SchemaField("createdAt", classOf[Date], 8),
      SchemaField("updatedAt", classOf[LocalDate], 9),
      SchemaField("totalFill", classOf[BigDecimal], 10)
    )
  }

  private def typeConverterContainer: TypeConverterContainer = TypeConverterContainerBuilder()
    .with2WayConverter[Date, Long](classOf[Date], classOf[Long], _.getTime, new Date(_))
    .with2WayConverter[LocalDate, Long](classOf[LocalDate], classOf[Long], Date.valueOf(_).getTime, l => new Date(l).toLocalDate)
    .with2WayConverter[BigDecimal, Double](classOf[BigDecimal], classOf[Double], _.doubleValue(), BigDecimal.valueOf)
    .build()

  private def getTime(date: String): Long = Date.valueOf(date).getTime
}
