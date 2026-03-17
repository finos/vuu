package org.finos.vuu.core.filter

import org.finos.vuu.core.table.datatype.Scale.{Four, Two}
import org.finos.vuu.core.table.datatype.{EpochTimestamp, Scale, ScaledDecimal, ScaledDecimal2, ScaledDecimal4, ScaledDecimal6, ScaledDecimal8}
import org.finos.vuu.core.table.{RowWithData, SimpleColumn}
import org.finos.vuu.viewport.ViewPortColumns
import org.scalatest.GivenWhenThen
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers
import org.scalatest.prop.TableDrivenPropertyChecks

import java.lang.reflect.Constructor

class FilterClauseTest extends AnyFeatureSpec with Matchers with GivenWhenThen with TableDrivenPropertyChecks {

  private def givenARow(assetClass: String) = RowWithData("key", Map("assetClass" -> assetClass))

  private def givenVpColumns(names: List[String]) = ViewPortColumns(names.map(SimpleColumn(_, -1, classOf[Any])))

  Feature("EqualsClause.filter") {

    val rowData = Map(
      "null-col" -> null,
      "ric" -> "TEST.L",
      "size" -> 4,
      "timestamp" -> 5L,
      "priceInDouble" -> 100.0d,
      "true-col" -> true,
      "false-col" -> false,
      "empty-string-col" -> "",
      "epoch-column" -> EpochTimestamp(1L),
      "scaled2-column" -> ScaledDecimal("2.22", Scale.Two),
      "scaled4-column" -> ScaledDecimal("4.4444", Scale.Four),
      "scaled6-column" -> ScaledDecimal("6.666666", Scale.Six),
      "scaled8-column" -> ScaledDecimal("8.88888888", Scale.Eight),
    )
    val testRow = RowWithData("Key", rowData)

    Scenario("Basic type checks") {

      forAll(Table(
        ("columnType", "columnName", "value", "expected"),
        ("String", "ric", "TEST.L", true),
        ("String", "ric", "TEST.NOT-EQ", false),
        ("Int", "size", "4", true),
        ("Int", "size", "7", false),
        ("Long", "timestamp", "5", true),
        ("Long", "timestamp", "0", false),
        ("Double", "priceInDouble", "100.0", true),
        ("Double", "priceInDouble", "100.1", false),
        ("Boolean", "true-col", "true", true),
        ("Boolean", "true-col", "false", false),
        ("EpochTimestamp", "epoch-column", "1", true),
        ("EpochTimestamp", "epoch-column", "2", false),
        ("ScaledDecimal2", "scaled2-column", "2.22", true),
        ("ScaledDecimal2", "scaled2-column", "3.99", false),
        ("ScaledDecimal4", "scaled4-column", "4.4444", true),
        ("ScaledDecimal4", "scaled4-column", "5.8888", false),
        ("ScaledDecimal6", "scaled6-column", "6.666666", true),
        ("ScaledDecimal6", "scaled6-column", "7.777777", false),
        ("ScaledDecimal8", "scaled8-column", "8.88888888", true),
        ("ScaledDecimal8", "scaled8-column", "9.66666666", false),
      ))((columnType, columnName, value, expected) => {
        EqualsClause(columnName, value).filter(testRow) should equal(expected)
      })

    }

    Scenario("Strings") {
      forAll(Table(
        ("value", "expected"),
        ("", true),
        ("non-empty", false),
      ))((value, expected) => {
        EqualsClause("empty-string-col", value).filter(testRow) should equal(expected)
      })
    }

    Scenario("Nulls") {
      EqualsClause("null-col", "some-value").filter(testRow) should be (false)
    }

    Scenario("Booleans") {
      forAll(Table(
        ("columnName", "value"),
        ("true-col", "TRUE"),
        ("true-col", "TrUe"),
        ("false-col", "FALSE"),
        ("false-col", "FaLse"),
      ))((columnName, value) => {
          EqualsClause(columnName, value).filter(testRow) should equal(true)
      })
    }

  }

