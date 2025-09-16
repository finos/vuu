package org.finos.vuu.core.filter

import org.finos.vuu.core.table.{RowWithData, SimpleColumn}
import org.finos.vuu.viewport.ViewPortColumns
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers
import org.scalatest.prop.TableDrivenPropertyChecks._

class FilterClauseTest extends AnyFeatureSpec with Matchers {

  Feature("EqualsClause.filter") {

    val rowData = Map(
      "null-col" -> null,
      "ric" -> "TEST.L",
      "size" -> 4,
      "timestamp" -> 5L,
      "priceInFloat" -> 100f,
      "priceInDouble" -> 100.0d,
      "true-col" -> true,
      "false-col" -> false,
      "empty-string-col" -> "",
    )
    val testRow = RowWithData("Key", rowData)

    forAll(Table(
      ("columnType", "columnName", "value", "expected"),
      ("String", "ric", "TEST.L", true),
      ("String", "ric", "TEST.NOT-EQ", false),
      ("Int", "size", "4", true),
      ("Int", "size", "7", false),
      ("Long", "timestamp", "5", true),
      ("Long", "timestamp", "0", false),
      ("Float", "priceInFloat", "100.0", true),
      ("Float", "priceInFloat", "100.1", false),
      ("Double", "priceInDouble", "100.0", true),
      ("Double", "priceInDouble", "100.1", false),
      ("Boolean", "true-col", "true", true),
      ("Boolean", "true-col", "false", false)
    ))((columnType, columnName, value, expected) => {
        Scenario(
          s"($columnType) should return $expected when value is " +
            s"$value and row data is ${testRow.get(columnName)}"
        ) {
          EqualsClause(columnName, value).filter(testRow) should equal(expected)
        }
    })

    forAll(Table(
      ("value", "expected"),
      ("", true),
      ("non-empty", false),
    ))((value, expected) => {
      Scenario(
        s"should return $expected when value is \"$value\" and row data is empty string"
      ) {
        EqualsClause("empty-string-col", value).filter(testRow) should equal(expected)
      }
    })

    Scenario("should return false if row data is null at the given field") {
      EqualsClause("null-col", "some-value").filter(testRow) should be (false)
    }

    forAll(Table(
      ("columnName", "value"),
      ("true-col", "TRUE"),
      ("true-col", "TrUe"),
      ("false-col", "FALSE"),
      ("false-col", "FaLse"),
    ))((columnName, value)=> {
      Scenario(s"should be case insensitive for boolean values - " +
        s"$value should be considered equal to ${testRow.get(columnName)}") {
        EqualsClause(columnName, value).filter(testRow) should equal(true)
      }
    })
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

      val result = InClause("assetClass", List("Fixed-income")).filter(row)

      result shouldBe true
    }

    Scenario("should return true when row at a given column matches one of the values in the list") {
      val row = givenARow(assetClass = "Fixed-income")

      val result = InClause("assetClass", List("Equity", "Options", "Fixed-income", "ETFs")).filter(row)

      result shouldBe true
    }

    Scenario("should return false when row at a given column doesn't match any of the values in the list") {
      val row = givenARow(assetClass = "Equity")

      val result = InClause("assetClass", List("Fixed-income", "Equity-2")).filter(row)

      result shouldBe false
    }

    Scenario("should return false when row value at a given column is null") {
      val row = givenARow(assetClass = null)

      val result = InClause("assetClass", List("Fixed-income", "null")).filter(row)

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
    val subclauses = List(EqualsClause("col-1", "abc"), InClause("col-3", List.empty))
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
        res.getError should include regex s"`col-1` not found(.|\n)*`col-3` not found"
      })
    }
  }

  private def givenARow(assetClass: String) = RowWithData("key", Map("assetClass" -> assetClass))
  private def givenVpColumns(names: List[String]) = ViewPortColumns(names.map(SimpleColumn(_, -1, classOf[Any])))
}
