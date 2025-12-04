package org.finos.vuu.core.filter

import org.antlr.v4.runtime.misc.ParseCancellationException
import org.finos.toolbox.time.{Clock, TestFriendlyClock}
import org.finos.vuu.core.filter.FilterSpecParser.parse as filterClause
import org.finos.vuu.core.sort.FilterAndSortFixture.*
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers
import org.scalatest.prop.TableDrivenPropertyChecks.*

class FilterGrammarTest extends AnyFeatureSpec with Matchers {
  def assertParsable(filter: String): Unit = filterClause(filter) shouldBe a[FilterClause]
  def assertNotParsable(filter: String): Unit = an [ParseCancellationException] should be thrownBy filterClause(filter)
  def assertFilteredRows(filter: String, expectedKeys: Set[String]): Unit = {
    info(s"FILTER: $filter")

    val table = setupTable2()
    val clause = filterClause(filter)
    val resultRows = getFilteredRows(table, clause)

    withClue(s"PARSED: $clause\n") {
      assertRows(resultRows.toSet, expectedKeys)
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
        Set("NYC-0004")
      )
    }

    Scenario("Difference comparison to STRING") {
      assertFilteredRows("ric != \"AAPL.L\"",
        Set("LDN-0001","LDN-0002","LDN-0003", "LDN-0008", "NYC-0002", "NYC-0010", "NYC-0011", "NYC-0012", "NYC-0013")
      )
    }

    Scenario("Belonging to set (indexed)") {
      assertFilteredRows("ric in [\"AAPL.L\",\"BT.L\"]",
        Set("NYC-0004", "LDN-0002", "LDN-0008")
      )
    }

    Scenario("Belonging to set (unindexed)") {
      assertFilteredRows("trader in [\"steve\", \"rahúl\"]",
        Set("LDN-0002", "NYC-0002", "NYC-0010", "NYC-0011", "NYC-0012", "NYC-0013")
      )
    }

    Scenario("Greater than") {
      assertFilteredRows("tradeTime > 4",
        Set("NYC-0002", "NYC-0010", "NYC-0011", "NYC-0012", "NYC-0013", "NYC-0004", "LDN-0008")
      )
    }

    Scenario("Greater than equal") {
      assertFilteredRows("tradeTime >= 5",
        Set("NYC-0002", "NYC-0010", "NYC-0011", "NYC-0012", "NYC-0013", "NYC-0004", "LDN-0008")
      )
    }

    Scenario("OR clause") {
      assertFilteredRows("tradeTime > 4 or orderId = \"LDN-0002\"",
        Set("NYC-0002", "NYC-0010", "NYC-0011", "NYC-0012", "NYC-0013", "NYC-0004", "LDN-0008", "LDN-0002")
      )
    }

    Scenario("Starts-with STRING") {
      assertFilteredRows("orderId starts \"LDN\"",
        Set("LDN-0001", "LDN-0002", "LDN-0003", "LDN-0008")
      )
    }

    Scenario("Ends-with STRING") {
      assertFilteredRows("orderId ends \"08\"",
        Set("LDN-0008")
      )
    }

    Scenario("Contains STRING") {
      assertFilteredRows("ric contains \"OD/\"",
        Set("NYC-0011")
      )
    }

    Scenario("Lesser than") {
      assertFilteredRows("quantity < 100", Set())
    }

    Scenario("Lesser than equal") {
      assertFilteredRows("quantity <= 105",
        Set("LDN-0001", "NYC-0011", "LDN-0002", "LDN-0008", "NYC-0002")
      )
    }

    Scenario("Equality to STRING containing reserved chars in the grammar") {
      assertFilteredRows("ric = \"VOD/L\"",
        Set("NYC-0011")
      )
    }

    Scenario("Equality to STRING containing Unicode characters") {
      assertFilteredRows("trader = \"rahúl\"",
        Set("NYC-0013")
      )
    }

    Scenario("Equality to STRING containing $ character") {
      assertFilteredRows("ccyCross = \"$GBPUSD\"",
        Set("NYC-0013")
      )
    }

    Scenario("filter on a non-existent column skips filtering and returns empty") {
      assertFilteredRows("ccyCross = \"$GBPUSD\" and nonExistent = 10",
        Set()
      )
    }
  }
}