  Feature("ContainsClause.filter") {
    Scenario("should return true when row at a given column contains the substring") {
      val row = givenARow(assetClass = "Fixed income products")

      val result = ContainsClause("assetClass", "income").filter(row)

      result shouldBe true
    }

    Scenario("should return false when row at a given column does not contain the substring") {
      val row = givenARow(assetClass = "Fixed income products")

      val result = ContainsClause("assetClass", "incomes").filter(row)

      result shouldBe false
    }

    Scenario("should return false when row at a given column is null") {
      val row = givenARow(assetClass = null)

      val result = ContainsClause("assetClass", "substring").filter(row)

      result shouldBe false
    }
  }

  Feature("InClause.filter") {

    Scenario("should return true when row at a given column matches the only value in the list") {
      val row = givenARow(assetClass = "Fixed-income")

      val result = InClause("assetClass", Set("Fixed-income")).filter(row)

      result shouldBe true
    }

    Scenario("should return true when row at a given column matches one of the values in the list") {
      val row = givenARow(assetClass = "Fixed-income")

      val result = InClause("assetClass", Set("Equity", "Options", "Fixed-income", "ETFs")).filter(row)

      result shouldBe true
    }

    Scenario("should return false when row at a given column doesn't match any of the values in the list") {
      val row = givenARow(assetClass = "Equity")

      val result = InClause("assetClass", Set("Fixed-income", "Equity-2")).filter(row)

      result shouldBe false
    }

    Scenario("should return false when row value at a given column is null") {
      val row = givenARow(assetClass = null)

      val result = InClause("assetClass", Set("Fixed-income", "null")).filter(row)

      result shouldBe false
    }
  }

  Feature("RowFilterClause.validate") {
    val clause: RowFilterClause = EqualsClause("col-1", "abc")

    Scenario("returns success if column found in passed vp columns") {
      val vpColumns = givenVpColumns(List("col-0", "col-1"))

      clause.validate(vpColumns).isSuccess should be (true)
    }

    Scenario("returns error if column not found in passed vp columns") {
      val vpColumns = givenVpColumns(List("col-0", "col-1.0"))

      val res = clause.validate(vpColumns)

      res.isError should be (true)
      res.getError should include (s"`col-1` not found")
    }
  }

  Feature("NotClause.validate") {
    val clause: NotClause = NotClause(EqualsClause("col-1", "abc"))

    Scenario("returns success if inner clause is valid") {
      val vpColumns = givenVpColumns(List("col-0", "col-1"))

      clause.validate(vpColumns).isSuccess should be (true)
    }

    Scenario("returns error if inner clause is invalid") {
      val vpColumns = givenVpColumns(List("col-0", "col-1.0"))

      val res = clause.validate(vpColumns)

      res.isError should be (true)
      res.getError should include (s"`col-1` not found")
    }
  }

  Feature("(And|Or)Clause.validate") {
    val subclauses: Array[FilterClause] = Array(EqualsClause("col-1", "abc"), InClause("col-3", Set.empty))
    val andClause = AndClause(subclauses)
    val orClause = OrClause(subclauses)

    Scenario("returns success if all sub-clauses are valid") {
      forAll(Table("clause", andClause, orClause))(clause => {
        val vpColumns = givenVpColumns(List("col-0", "col-1", "col-3"))

        clause.validate(vpColumns).isSuccess should be (true)
      })
    }

    Scenario("returns error if a sub-clause is invalid") {
      forAll(Table("clause", andClause, orClause))(clause => {
        val vpColumns = givenVpColumns(List("col-0", "col-1"))

        val res = clause.validate(vpColumns)

        res.isError should be (true)
        res.getError should include (s"`col-3` not found")
      })
    }

    Scenario("returns error with concatenated error msg if more than one sub-clause is invalid") {
      forAll(Table("clause", andClause, orClause))(clause => {
        val vpColumns = givenVpColumns(List("col-0", "col-2"))

        val res = clause.validate(vpColumns)

        res.isError should be (true)
        res.getError should include regex s"`col-1` not found(.|${System.lineSeparator()})*`col-3` not found"
      })
    }
  }

