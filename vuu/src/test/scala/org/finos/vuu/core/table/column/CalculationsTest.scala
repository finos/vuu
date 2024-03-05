package org.finos.vuu.core.table.column

import org.finos.vuu.core.table.EmptyRowData
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers
import org.scalatest.prop.TableDrivenPropertyChecks.{forAll, Table}

class CalculationsTest extends AnyFeatureSpec with Matchers {

  Feature("mathDouble") {
    val divisionOp = (a: Double, b: Double) => a / b
    val multiplicationOp = (a: Double, b: Double) => a * b
    val subtractionOp = (a: Double, b: Double) => a - b

    forAll(Table(
      ("case", "operands", "op", "default", "expected"),
      ("subtraction with two operands", List(0.5, 1.5), subtractionOp, 0, -1),
      ("subtraction with more than two operands", List(0.5, 1.5, 0.5), subtractionOp, 0, -1.5),
      ("multiplication with two operands", List(10.0, 2), multiplicationOp, 0, 20),
      ("multiplication with more than two operands", List(10.0, -2, 5), multiplicationOp, 0, -100),
      ("multiplication when one operand is zero", List(10.0, 0), multiplicationOp, 0, 0),
      ("division with more than two operands", List(10.0, 2, -5), divisionOp, 0, -1),
      ("division when dividend is zero", List(0.0, 10.0), divisionOp, 0, 0),
      ("division when first dividend is zero with more than two operands", List(0, 2.0, 5), divisionOp, 0, 0),
      ("empty list of clauses by falling back to default", List.empty, divisionOp, -10, -10),
      ("single clause by simply returning its calculated value", List(15.5), divisionOp, 0, 15.5),
    ))((testCase, operands, op, default, expected) => {
      Scenario(s"can handle $testCase") {
        val clauses = operands.map(LiteralDoubleColumnClause)

        val actual = Calculations.mathDouble(clauses, EmptyRowData, op, default)

        actual shouldEqual expected
      }
    })

    Scenario(s"can handle nested division operation") {
      val clauses = List(DivideClause(List(LiteralDoubleColumnClause(5), LiteralDoubleColumnClause(2))), LiteralDoubleColumnClause(0.5))

      val actual = Calculations.mathDouble(clauses, EmptyRowData, divisionOp, 0)

      actual shouldEqual 5
    }

    Scenario(s"can handle mix of Long, Int and Double clauses") {
      val clauses = List(LiteralLongColumnClause(10), LiteralIntColumnClause(5), LiteralDoubleColumnClause(3.5))

      val actual = Calculations.mathDouble(clauses, EmptyRowData, multiplicationOp, 0)

      actual shouldEqual 175
    }
  }

  Feature("mathLong") {
    val multiplicationOp = (a: Long, b: Long) => a * b
    val subtractionOp = (a: Long, b: Long) => a - b

    forAll(Table(
      ("case", "operands", "op", "default", "expected"),
      ("subtraction with two operands", List(-1, 1L), subtractionOp, 0, -2),
      ("subtraction with more than two operands", List(5L, 5, 2), subtractionOp, 0, -2),
      ("multiplication with two operands", List(10, 2L), multiplicationOp, 0, 20),
      ("multiplication with more than two operands", List(10L, -2, 5), multiplicationOp, 0, -100),
      ("multiplication when one operand is zero", List(10L, 0), multiplicationOp, 0, 0),
      ("empty list of clauses by falling back to default", List.empty, multiplicationOp, -10, -10),
      ("single clause by simply returning its calculated value", List(15L), multiplicationOp, 0, 15),
    ))((testCase, operands, op, default, expected) => {
      Scenario(s"can handle $testCase") {
        val clauses = operands.map(LiteralLongColumnClause)

        val actual = Calculations.mathLong(clauses, EmptyRowData, op, default)

        actual shouldEqual expected
      }
    })

    Scenario(s"can handle mix of Long, Int and Double clauses (truncates any decimals)") {
      val clauses = List(LiteralLongColumnClause(10), LiteralIntColumnClause(5), LiteralDoubleColumnClause(3.5))

      val actual = Calculations.mathLong(clauses, EmptyRowData, multiplicationOp, 0)

      actual shouldEqual 150
    }
  }

  Feature("mathInt") {
    val multiplicationOp = (a: Int, b: Int) => a * b
    val subtractionOp = (a: Int, b: Int) => a - b

    forAll(Table(
      ("case", "operands", "op", "default", "expected"),
      ("subtraction with two operands", List(2, 1), subtractionOp, 0, 1),
      ("subtraction with more than two operands", List(2, 1, 2), subtractionOp, 0, -1),
      ("multiplication with two operands", List(10, 2), multiplicationOp, 0, 20),
      ("multiplication with more than two operands", List(10, -2, 5), multiplicationOp, 0, -100),
      ("multiplication when one operand is zero", List(10, 0), multiplicationOp, 0, 0),
      ("empty list of clauses by falling back to default", List.empty, multiplicationOp, -10, -10),
      ("single clause by simply returning its calculated value", List(15), multiplicationOp, 0, 15),
    ))((testCase, operands, op, default, expected) => {
      Scenario(s"can handle $testCase") {
        val clauses = operands.map(LiteralIntColumnClause)

        val actual = Calculations.mathInt(clauses, EmptyRowData, op, default)

        actual shouldEqual expected
      }
    })
  }

}
