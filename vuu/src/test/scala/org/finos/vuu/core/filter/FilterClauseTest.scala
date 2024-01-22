package org.finos.vuu.core.filter

import org.finos.vuu.core.table.RowWithData
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers
import org.scalatest.prop.TableDrivenPropertyChecks._

class FilterClauseTest extends AnyFeatureSpec with Matchers {

  private val testRow = RowWithData("Key", Map(
    "null-col" -> null,
    "ric" -> "TEST.L",
    "size" -> 4,
    "timestamp" -> 5L,
    "priceInFloat" -> 100f,
    "priceInDouble" -> 100.0d,
    "true-col" -> true,
    "false-col" -> false,
    "empty-string-col" -> "",
  ))

  Feature("EqualsClause.filter") {

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

    Scenario("should return false when field not found in row") {
      EqualsClause("absent-field", "some-value").filter(testRow) should equal(false)
    }

    // @todo should we handle missing data better? So that user can select something like `missing` and rows with missing data/null are matched?
    Scenario("should return false when row data is null regardless of the value passed") {
      EqualsClause("null-col", "any-value").filter(testRow) should equal(false)
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
}
