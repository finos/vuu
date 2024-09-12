package org.finos.vuu.core.filter

import org.antlr.v4.runtime.misc.ParseCancellationException
import org.finos.vuu.core.filter.FilterSpecParser.{parse => filterClause}
import org.finos.vuu.core.sort.FilterAndSortFixture._
import org.finos.vuu.core.table.RowWithData
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers
import org.scalatest.prop.TableDrivenPropertyChecks._

import scala.collection.immutable

class FilterGrammarTest extends AnyFeatureSpec with Matchers {
  def assertParsable(filter: String): Unit = filterClause(filter) shouldBe a[FilterClause]
  def assertNotParsable(filter: String): Unit = an [ParseCancellationException] should be thrownBy filterClause(filter)
  def assertFilteredRows(filter: String, expectedRows: RowWithData*): Unit = {
    info(s"FILTER: $filter")

    val table = setupTable2()
    val clause = filterClause(filter)
    val resultRows = getFilteredRows(table, clause)

    withClue(s"PARSED: $clause\n") {
      assertRows(resultRows.toSet, expectedRows.toSet)
    }
  }

  Feature("Grammar parses valid filters") {
    Scenario("Set membership") {
      val filterExpressions = Table(
        "Application in [\"GenRepublisher-1.00.01\",\"GenRepublisher-1.00.00\"]",
        "Application in [1, 2, 3 ]",
        "Application in []",
      )
      forAll(filterExpressions)(assertParsable)
    }
    Scenario("String match comparisons") {
      val filterExpressions = Table(
        "Foo starts \"abc\"",
        "Foo ends \"abc\"",
        "Foo contains \"abc\""
      )
      forAll(filterExpressions)(assertParsable)
    }
    Scenario("Magnitude comparisons") {
      val filterExpressions = Table(
        "Foo > 1",
        "Foo > 1.1",
        "Foo >= 1.5",
        "Foo < 1",
        "Foo < 1.1",
        "Foo <= 1.5",
      )
      forAll(filterExpressions)(assertParsable)
    }
    Scenario("Equality comparisons") {
      val filterExpressions = Table(
        "Foo = 1",
        "Foo = 1.0",
        "Foo = true",
        "Foo = false",
        "Foo = \"abc\"",
        "Foo != 1",
        "Foo != 1.0",
        "Foo != true",
        "Foo != false",
        "Foo != \"abc\"",
      )
      forAll(filterExpressions)(assertParsable)
    }
    Scenario("Composite boolean expressions") {
      val filterExpressions = Table(
        "Foo<1 and Bar<1.1",
        "Foo <= 1 and Bar >= 1.1",
        "Foo>1.1 and Bar=1 and Baz=1",
        "Foo=1 or Bar!=1",
        "Foo=1.2 or Bar!=1.2 or Baz=\"1\"",
        "Foo!=\"1\" and (Bar=true or Baz=false)",
        "Foo starts \"1\" and Bar ends \"1\" and (Bar=1 or Baz=1)",
        "Foo=1 or Bar=1 and Baz=1",
        "(Foo=1 or Bar=1) and Baz=1",
        "Foo=1 or (Bar=1 and Baz=1)",
        "Foo=1 or (Bar=1 or Bar<=1 and Baz=1)",
        "Foo=1 or (Bar=1 or Bar=1) and Baz=1",
        "(Foo=1 or Bar>=1 or XY contains \"1\") and Baz=1",
        "(Foo=1 or Bar starts \"1\" or Bar=1) and Baz=1",
      )
      forAll(filterExpressions)(assertParsable)
    }
  }

