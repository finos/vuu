package org.finos.vuu.core.table.column

import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.core.table.RowData
import org.finos.vuu.core.table.column.CalculatedColumnClause.OptionResult
import org.finos.vuu.core.table.column.ClauseDataType.{ClauseDataType, findWidest, isNumeric}
import org.finos.vuu.core.table.column.MathOpClause.{UnreachableCodeException, calculateAndApply}
import org.finos.vuu.core.table.column.OptionResult.toOptionResult

import scala.annotation.tailrec

abstract class MathOpClause(clauses: List[CalculatedColumnClause], op: MathOp) extends CalculatedColumnClause with StrictLogging {
  override def dataType: ClauseDataType = findWidest(clauses)

  override def calculate(data: RowData): OptionResult[AnyVal] = {
    this.dataType match {
      case ClauseDataType.LONG    => mathLong(clauses, data, op.apply(_, _).toLong)
      case ClauseDataType.INTEGER => mathInt(clauses, data, op.apply(_, _).toInt)
      case ClauseDataType.DOUBLE  => mathDouble(clauses, data, op.apply)
      case t                      => errorTemplate(s"unable to apply math operation `${op.name}` to data-type `$t`.")
    }
  }

  private def mathDouble(clauses: List[CalculatedColumnClause], data: RowData, op:(Double, Double) => Double): OptionResult[Double] =
    toOptionResult(mathCalc(clauses, op, coerceToDouble(_, data)))

  private def mathLong(clauses: List[CalculatedColumnClause], data: RowData, op: (Long, Long) => Long): OptionResult[Long] =
    toOptionResult(mathCalc(clauses, op, coerceToLong(_, data)))

  private def mathInt(clauses: List[CalculatedColumnClause], data: RowData, op: (Int, Int) => Int): OptionResult[Int] =
    toOptionResult(mathCalc(clauses, op, coerceToInt(_, data)))

  private def coerceToDouble(clause: CalculatedColumnClause, data: RowData): Result[Double] = calculateAndApply(clause, data)({
    case v: Int    => v.toDouble
    case v: Long   => v.toDouble
    case v: Double => v
    case v         => throw UnreachableCodeException(s"cannot coerce non-numeric `$v` to double.")
  })

  private def coerceToLong(clause: CalculatedColumnClause, data: RowData): Result[Long] = calculateAndApply(clause, data)({
    case v: Int    => v.toLong
    case v: Long   => v
    case v: Double => logger.warn(s"[Data loss] Unexpected coercion of double to long."); v.toLong;
    case v         => throw UnreachableCodeException(s"cannot coerce non-numeric `$v` to long.")
  })

  private def coerceToInt(clause: CalculatedColumnClause, data: RowData): Result[Int] = calculateAndApply(clause, data)({
    case v: Int    => v
    case v: Long   => logger.warn(s"[Data loss] Unexpected coercion of long to int."); v.toInt;
    case v: Double => logger.warn(s"[Data loss] Unexpected coercion of double to int."); v.toInt;
    case v         => throw UnreachableCodeException(s"cannot coerce non-numeric `$v` to int.")
  })

  private type Coercer[T] = CalculatedColumnClause => Result[T]
  private def mathCalc[T](clauses: List[CalculatedColumnClause], op: (T, T) => T, coercer: Coercer[T]): Result[T] = {
    clauses match {
      case List()       => errorTemplate(s"empty list of clauses passed to a math operation.")
      case head :: tail => mathCalcRecurs(tail, op, coercer, coercer(head))
    }
  }

  @tailrec
  private def mathCalcRecurs[T](clauses: List[CalculatedColumnClause], op: (T, T) => T, coercer: Coercer[T], accResult: Result[T]): Result[T] = {
    if (clauses.isEmpty) return accResult

    val coercedHead = coercer(clauses.head)
    if (coercedHead.isError) coercedHead
    else mathCalcRecurs(clauses.tail, op, coercer, accResult.map(op(_, coercedHead.getValue)))
  }
}

private sealed abstract class MathOp(val name: String, val apply: (Double, Double) => Double)
private object MathOp {
  final case object Add extends MathOp("addition", (a, b) => a + b)
  final case object Subtract extends MathOp("subtraction", (a, b) => a - b)
  final case object Multiply extends MathOp("multiplication", (a, b) => a * b)
  final case object Divide extends MathOp("division", (a, b) => a / b)
  final case object Max extends MathOp("max", (a, b) => Math.max(a , b))
  final case object Min extends MathOp("min", (a, b) => Math.min(a , b))
}

private object MathOpClause {
  def calculateAndApply[T](clause: CalculatedColumnClause, data: RowData)(apply: Any => T): Result[T] = {
    clause.calculate(data).flatMap(_.map(apply).map(Result(_)).getOrElse(Error(s"Unable to perform math operations on `null`.")))
  }

  case class UnreachableCodeException(msg: String) extends RuntimeException(s"[Unexpected: this should be unreachable] $msg")
}

case class MultiplyClause(clauses: List[CalculatedColumnClause]) extends MathOpClause(clauses, MathOp.Multiply)
object MultiplyClause{
  def apply(leftClause: CalculatedColumnClause, rightClause: CalculatedColumnClause): CalculatedColumnClause = {
    MultiplyClause(List(leftClause, rightClause))
  }
}

case class SubtractClause(clauses: List[CalculatedColumnClause]) extends MathOpClause(clauses, MathOp.Subtract)
object SubtractClause{
  def apply(leftClause: CalculatedColumnClause, rightClause: CalculatedColumnClause): CalculatedColumnClause = {
    SubtractClause(List(leftClause, rightClause))
  }
}

case class DivideClause(clauses: List[CalculatedColumnClause]) extends MathOpClause(clauses, MathOp.Divide) {
  override def dataType: ClauseDataType = super.dataType match {
    case ClauseDataType.LONG | ClauseDataType.INTEGER => ClauseDataType.DOUBLE
    case dataType => dataType
  }
}
object DivideClause{
  def apply(leftClause: CalculatedColumnClause, rightClause: CalculatedColumnClause): CalculatedColumnClause = {
    DivideClause(List(leftClause, rightClause))
  }
}

case class AddClause(clauses: List[CalculatedColumnClause]) extends MathOpClause(clauses, MathOp.Add)
object AddClause{
  def apply(leftClause: CalculatedColumnClause, rightClause: CalculatedColumnClause): CalculatedColumnClause = {
    AddClause(List(leftClause, rightClause))
  }
}

case class MinClause(clauses: List[CalculatedColumnClause]) extends MathOpClause(clauses, MathOp.Min)
case class MaxClause(clauses: List[CalculatedColumnClause]) extends MathOpClause(clauses, MathOp.Max)
case class SumClause(clauses: List[CalculatedColumnClause]) extends MathOpClause(clauses, MathOp.Add)

case class AbsClause(clause: CalculatedColumnClause) extends CalculatedColumnClause {
  override def dataType: ClauseDataType = clause.dataType
  override def calculate(data: RowData): OptionResult[AnyVal] = {
    if (isNumeric(clause.dataType)) {
      val result = calculateAndApply[AnyVal](clause, data)({
        case v: Long   => Math.abs(v)
        case v: Int    => Math.abs(v)
        case v: Double => Math.abs(v)
        case v         => throw UnreachableCodeException(s"cannot apply `abs` to non-numeric `$v`.")
      })
      toOptionResult(result)
    }
    else errorTemplate(s"unsupported type `${clause.dataType}` for Math.abs.")
  }
}
