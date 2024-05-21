package org.finos.vuu.core.table.column

import org.finos.vuu.core.table.column.CalculatedColumnClause.OptionResult
import org.finos.vuu.core.table.column.CalculatedColumnClauseTest._
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers
import org.scalatest.prop.TableDrivenPropertyChecks.forAll
import org.scalatest.prop.Tables.Table

class MathOpClauseTest extends AnyFeatureSpec with Matchers {

  Feature("MultiplyClause") {
    forAll(Table(
      ("case", "clauses", "expected"),
      ("can calculate for literal int clauses", List(givenClause(10), givenClause(20)), 200),
      ("can calculate for literal long clauses", List(givenClause(10L), givenClause(25L), givenClause(2L)), 500L),
      ("can calculate for literal double clauses", List(givenClause(10.5), givenClause(2.0)), 21.0),
      ("can calculate for mixed literal double, int, and long clauses", List(givenClause(10.5), givenClause(10), givenClause(2L)), 210.0),
      ("returns value unchanged if only one clause", List(givenClause(10L)), 10),
      ("returns error for any string clause", List(givenClause(10.5), givenClause("10")), "unable to apply.* to data-type `STRING`"),
      ("returns error for any boolean clause", List(givenClause(10.5), givenClause(true)), "unable to apply.* to data-type `BOOLEAN`"),
      ("returns error for empty clauses", List.empty, "unable to apply.* to data-type `ERROR`"),
      ("returns error for any null clause", List(givenClause(10.5), givenClause(null)), "Unable to perform math operations on `null`")
    ))((testCase, clauses, expected) => {
      Scenario(testCase) {
        val result = MultiplyClause(clauses).calculate(givenRow())

        assertResult(result, expected)
      }
    })
  }

  Feature("DivideClause") {
    forAll(Table(
      ("case", "clauses", "expected"),
      ("can calculate for mixed numeric clauses", List(givenClause(25.5), givenClause(10), givenClause(2L)), 1.275),
      ("can calculate for numeric non-double clauses", List(givenClause(11L), givenClause(2)), 5.5),
      ("returns value unchanged if only one clause", List(givenClause(10L)), 10),
      ("returns error for any null clause", List(givenClause(10.5), givenClause(null)), "Unable to perform math operations on `null`")
    ))((testCase, clauses, expected) => {
      Scenario(testCase) {
        val result = DivideClause(clauses).calculate(givenRow())

        assertResult(result, expected)
      }
    })

    Scenario("can calculate with a numeric `if function` sub-clause") {
      val ifClause = IfFunction(givenClause(true), givenClause(5.5), givenClause(2))

      val result = DivideClause(List(ifClause, givenClause(2))).calculate(givenRow())

      assertResult(result, 2.75)
    }

    Scenario("returns error when `if function`'s then sub-clause is non-numeric") {
      val ifClause = IfFunction(givenClause(false), givenClause(true), givenClause(2))

      val res = DivideClause(List(ifClause, givenClause(2))).calculate(givenRow())

      assertResult(res, "unable to apply math operation `division`")
    }

    Scenario("returns error when `if function`'s else sub-clause is non-numeric") {
      val ifClause = IfFunction(givenClause(false), givenClause(5), givenClause("abc"))

      val res = DivideClause(List(ifClause, givenClause(2))).calculate(givenRow())

      assertResult(res, "unable to apply math operation `division`")
    }
  }

  Feature("AddClause") {
    forAll(Table(
      ("case", "clauses", "expected"),
      ("can calculate for mixed numeric clauses", List(givenClause(25.5), givenClause(10), givenClause(2L)), 37.5),
      ("returns value unchanged if only one clause", List(givenClause(10L)), 10),
      ("returns error for any null clause", List(givenClause(10.5), givenClause(null)), "Unable to perform math operations on `null`")
    ))((testCase, clauses, expected) => {
      Scenario(testCase) {
        val result = AddClause(clauses).calculate(givenRow())

        assertResult(result, expected)
      }
    })


  }