  Feature("Grammar rejects invalid filters") {
    Scenario("Values are not expressions") {
      val filterExpressions = Table(
        "Foo",
        "\"Foo\"",
        "1",
        "true",
        "[\"Foo\"]"
      )
      forAll(filterExpressions)(assertNotParsable)
    }
    Scenario("Equality comparison requires scalar") {
      val filterExpressions = Table(
        "Foo = Abc",
        "Foo = [ 1, 2, 3 ]",
        "Foo != Abc",
        "Foo != [ 1, 2, 3 ]",
      )
      forAll(filterExpressions)(assertNotParsable)
    }
    Scenario("Magnitude comparison requires numeric operand") {
      val filterExpressions = Table(
        "Foo > Abc",
        "Foo > \"Abc\"",
        "Foo > true",
        "Foo > .5",
        "Foo > 1.",
        "Foo >= *.",
        "Foo > [ 1, 2, 3 ]",
      )
      forAll(filterExpressions)(assertNotParsable)
    }
    Scenario("IDs cannot be used as STRINGs") {
      val filterExpressions = Table(
        "Foo != bar",
        "Foo  = bar",
        "Foo starts bar",
        "Foo ends bar",
        "Foo contains bar",
        "Foo in [ GenRepublisher-1.00.01, GenRepublisher-1.00.00, FixProxy-1.23.45 ]",
        "Foo in [ foobar ]",
      )
      forAll(filterExpressions)(assertNotParsable)
    }
    Scenario("Sets of booleans dont make sense") {
      val filterExpressions = Table(
        "Foo in [ true ]",
        "Foo in [ true, false]",
      )
      forAll(filterExpressions)(assertNotParsable)
    }
    Scenario("Do not tolerate trailing garbage") {
      val filterExpressions = Table(
        "Foo=1 or Bar=1 or Bar=1 and Baz=1 .",
        "Foo=1 or Bar=1 or Bar=1 and Baz=1 ))))",
      )
      forAll(filterExpressions)(assertNotParsable)
    }
  }