  Feature("NumericComparisonClause.filter") {

    def performValidation(constructor: (String, String) => NumericComparisonClause,
                          filterStr: String, datum: Any, expected: Boolean, description: String) = {
      val clause = constructor("test_column", filterStr)

      Given(s"a ${clause.getClass.getSimpleName} with filter '$filterStr'")
      When(s"applying filter to $description datum: $datum")

      val result = clause.applyFilter(datum)

      Then(s"the result should be $expected")
      result shouldBe expected
    }

    Scenario("Validating Int across all clauses") {

      val comparisonTable = Table(
        ("Clause Factory", "Filter Val", "Input Datum", "Expected", "Type Description"),

        (GreaterThanClause.apply _, "9", 10, true, "GreaterThan: Higher"),
        (GreaterThanClause.apply _, "11", 10, false, "GreaterThan: Lower"),
        (GreaterThanClause.apply _, "10", 10, false, "GreaterThan: Equal"),
        (GreaterThanOrEqualsClause.apply _, "9", 10, true, "GreaterThanOrEquals: Higher"),
        (GreaterThanOrEqualsClause.apply _, "11", 10, false, "GreaterThanOrEquals: Lower"),
        (GreaterThanOrEqualsClause.apply _, "10", 10, true, "GreaterThanOrEquals: Equal"),
        (LessThanClause.apply _, "9", 10, false, "LessThan: Higher"),
        (LessThanClause.apply _, "11", 10, true, "LessThan: Lower"),
        (LessThanClause.apply _, "10", 10, false, "LessThan: Equal"),
        (LessThanOrEqualsClause.apply _, "9", 10, false, "LessThanOrEquals: Higher"),
        (LessThanOrEqualsClause.apply _, "11", 10, true, "LessThanOrEquals: Lower"),
        (LessThanOrEqualsClause.apply _, "10", 10, true, "LessThanOrEquals: Equal"),
      )

      forAll(comparisonTable) { (constructor, filterStr, datum, expected, description) =>
        performValidation(constructor, filterStr, datum, expected, description)
      }

    }

    Scenario("Validating Long across all clauses") {

      val comparisonTable = Table(
        ("Clause Factory", "Filter Val", "Input Datum", "Expected", "Type Description"),
        (GreaterThanClause.apply _, "9", 10L, true, "GreaterThan: Higher"),
        (GreaterThanClause.apply _, "11", 10L, false, "GreaterThan: Lower"),
        (GreaterThanClause.apply _, "10", 10L, false, "GreaterThan: Equal"),
        (GreaterThanOrEqualsClause.apply _, "9", 10L, true, "GreaterThanOrEquals: Higher"),
        (GreaterThanOrEqualsClause.apply _, "11", 10L, false, "GreaterThanOrEquals: Lower"),
        (GreaterThanOrEqualsClause.apply _, "10", 10L, true, "GreaterThanOrEquals: Equal"),
        (LessThanClause.apply _, "9", 10L, false, "LessThan: Higher"),
        (LessThanClause.apply _, "11", 10L, true, "LessThan: Lower"),
        (LessThanClause.apply _, "10", 10L, false, "LessThan: Equal"),
        (LessThanOrEqualsClause.apply _, "9", 10L, false, "LessThanOrEquals: Higher"),
        (LessThanOrEqualsClause.apply _, "11", 10L, true, "LessThanOrEquals: Lower"),
        (LessThanOrEqualsClause.apply _, "10", 10L, true, "LessThanOrEquals: Equal"),
      )

      forAll(comparisonTable) { (constructor, filterStr, datum, expected, description) =>
        performValidation(constructor, filterStr, datum, expected, description)
      }

    }

    Scenario("Validating Double across all clauses") {

      val comparisonTable = Table(
        ("Clause Factory", "Filter Val", "Input Datum", "Expected", "Type Description"),
        (GreaterThanClause.apply _, "9", 10.0d, true, "GreaterThan: Higher"),
        (GreaterThanClause.apply _, "11", 10.0d, false, "GreaterThan: Lower"),
        (GreaterThanClause.apply _, "10", 10.0d, false, "GreaterThan: Equal"),
        (GreaterThanOrEqualsClause.apply _, "9", 10.0d, true, "GreaterThanOrEquals: Higher"),
        (GreaterThanOrEqualsClause.apply _, "11", 10.0d, false, "GreaterThanOrEquals: Lower"),
        (GreaterThanOrEqualsClause.apply _, "10", 10.0d, true, "GreaterThanOrEquals: Equal"),
        (LessThanClause.apply _, "9", 10.0d, false, "LessThan: Higher"),
        (LessThanClause.apply _, "11", 10.0d, true, "LessThan: Lower"),
        (LessThanClause.apply _, "10", 10.0d, false, "LessThan: Equal"),
        (LessThanOrEqualsClause.apply _, "9", 10.0d, false, "LessThanOrEquals: Higher"),
        (LessThanOrEqualsClause.apply _, "11", 10.0d, true, "LessThanOrEquals: Lower"),
        (LessThanOrEqualsClause.apply _, "10", 10.0d, true, "LessThanOrEquals: Equal"),
      )

      forAll(comparisonTable) { (constructor, filterStr, datum, expected, description) =>
        performValidation(constructor, filterStr, datum, expected, description)
      }

    }

    Scenario("Validating EpochTimestamp across all clauses") {

      val comparisonTable = Table(
        ("Clause Factory", "Filter Val", "Input Datum", "Expected", "Type Description"),
        (GreaterThanClause.apply _, "9", EpochTimestamp(10L), true, "GreaterThan: Higher"),
        (GreaterThanClause.apply _, "11", EpochTimestamp(10L), false, "GreaterThan: Lower"),
        (GreaterThanClause.apply _, "10", EpochTimestamp(10L), false, "GreaterThan: Equal"),
        (GreaterThanOrEqualsClause.apply _, "9", EpochTimestamp(10L), true, "GreaterThanOrEquals: Higher"),
        (GreaterThanOrEqualsClause.apply _, "11", EpochTimestamp(10L), false, "GreaterThanOrEquals: Lower"),
        (GreaterThanOrEqualsClause.apply _, "10", EpochTimestamp(10L), true, "GreaterThanOrEquals: Equal"),
        (LessThanClause.apply _, "9", EpochTimestamp(10L), false, "LessThan: Higher"),
        (LessThanClause.apply _, "11", EpochTimestamp(10L), true, "LessThan: Lower"),
        (LessThanClause.apply _, "10", EpochTimestamp(10L), false, "LessThan: Equal"),
        (LessThanOrEqualsClause.apply _, "9", EpochTimestamp(10L), false, "LessThanOrEquals: Higher"),
        (LessThanOrEqualsClause.apply _, "11", EpochTimestamp(10L), true, "LessThanOrEquals: Lower"),
        (LessThanOrEqualsClause.apply _, "10", EpochTimestamp(10L), true, "LessThanOrEquals: Equal"),
      )

      forAll(comparisonTable) { (constructor, filterStr, datum, expected, description) =>
        performValidation(constructor, filterStr, datum, expected, description)
      }

    }

    Scenario("Validating ScaledDecimal2 across all clauses") {

      val comparisonTable = Table(
        ("Clause Factory", "Filter Val", "Input Datum", "Expected", "Type Description"),
        (GreaterThanClause.apply _, "10.10", ScaledDecimal("10.11", Scale.Two), true, "GreaterThan: Higher"),
        (GreaterThanClause.apply _, "10.12", ScaledDecimal("10.11", Scale.Two), false, "GreaterThan: Lower"),
        (GreaterThanClause.apply _, "10.11", ScaledDecimal("10.11", Scale.Two), false, "GreaterThan: Equal"),
        (GreaterThanOrEqualsClause.apply _, "10.10", ScaledDecimal("10.11", Scale.Two), true, "GreaterThanOrEquals: Higher"),
        (GreaterThanOrEqualsClause.apply _, "10.12", ScaledDecimal("10.11", Scale.Two), false, "GreaterThanOrEquals: Lower"),
        (GreaterThanOrEqualsClause.apply _, "10.11", ScaledDecimal("10.11", Scale.Two), true, "GreaterThanOrEquals: Equal"),
        (LessThanClause.apply _, "10.10", ScaledDecimal("10.11", Scale.Two), false, "LessThan: Higher"),
        (LessThanClause.apply _, "10.12", ScaledDecimal("10.11", Scale.Two), true, "LessThan: Lower"),
        (LessThanClause.apply _, "10.11", ScaledDecimal("10.11", Scale.Two), false, "LessThan: Equal"),
        (LessThanOrEqualsClause.apply _, "10.10", ScaledDecimal("10.11", Scale.Two), false, "LessThanOrEquals: Higher"),
        (LessThanOrEqualsClause.apply _, "10.12", ScaledDecimal("10.11", Scale.Two), true, "LessThanOrEquals: Lower"),
        (LessThanOrEqualsClause.apply _, "10.11", ScaledDecimal("10.11", Scale.Two), true, "LessThanOrEquals: Equal"),
      )

      forAll(comparisonTable) { (constructor, filterStr, datum, expected, description) =>
        performValidation(constructor, filterStr, datum, expected, description)
      }

    }

    Scenario("Validating ScaledDecimal4 across all clauses") {

      val comparisonTable = Table(
        ("Clause Factory", "Filter Val", "Input Datum", "Expected", "Type Description"),
        (GreaterThanClause.apply _, "10.1110", ScaledDecimal("10.1111", Scale.Four), true, "GreaterThan: Higher"),
        (GreaterThanClause.apply _, "10.1112", ScaledDecimal("10.1111", Scale.Four), false, "GreaterThan: Lower"),
        (GreaterThanClause.apply _, "10.1111", ScaledDecimal("10.1111", Scale.Four), false, "GreaterThan: Equal"),
        (GreaterThanOrEqualsClause.apply _, "10.1110", ScaledDecimal("10.1111", Scale.Four), true, "GreaterThanOrEquals: Higher"),
        (GreaterThanOrEqualsClause.apply _, "10.1112", ScaledDecimal("10.1111", Scale.Four), false, "GreaterThanOrEquals: Lower"),
        (GreaterThanOrEqualsClause.apply _, "10.1111", ScaledDecimal("10.1111", Scale.Four), true, "GreaterThanOrEquals: Equal"),
        (LessThanClause.apply _, "10.1110", ScaledDecimal("10.1111", Scale.Four), false, "LessThan: Higher"),
        (LessThanClause.apply _, "10.1112", ScaledDecimal("10.1111", Scale.Four), true, "LessThan: Lower"),
        (LessThanClause.apply _, "10.1111", ScaledDecimal("10.1111", Scale.Four), false, "LessThan: Equal"),
        (LessThanOrEqualsClause.apply _, "10.1110", ScaledDecimal("10.1111", Scale.Four), false, "LessThanOrEquals: Higher"),
        (LessThanOrEqualsClause.apply _, "10.1112", ScaledDecimal("10.1111", Scale.Four), true, "LessThanOrEquals: Lower"),
        (LessThanOrEqualsClause.apply _, "10.1111", ScaledDecimal("10.1111", Scale.Four), true, "LessThanOrEquals: Equal"),
      )

      forAll(comparisonTable) { (constructor, filterStr, datum, expected, description) =>
        performValidation(constructor, filterStr, datum, expected, description)
      }

    }

    Scenario("Validating ScaledDecimal6 across all clauses") {

      val comparisonTable = Table(
        ("Clause Factory", "Filter Val", "Input Datum", "Expected", "Type Description"),
        (GreaterThanClause.apply _, "10.111110", ScaledDecimal("10.111111", Scale.Six), true, "GreaterThan: Higher"),
        (GreaterThanClause.apply _, "10.111112", ScaledDecimal("10.111111", Scale.Six), false, "GreaterThan: Lower"),
        (GreaterThanClause.apply _, "10.111111", ScaledDecimal("10.111111", Scale.Six), false, "GreaterThan: Equal"),
        (GreaterThanOrEqualsClause.apply _, "10.111110", ScaledDecimal("10.111111", Scale.Six), true, "GreaterThanOrEquals: Higher"),
        (GreaterThanOrEqualsClause.apply _, "10.111112", ScaledDecimal("10.111111", Scale.Six), false, "GreaterThanOrEquals: Lower"),
        (GreaterThanOrEqualsClause.apply _, "10.111111", ScaledDecimal("10.111111", Scale.Six), true, "GreaterThanOrEquals: Equal"),
        (LessThanClause.apply _, "10.111110", ScaledDecimal("10.111111", Scale.Six), false, "LessThan: Higher"),
        (LessThanClause.apply _, "10.111112", ScaledDecimal("10.111111", Scale.Six), true, "LessThan: Lower"),
        (LessThanClause.apply _, "10.111111", ScaledDecimal("10.111111", Scale.Six), false, "LessThan: Equal"),
        (LessThanOrEqualsClause.apply _, "10.111110", ScaledDecimal("10.111111", Scale.Six), false, "LessThanOrEquals: Higher"),
        (LessThanOrEqualsClause.apply _, "10.111112", ScaledDecimal("10.111111", Scale.Six), true, "LessThanOrEquals: Lower"),
        (LessThanOrEqualsClause.apply _, "10.111111", ScaledDecimal("10.111111", Scale.Six), true, "LessThanOrEquals: Equal"),
      )

      forAll(comparisonTable) { (constructor, filterStr, datum, expected, description) =>
        performValidation(constructor, filterStr, datum, expected, description)
      }

    }

    Scenario("Validating ScaledDecimal8 across all clauses") {

      val comparisonTable = Table(
        ("Clause Factory", "Filter Val", "Input Datum", "Expected", "Type Description"),
        (GreaterThanClause.apply _, "10.11111110", ScaledDecimal("10.11111111", Scale.Eight), true, "GreaterThan: Higher"),
        (GreaterThanClause.apply _, "10.11111112", ScaledDecimal("10.11111111", Scale.Eight), false, "GreaterThan: Lower"),
        (GreaterThanClause.apply _, "10.11111111", ScaledDecimal("10.11111111", Scale.Eight), false, "GreaterThan: Equal"),
        (GreaterThanOrEqualsClause.apply _, "10.11111110", ScaledDecimal("10.11111111", Scale.Eight), true, "GreaterThanOrEquals: Higher"),
        (GreaterThanOrEqualsClause.apply _, "10.11111112", ScaledDecimal("10.11111111", Scale.Eight), false, "GreaterThanOrEquals: Lower"),
        (GreaterThanOrEqualsClause.apply _, "10.11111111", ScaledDecimal("10.11111111", Scale.Eight), true, "GreaterThanOrEquals: Equal"),
        (LessThanClause.apply _, "10.11111110", ScaledDecimal("10.11111111", Scale.Eight), false, "LessThan: Higher"),
        (LessThanClause.apply _, "10.11111112", ScaledDecimal("10.11111111", Scale.Eight), true, "LessThan: Lower"),
        (LessThanClause.apply _, "10.11111111", ScaledDecimal("10.11111111", Scale.Eight), false, "LessThan: Equal"),
        (LessThanOrEqualsClause.apply _, "10.11111110", ScaledDecimal("10.11111111", Scale.Eight), false, "LessThanOrEquals: Higher"),
        (LessThanOrEqualsClause.apply _, "10.11111112", ScaledDecimal("10.11111111", Scale.Eight), true, "LessThanOrEquals: Lower"),
        (LessThanOrEqualsClause.apply _, "10.11111111", ScaledDecimal("10.11111111", Scale.Eight), true, "LessThanOrEquals: Equal"),
      )

      forAll(comparisonTable) { (constructor, filterStr, datum, expected, description) =>
        performValidation(constructor, filterStr, datum, expected, description)
      }

    }

  }



 }
