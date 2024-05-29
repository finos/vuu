package org.finos.vuu.core.table.column

import org.finos.vuu.core.table.column.CalculatedColumnClauseTest.{areEqual, givenClause, givenRow}
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers
import org.scalatest.prop.TableDrivenPropertyChecks.forAll
import org.scalatest.prop.Tables.Table

class ComparisonClausesTest extends AnyFeatureSpec with Matchers {

  Feature("EqualsClause") {
    forAll(Table(
      ("test", "clause1", "clause2", "expected"),
      ("match", givenClause("field"), givenClause("field"), true),
      ("not matched", givenClause("field"), givenClause("fieldX"), false),
      ("null match with null", givenClause(null), givenClause(null), true),
      ("null match with non-null", givenClause(null), givenClause("field"), false),
    ))((test, c1, c2, expected) => {
      Scenario(s"should return $expected when $test") {
        val res = EqualsClause(c1, c2).calculate(givenRow())
        areEqual(res, expected)
      }
    })

    Scenario("should return error when one of the clauses return error") {
      val successClause = givenClause(10.5)
      val errorClause = AdditionClause(List.empty)

      EqualsClause(successClause, errorClause).calculate(givenRow()).isError shouldBe true
      EqualsClause(errorClause, successClause).calculate(givenRow()).isError shouldBe true
      EqualsClause(errorClause, errorClause).calculate(givenRow()).isError shouldBe true
    }
  }

  Feature("GreaterThanClause") {
    forAll(Table(
      ("test", "clause1", "clause2", "expected"),
      ("(numeric) left < right", givenClause(10.5), givenClause(11L), false),
      ("(numeric) left > right", givenClause(11), givenClause(5.99), true),
      ("(boolean) left < right", givenClause(false), givenClause(true), false),
      ("(boolean) left > right", givenClause(true), givenClause(false), true),
      ("(string) left < right", givenClause("game"), givenClause("name"), false),
      ("(string) left > right", givenClause("name"), givenClause("game"), true),
    ))((test, c1, c2, expected) => {
      Scenario(s"should return $expected when $test") {
        val res = GreaterThanClause(c1, c2).calculate(givenRow())
        areEqual(res, expected)
      }
    })

    Scenario("should return error when one of the clauses evaluate to null") {
      val successClause = givenClause(10.5)
      val nullClause = givenClause(null)

      GreaterThanClause(successClause, nullClause).calculate(givenRow()).isError shouldBe true
      GreaterThanClause(nullClause, successClause).calculate(givenRow()).isError shouldBe true
      GreaterThanClause(nullClause, nullClause).calculate(givenRow()).isError shouldBe true
    }

    Scenario("should return error when one of the clauses return error") {
      val successClause = givenClause(10.5)
      val errorClause = AdditionClause(List.empty)

      GreaterThanClause(successClause, errorClause).calculate(givenRow()).isError shouldBe true
      GreaterThanClause(errorClause, successClause).calculate(givenRow()).isError shouldBe true
      GreaterThanClause(errorClause, errorClause).calculate(givenRow()).isError shouldBe true
    }
  }

  Feature("LesserThanClause") {
    forAll(Table(
      ("test", "clause1", "clause2", "expected"),
      ("(numeric) left > right", givenClause(25.5), givenClause(5.5), false),
      ("(numeric) left < right", givenClause(20), givenClause(110.01), true),
      ("(boolean) left > right", givenClause(true), givenClause(false), false),
      ("(boolean) left < right", givenClause(false), givenClause(true), true),
      ("(string) left > right", givenClause("name"), givenClause("game"), false),
      ("(string) left < right", givenClause("game"), givenClause("name"), true),
    ))((test, c1, c2, expected) => {
      Scenario(s"should return $expected when $test") {
        val res = LesserThanClause(c1, c2).calculate(givenRow())
        areEqual(res, expected)
      }
    })

    Scenario("should return error when one of the clauses evaluate to null") {
      val successClause = givenClause(10.5)
      val nullClause = givenClause(null)

      LesserThanClause(successClause, nullClause).calculate(givenRow()).isError shouldBe true
      LesserThanClause(nullClause, successClause).calculate(givenRow()).isError shouldBe true
      LesserThanClause(nullClause, nullClause).calculate(givenRow()).isError shouldBe true
    }

    Scenario("should return error when one of the clauses return error") {
      val successClause = givenClause(10.5)
      val errorClause = AdditionClause(List.empty)

      LesserThanClause(successClause, errorClause).calculate(givenRow()).isError shouldBe true
      LesserThanClause(errorClause, successClause).calculate(givenRow()).isError shouldBe true
      LesserThanClause(errorClause, errorClause).calculate(givenRow()).isError shouldBe true
    }
  }
}