  Feature("Applying the parsed filters yields expected results") {
    Scenario("Equality comparison to STRING") {
      assertFilteredRows("ric = \"AAPL.L\"",
        row("tradeTime" -> 5L, "quantity" -> null, "ric" -> "AAPL.L", "orderId" -> "NYC-0004", "onMkt" -> false, "trader" -> "chris", "ccyCross" -> "GBPUSD")
      )
    }

    Scenario("Difference comparison to STRING") {
      assertFilteredRows("ric != \"AAPL.L\"",
        row("ric" -> "VOD.L", "orderId" -> "LDN-0001", "onMkt" -> true, "trader" -> "chris", "ccyCross" -> "GBPUSD", "tradeTime" -> 2L, "quantity" -> 100.0d),
        row("ric" -> "BT.L", "orderId" -> "LDN-0002", "onMkt" -> true, "trader" -> "steve", "ccyCross" -> "GBPUSD", "tradeTime" -> 1L, "quantity" -> 100.0d),
        row("ric" -> "VOD.L", "orderId" -> "LDN-0003", "onMkt" -> true, "trader" -> "chris", "ccyCross" -> "GBPUSD", "tradeTime" -> 3L, "quantity" -> null),
        row("ric" -> "BT.L", "orderId" -> "LDN-0008", "onMkt" -> true, "trader" -> "chris", "ccyCross" -> "GBPUSD", "tradeTime" -> 5L, "quantity" -> 100.0d),
        row("ric" -> "VOD.L", "orderId" -> "NYC-0002", "onMkt" -> false, "trader" -> "steve", "ccyCross" -> "GBPUSD", "tradeTime" -> 6L, "quantity" -> 100.0d),
        row("ric" -> "VOD.L", "orderId" -> "NYC-0010", "onMkt" -> true, "trader" -> "steve", "ccyCross" -> "GBPUSD", "tradeTime" -> 6L, "quantity" -> null),
        row("ric" -> "VOD/L", "orderId" -> "NYC-0011", "onMkt" -> true, "trader" -> "steve", "ccyCross" -> "GBPUSD", "tradeTime" -> 6L, "quantity" -> 105.0d),
        row("ric" -> "VOD\\L", "orderId" -> "NYC-0012", "onMkt" -> true, "trader" -> "steve", "ccyCross" -> "GBPUSD", "tradeTime" -> 6L, "quantity" -> null),
        row("ric" -> "VOD\\L", "orderId" -> "NYC-0013", "onMkt" -> true, "trader" -> "rahúl", "ccyCross" -> "$GBPUSD", "tradeTime" -> 6L, "quantity" -> null)
      )
    }

    Scenario("Belonging to set (indexed)") {
      assertFilteredRows("ric in [\"AAPL.L\",\"BT.L\"]",
        row("tradeTime" -> 5L, "quantity" -> null, "ric" -> "AAPL.L", "orderId" -> "NYC-0004", "onMkt" -> false, "trader" -> "chris", "ccyCross" -> "GBPUSD"),
        row("tradeTime" -> 1L, "quantity" -> 100.0d, "ric" -> "BT.L", "orderId" -> "LDN-0002", "onMkt" -> true, "trader" -> "steve", "ccyCross" -> "GBPUSD"),
        row("tradeTime" -> 5L, "quantity" -> 100.0d, "ric" -> "BT.L", "orderId" -> "LDN-0008", "onMkt" -> true, "trader" -> "chris", "ccyCross" -> "GBPUSD")
      )
    }

    Scenario("Belonging to set (unindexed)") {
      assertFilteredRows("trader in [\"steve\", \"rahúl\"]",
        row("tradeTime" -> 1L, "quantity" -> 100.0d, "ric" -> "BT.L", "orderId" -> "LDN-0002", "onMkt" -> true, "trader" -> "steve", "ccyCross" -> "GBPUSD"),
        row("tradeTime" -> 6L, "quantity" -> 100.0d, "ric" -> "VOD.L", "orderId" -> "NYC-0002", "onMkt" -> false, "trader" -> "steve", "ccyCross" -> "GBPUSD"),
        row("tradeTime" -> 6L, "quantity" -> null, "ric" -> "VOD.L", "orderId" -> "NYC-0010", "onMkt" -> true, "trader" -> "steve", "ccyCross" -> "GBPUSD"),
        row("tradeTime" -> 6L, "quantity" -> 105.0d, "ric" -> "VOD/L", "orderId" -> "NYC-0011", "onMkt" -> true, "trader" -> "steve", "ccyCross" -> "GBPUSD"),
        row("tradeTime" -> 6L, "quantity" -> null, "ric" -> "VOD\\L", "orderId" -> "NYC-0012", "onMkt" -> true, "trader" -> "steve", "ccyCross" -> "GBPUSD"),
        row("tradeTime" -> 6L, "quantity" -> null, "ric" -> "VOD\\L", "orderId" -> "NYC-0013", "onMkt" -> true, "trader" -> "rahúl", "ccyCross" -> "$GBPUSD")
      )
    }

    Scenario("Greater than") {
      assertFilteredRows("tradeTime > 4",
        row("ric" -> "VOD.L", "orderId" -> "NYC-0002", "onMkt" -> false, "trader" -> "steve", "ccyCross" -> "GBPUSD", "tradeTime" -> 6L, "quantity" -> 100.0d),
        row("ric" -> "VOD.L", "orderId" -> "NYC-0010", "onMkt" -> true, "trader" -> "steve", "ccyCross" -> "GBPUSD", "tradeTime" -> 6L, "quantity" -> null),
        row("ric" -> "VOD/L", "orderId" -> "NYC-0011", "onMkt" -> true, "trader" -> "steve", "ccyCross" -> "GBPUSD", "tradeTime" -> 6L, "quantity" -> 105.0d),
        row("ric" -> "VOD\\L", "orderId" -> "NYC-0012", "onMkt" -> true, "trader" -> "steve", "ccyCross" -> "GBPUSD", "tradeTime" -> 6L, "quantity" -> null),
        row("ric" -> "VOD\\L", "orderId" -> "NYC-0013", "onMkt" -> true, "trader" -> "rahúl", "ccyCross" -> "$GBPUSD", "tradeTime" -> 6L, "quantity" -> null),
        row("ric" -> "AAPL.L", "orderId" -> "NYC-0004", "onMkt" -> false, "trader" -> "chris", "ccyCross" -> "GBPUSD", "tradeTime" -> 5L, "quantity" -> null),
        row("ric" -> "BT.L", "orderId" -> "LDN-0008", "onMkt" -> true, "trader" -> "chris", "ccyCross" -> "GBPUSD", "tradeTime" -> 5L, "quantity" -> 100.0d)
      )
    }

    Scenario("Greater than equal") {
      assertFilteredRows("tradeTime >= 5",
        row("ric" -> "VOD.L", "orderId" -> "NYC-0002", "onMkt" -> false, "trader" -> "steve", "ccyCross" -> "GBPUSD", "tradeTime" -> 6L, "quantity" -> 100.0d),
        row("ric" -> "VOD.L", "orderId" -> "NYC-0010", "onMkt" -> true, "trader" -> "steve", "ccyCross" -> "GBPUSD", "tradeTime" -> 6L, "quantity" -> null),
        row("ric" -> "VOD/L", "orderId" -> "NYC-0011", "onMkt" -> true, "trader" -> "steve", "ccyCross" -> "GBPUSD", "tradeTime" -> 6L, "quantity" -> 105.0d),
        row("ric" -> "VOD\\L", "orderId" -> "NYC-0012", "onMkt" -> true, "trader" -> "steve", "ccyCross" -> "GBPUSD", "tradeTime" -> 6L, "quantity" -> null),
        row("ric" -> "VOD\\L", "orderId" -> "NYC-0013", "onMkt" -> true, "trader" -> "rahúl", "ccyCross" -> "$GBPUSD", "tradeTime" -> 6L, "quantity" -> null),
        row("ric" -> "AAPL.L", "orderId" -> "NYC-0004", "onMkt" -> false, "trader" -> "chris", "ccyCross" -> "GBPUSD", "tradeTime" -> 5L, "quantity" -> null),
        row("ric" -> "BT.L", "orderId" -> "LDN-0008", "onMkt" -> true, "trader" -> "chris", "ccyCross" -> "GBPUSD", "tradeTime" -> 5L, "quantity" -> 100.0d)
      )
    }

    Scenario("OR clause") {
      assertFilteredRows("tradeTime > 4 or orderId = \"LDN-0002\"",
        row("ric" -> "VOD.L", "orderId" -> "NYC-0002", "onMkt" -> false, "trader" -> "steve", "ccyCross" -> "GBPUSD", "tradeTime" -> 6L, "quantity" -> 100.0d),
        row("ric" -> "VOD.L", "orderId" -> "NYC-0010", "onMkt" -> true, "trader" -> "steve", "ccyCross" -> "GBPUSD", "tradeTime" -> 6L, "quantity" -> null),
        row("ric" -> "VOD/L", "orderId" -> "NYC-0011", "onMkt" -> true, "trader" -> "steve", "ccyCross" -> "GBPUSD", "tradeTime" -> 6L, "quantity" -> 105.0d),
        row("ric" -> "VOD\\L", "orderId" -> "NYC-0012", "onMkt" -> true, "trader" -> "steve", "ccyCross" -> "GBPUSD", "tradeTime" -> 6L, "quantity" -> null),
        row("ric" -> "VOD\\L", "orderId" -> "NYC-0013", "onMkt" -> true, "trader" -> "rahúl", "ccyCross" -> "$GBPUSD", "tradeTime" -> 6L, "quantity" -> null),
        row("ric" -> "AAPL.L", "orderId" -> "NYC-0004", "onMkt" -> false, "trader" -> "chris", "ccyCross" -> "GBPUSD", "tradeTime" -> 5L, "quantity" -> null),
        row("ric" -> "BT.L", "orderId" -> "LDN-0008", "onMkt" -> true, "trader" -> "chris", "ccyCross" -> "GBPUSD", "tradeTime" -> 5L, "quantity" -> 100.0d),
        row("ric" -> "BT.L", "orderId" -> "LDN-0002", "onMkt" -> true, "trader" -> "steve", "ccyCross" -> "GBPUSD", "tradeTime" -> 1L, "quantity" -> 100.0d)
      )
    }

    Scenario("Starts-with STRING") {
      assertFilteredRows("orderId starts \"LDN\"",
        row("tradeTime" -> 2L, "quantity" -> 100.0d, "ric" -> "VOD.L", "orderId" -> "LDN-0001", "onMkt" -> true, "trader" -> "chris", "ccyCross" -> "GBPUSD"),
        row("tradeTime" -> 1L, "quantity" -> 100.0d, "ric" -> "BT.L", "orderId" -> "LDN-0002", "onMkt" -> true, "trader" -> "steve", "ccyCross" -> "GBPUSD"),
        row("tradeTime" -> 3L, "quantity" -> null, "ric" -> "VOD.L", "orderId" -> "LDN-0003", "onMkt" -> true, "trader" -> "chris", "ccyCross" -> "GBPUSD"),
        row("tradeTime" -> 5L, "quantity" -> 100.0d, "ric" -> "BT.L", "orderId" -> "LDN-0008", "onMkt" -> true, "trader" -> "chris", "ccyCross" -> "GBPUSD")
      )
    }

    Scenario("Ends-with STRING") {
      assertFilteredRows("orderId ends \"08\"",
        row("tradeTime" -> 5L, "quantity" -> 100.0d, "ric" -> "BT.L", "orderId" -> "LDN-0008", "onMkt" -> true, "trader" -> "chris", "ccyCross" -> "GBPUSD")
      )
    }

    Scenario("Contains STRING") {
      assertFilteredRows("ric contains \"OD/\"",
        row("tradeTime" -> 6L, "quantity" -> 105.0d, "ric" -> "VOD/L", "orderId" -> "NYC-0011", "onMkt" -> true, "trader" -> "steve", "ccyCross" -> "GBPUSD"),
      )
    }

    Scenario("Lesser than") {
      assertFilteredRows("quantity < 100")
    }

    Scenario("Lesser than equal") {
      assertFilteredRows("quantity <= 105",
        row("ric" -> "VOD.L", "orderId" -> "LDN-0001", "onMkt" -> true, "trader" -> "chris", "ccyCross" -> "GBPUSD", "tradeTime" -> 2l, "quantity" -> 100.0d),
        row("tradeTime" -> 6L, "quantity" -> 105.0d, "ric" -> "VOD/L", "orderId" -> "NYC-0011", "onMkt" -> true, "trader" -> "steve", "ccyCross" -> "GBPUSD"),
        row("ric" -> "BT.L", "orderId" -> "LDN-0002", "onMkt" -> true, "trader" -> "steve", "ccyCross" -> "GBPUSD", "tradeTime" -> 1l, "quantity" -> 100.0d),
        row("ric" -> "BT.L", "orderId" -> "LDN-0008", "onMkt" -> true, "trader" -> "chris", "ccyCross" -> "GBPUSD", "tradeTime" -> 5l, "quantity" -> 100.0d),
        row("ric" -> "VOD.L", "orderId" -> "NYC-0002", "onMkt" -> false, "trader" -> "steve", "ccyCross" -> "GBPUSD", "tradeTime" -> 6l, "quantity" -> 100.0d)
      )
    }

    Scenario("Equality to STRING containing reserved chars in the grammar") {
      assertFilteredRows("ric = \"VOD/L\"",
        row("ric" -> "VOD/L", "orderId" -> "NYC-0011", "onMkt" -> true, "trader" -> "steve", "ccyCross" -> "GBPUSD", "tradeTime" -> 6L, "quantity" -> 105.0d)
      )
    }

    Scenario("Equality to STRING containing Unicode characters") {
      assertFilteredRows("trader = \"rahúl\"",
        row("ric" -> "VOD\\L", "orderId" -> "NYC-0013", "onMkt" -> true, "trader" -> "rahúl", "ccyCross" -> "$GBPUSD", "tradeTime" -> 6L, "quantity" -> null)
      )
    }

    Scenario("Equality to STRING containing $ character") {
      assertFilteredRows("ccyCross = \"$GBPUSD\"",
        row("ric" -> "VOD\\L", "orderId" -> "NYC-0013", "onMkt" -> true, "trader" -> "rahúl", "ccyCross" -> "$GBPUSD", "tradeTime" -> 6L, "quantity" -> null)
      )
    }

    Scenario("filter on a non-existent column returns empty results") {
      val table = setupTable2()
      val clause = filterClause("ccyCross = \"$GBPUSD\" and nonExistent = 10")
      getFilteredRows(table, clause).map(_.key).toSet shouldEqual immutable.Set.empty
    }
  }
}