  Feature("SubtractClause") {
    forAll(Table(
      ("case", "clauses", "expected"),
      ("can calculate for mixed numeric clauses", List(givenClause(25.5), givenClause(10), givenClause(2L)), 13.5),
      ("returns value unchanged if only one clause", List(givenClause(10L)), 10),
      ("returns error for any null clause", List(givenClause(10.5), givenClause(null)), "Unable to perform math operations on `null`")
    ))((testCase, clauses, expected) => {
      Scenario(testCase) {
        val result = SubtractClause(clauses).calculate(givenRow())

        assertResult(result, expected)
      }
    })
  }

  Feature("MaxClause") {
    forAll(Table(
      ("case", "clauses", "expected"),
      ("can calculate for literal int clauses", List(givenClause(10), givenClause(20)), 20),
      ("can calculate for literal long clauses", List(givenClause(10L), givenClause(25L)), 25L),
      ("can calculate for literal double clauses", List(givenClause(10.5), givenClause(2.0)), 10.5),
      ("can calculate for mixed literal double, int, and long clauses", List(givenClause(10.5), givenClause(10), givenClause(2L)), 10.5),
      ("returns value unchanged if only one clause", List(givenClause(10L)), 10),
      ("returns error for any null clause", List(givenClause(10.5), givenClause(null)), "Unable to perform math operations on `null`"),
      ("returns error for any string clause", List(givenClause(10.5), givenClause("10")), "unable to apply.* to data-type `STRING`"),
      ("returns error for any boolean clause", List(givenClause(10.5), givenClause(true)), "unable to apply.* to data-type `BOOLEAN`"),
      ("returns error for empty clauses", List.empty, "unable to apply.* to data-type `ERROR`"),
    ))((testCase, clauses, expected) => {
      Scenario(testCase) {
        val result = MaxClause(clauses).calculate(givenRow())

        assertResult(result, expected)
      }
    })
  }

  Feature("MinClause") {
    forAll(Table(
      ("case", "clauses", "expected"),
      ("can calculate for literal int clauses", List(givenClause(10), givenClause(20)), 10),
      ("can calculate for literal long clauses", List(givenClause(10L), givenClause(25L)), 10L),
      ("can calculate for literal double clauses", List(givenClause(10.5), givenClause(2.0)), 2.0),
      ("can calculate for mixed literal double, int, and long clauses", List(givenClause(10.5), givenClause(10), givenClause(2L)), 2L),
      ("returns value unchanged if only one clause", List(givenClause(10L)), 10),
      ("returns error for any null clause", List(givenClause(10.5), givenClause(null)), "Unable to perform math operations on `null`"),
      ("returns error for any string clause", List(givenClause(10.5), givenClause("10")), "unable to apply.* to data-type `STRING`"),
      ("returns error for any boolean clause", List(givenClause(10.5), givenClause(true)), "unable to apply.* to data-type `BOOLEAN`"),
      ("returns error for empty clauses", List.empty, "unable to apply.* to data-type `ERROR`"),
    ))((testCase, clauses, expected) => {
      Scenario(testCase) {
        val result = MinClause(clauses).calculate(givenRow())

        assertResult(result, expected)
      }
    })
  }

  Feature("AbsClause") {
    forAll(Table(
      ("case", "clause", "expected"),
      ("can get abs for literal int clause", givenClause(-10), 10),
      ("can get abs for literal long clause", givenClause(-10L), 10L),
      ("can get abs for literal double clause", givenClause(-10.5), 10.5),
      ("returns value unchanged if already positive", givenClause(10L), 10L),
      ("returns error for any null clause", givenClause(null), "Unable to perform math operations on `null`"),
      ("returns error for any non-numeric clause", givenClause("10"), "unsupported type `STRING`"),
    ))((testCase, clause, expected) => {
      Scenario(testCase) {
        val result = AbsClause(clause).calculate(givenRow())

        assertResult(result, expected)
      }
    })
  }

  private def assertResult(result: OptionResult[Any], expected: Any): Unit = {
    if (expected.isInstanceOf[String]) containErrorMsg(result, expected.toString)
    else areEqual(result, expected)
  }
}
