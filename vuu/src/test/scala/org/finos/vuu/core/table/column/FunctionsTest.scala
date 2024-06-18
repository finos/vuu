package org.finos.vuu.core.table.column

import org.finos.vuu.core.table.column.CalculatedColumnClauseTest.{areEqual, containErrorMsg, givenClause, givenRow}
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class FunctionsTest extends AnyFeatureSpec with Matchers {
  Feature("OrFunction") {
    Scenario("should return true if any one of the clauses evaluate to true") {
      val clauses = List(givenClause("not-true"), EqualsClause(givenClause(6), givenClause(6.0)), givenClause(false))
      val result = OrFunction(clauses).calculate(givenRow())
      areEqual(result, true)
    }

    Scenario("should short-circuit if any one of the clauses evaluate to true") {
      val clauses = List(givenClause(true), MaxFunction(List(givenClause("will-error"))))
      val result = OrFunction(clauses).calculate(givenRow())
      areEqual(result, true)
    }

    Scenario("should return error if one of the clauses errors and no true clause encountered") {
      val clauses = List(givenClause(false), MaxFunction(List(givenClause("will-error"))), givenClause(true))
      val result = OrFunction(clauses).calculate(givenRow())
      containErrorMsg(result, "unable to apply")
    }

    Scenario("should return false when no true or error encountered ignoring any non-boolean or non-true clauses") {
      val clauses = List(givenClause(false), givenClause(null), givenClause(3.5))
      val result = OrFunction(clauses).calculate(givenRow())
      areEqual(result, false)
    }
  }

  Feature("AndFunction") {
    Scenario("should return false if any one of the clauses evaluate to false and no error encountered") {
      val clauses = List(EqualsClause(givenClause(6), givenClause(6.0)), givenClause(false))
      val result = AndFunction(clauses).calculate(givenRow())
      areEqual(result, false)
    }

    Scenario("should short-circuit if any one of the clauses evaluate to false") {
      val clauses = List(givenClause(false), MaxFunction(List(givenClause("will-error"))))
      val result = AndFunction(clauses).calculate(givenRow())
      areEqual(result, false)
    }

    Scenario("should treat null as false") {
      val clauses = List(givenClause(null), MaxFunction(List(givenClause("will-error"))))
      val result = AndFunction(clauses).calculate(givenRow())
      areEqual(result, false)
    }

    Scenario("should treat any non-boolean value as false") {
      val clauses = List(givenClause("i-am-false"), MaxFunction(List(givenClause("will-error"))))
      val result = AndFunction(clauses).calculate(givenRow())
      areEqual(result, false)
    }

    Scenario("should return error if one of the clauses errors and no falsey clause encountered") {
      val clauses = List(givenClause(true), MaxFunction(List(givenClause("will-error"))), givenClause(false))
      val result = AndFunction(clauses).calculate(givenRow())
      containErrorMsg(result, "unable to apply")
    }

    Scenario("should return true when no falsey value or error encountered") {
      val clauses = List(givenClause(true), GreaterThanClause(givenClause(5.5), givenClause(5.25)))
      val result = AndFunction(clauses).calculate(givenRow())
      areEqual(result, true)
    }
  }

  Feature("IfFunction") {
    Scenario("evaluates and returns `then` clause when condition clause evaluates to true") {
      val condition :: thenClause :: elseClause :: _ = List(givenClause(true), givenClause("then"), givenClause("else"))
      val res = IfFunction(condition, thenClause, elseClause).calculate(givenRow())
      areEqual(res, "then")
    }

    Scenario("evaluates and returns `else` clause when condition clause evaluates to false") {
      val condition :: thenClause :: elseClause :: _ = List(givenClause(false), givenClause("then"), givenClause("else"))
      val res = IfFunction(condition, thenClause, elseClause).calculate(givenRow())
      areEqual(res, "else")
    }

    Scenario("evaluates and returns `else` clause when condition clause evaluates to not true") {
      val condition :: thenClause :: elseClause :: _ = List(givenClause(15.5), givenClause("then"), givenClause("else"))
      val res = IfFunction(condition, thenClause, elseClause).calculate(givenRow())
      areEqual(res, "else")
    }

    Scenario("returns error when condition clause evaluation errors") {
      val condition :: thenClause :: elseClause :: _ = List(DivisionClause(List(givenClause("string"))), givenClause("then"), givenClause("else"))
      val res = IfFunction(condition, thenClause, elseClause).calculate(givenRow())
      containErrorMsg(res, "unable to apply")
    }
  }
}
