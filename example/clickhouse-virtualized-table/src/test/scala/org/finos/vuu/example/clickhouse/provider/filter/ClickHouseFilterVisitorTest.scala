package org.finos.vuu.example.clickhouse.provider.filter

import org.finos.vuu.core.filter.FilterSpecParser
import org.finos.vuu.example.clickhouse.provider.filter.ClickHouseFilterVisitor
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class ClickHouseFilterVisitorTest extends AnyFeatureSpec with Matchers {

  private def compile(filterStr: String): String = {
    FilterSpecParser.parse(filterStr, new ClickHouseFilterVisitor())
  }

  Feature("ClickHouseFilterVisitor compiles filter expressions to SQL clauses") {

    Scenario("Equality comparisons") {
      compile("trader = \"rahúl\"") shouldBe "trader = 'rahúl'"
      compile("quantity = 100") shouldBe "quantity = 100"
      compile("onMkt = true") shouldBe "onMkt = true"
      compile("onMkt = false") shouldBe "onMkt = false"
      compile("trader != \"steve\"") shouldBe "trader != 'steve'"
      compile("quantity != 100") shouldBe "quantity != 100"
    }

    Scenario("String escapes") {
      compile("trader = \"O'Reilly\"") shouldBe "trader = 'O''Reilly'"
    }

    Scenario("Magnitude comparisons") {
      compile("price > 123.45") shouldBe "price > 123.45"
      compile("price >= 100") shouldBe "price >= 100"
      compile("price < 50.5") shouldBe "price < 50.5"
      compile("price <= 50") shouldBe "price <= 50"
    }

    Scenario("String match operators") {
      compile("ric starts \"AAPL\"") shouldBe "ric LIKE 'AAPL%'"
      compile("ric ends \"L\"") shouldBe "ric LIKE '%L'"
      compile("ric contains \"OD\"") shouldBe "ric LIKE '%OD%'"
    }

    Scenario("In set operations") {
      compile("ric in [\"AAPL.L\", \"BT.L\"]") shouldBe "ric IN ('AAPL.L', 'BT.L')"
      compile("quantity in [10, 20, 30]") shouldBe "quantity IN (10, 20, 30)"
      compile("ric in []") shouldBe "1 = 0"
    }

    Scenario("Composite logical operators") {
      compile("ric = \"AAPL.L\" and quantity > 100") shouldBe "(ric = 'AAPL.L' AND quantity > 100)"
      compile("ric = \"AAPL.L\" or quantity > 100") shouldBe "(ric = 'AAPL.L' OR quantity > 100)"
      compile("(ric = \"AAPL.L\" or ric = \"BT.L\") and quantity > 100") shouldBe "((ric = 'AAPL.L' OR ric = 'BT.L') AND quantity > 100)"
    }
  }
}
