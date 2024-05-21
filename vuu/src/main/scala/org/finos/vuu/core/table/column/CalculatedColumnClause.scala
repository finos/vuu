package org.finos.vuu.core.table.column

import org.finos.vuu.core.table.column.CalculatedColumnClause.{OptionResult, convert}
import org.finos.vuu.core.table.column.ClauseDataType.{ClauseDataType, isNumeric}
import org.finos.vuu.core.table.column.OptionResult.toOptionResult
import org.finos.vuu.core.table.{Column, RowData, column}

import scala.util.Try

trait CalculatedColumnClause {
  def errorTemplate(msg: String): Error = Error(s"[ERROR] ${this.toString} - $msg")
  def dataType: ClauseDataType
  def calculate(data: RowData): OptionResult[Any]
}

object CalculatedColumnClause {
  type OptionResult[T] = Result[Option[T]]

  def convert[ReturnType](v: Any, parser: String => ReturnType): OptionResult[ReturnType] = {
    def safeParser: String => Result[ReturnType] = s => Result.toResult(Try(parser(s)))
    Option(v).map(_.toString).map(safeParser).map(toOptionResult).getOrElse(Result(None))
  }
}

object OptionResult {
  def apply[T](v: T): OptionResult[T] = Result(Option(v))
  def toOptionResult[T](r: Result[T]): OptionResult[T] = r.map(Option.apply)
}

object ClauseDataType extends Enumeration
{
  // creating with type alias
  type ClauseDataType = Value
  // values foe enum
  val INTEGER: column.ClauseDataType.Value = Value(1)
  val LONG: column.ClauseDataType.Value = Value(2)
  val DOUBLE: column.ClauseDataType.Value = Value(3)
  val BOOLEAN: column.ClauseDataType.Value = Value(4)
  val STRING: column.ClauseDataType.Value = Value(5)
  var ERROR: column.ClauseDataType.Value = Value(6)
  val NULL: column.ClauseDataType.Value = Value(-1)
  val LIST: column.ClauseDataType.Value = Value(-5)

  def isNumeric(dataType: ClauseDataType): Boolean = {
    Set(ClauseDataType.DOUBLE, ClauseDataType.INTEGER, ClauseDataType.LONG).contains(dataType)
  }

  def findWidest(cs: List[CalculatedColumnClause]): ClauseDataType = {
    cs.sortBy(_.dataType).reverse.headOption.map(_.dataType).getOrElse(ClauseDataType.ERROR)
  }
}

case class NullCalculatedColumnClause() extends CalculatedColumnClause {
  override def dataType: ClauseDataType = ClauseDataType.NULL
  def calculate(data: RowData): OptionResult[Nothing] = Result(None)
}

case class LiteralIntColumnClause(i: Int) extends CalculatedColumnClause {

  override def dataType: ClauseDataType = ClauseDataType.INTEGER

  def calculate(data: RowData): OptionResult[Int] = OptionResult(i)
}

case class LiteralBooleanColumnClause(b: Boolean) extends CalculatedColumnClause {

  override def dataType: ClauseDataType = ClauseDataType.BOOLEAN

  def calculate(data: RowData): OptionResult[Boolean] = OptionResult(b)
}

case class LiteralDoubleColumnClause(i: Double) extends CalculatedColumnClause {

  override def dataType: ClauseDataType = ClauseDataType.DOUBLE

  def calculate(data: RowData): OptionResult[Double] = OptionResult(i)
}

case class LiteralLongColumnClause(i: Long) extends CalculatedColumnClause{

  override def dataType: ClauseDataType = ClauseDataType.LONG

  def calculate(data: RowData): OptionResult[Long] = OptionResult(i)
}

case class LiteralStringColumnClause(i: String) extends CalculatedColumnClause {

  override def dataType: ClauseDataType = ClauseDataType.STRING

  def calculate(data: RowData): OptionResult[String] = OptionResult(i)
}

case class ExpressionClause(innerClause: CalculatedColumnClause) extends CalculatedColumnClause {

  override def dataType: ClauseDataType = innerClause.dataType

  override def calculate(data: RowData): OptionResult[Any] = innerClause.calculate(data)
}

case class ErrorClause(message: String) extends CalculatedColumnClause {
  override def dataType: ClauseDataType = ClauseDataType.ERROR
  override def calculate(data: RowData): OptionResult[Nothing] = errorTemplate(message)
  override def toString: String = "ErrorClause"
}

case class IntColumnClause(column: Column) extends CalculatedColumnClause{
  override def dataType: ClauseDataType = ClauseDataType.INTEGER
  override def calculate(data: RowData): OptionResult[Int] = convert(data.get(column), _.toInt)
}

case class DoubleColumnClause(column: Column) extends CalculatedColumnClause{
  override def dataType: ClauseDataType = ClauseDataType.DOUBLE
  override def calculate(data: RowData): OptionResult[Double] = convert(data.get(column), _.toDouble)
}

case class LongColumnClause(column: Column) extends CalculatedColumnClause {
  override def dataType: ClauseDataType = ClauseDataType.LONG
  override def calculate(data: RowData): OptionResult[Long] = convert(data.get(column), _.toLong)
}

case class BooleanColumnClause(column: Column) extends CalculatedColumnClause{
  override def dataType: ClauseDataType = ClauseDataType.BOOLEAN
  override def calculate(data: RowData): OptionResult[Boolean] = convert(data.get(column), _.toBoolean)
}

case class StringColumnClause(column: Column) extends CalculatedColumnClause {
  override def dataType: ClauseDataType = ClauseDataType.STRING
  override def calculate(data: RowData): OptionResult[String] = convert(data.get(column), s => s)
}

case class EqualsClause(left: CalculatedColumnClause, right: CalculatedColumnClause) extends CalculatedColumnClause {

  override def dataType: ClauseDataType = ClauseDataType.BOOLEAN

  def calculate(data: RowData): OptionResult[Boolean] = {
    (left.calculate(data), right.calculate(data)) match {
      case (Success(l), Success(r)) => OptionResult(l.orNull == r.orNull)
      case (errL, errR) => errorTemplate(s"evaluating one of the clauses resulted in an error: LEFT $errL | RIGHT $errR")
    }
  }
}

case class GreaterThanClause(left: CalculatedColumnClause, right: CalculatedColumnClause) extends OrderComparisonClause(left, right, OrderOp.GT)
case class LesserThanClause(left: CalculatedColumnClause, right: CalculatedColumnClause) extends OrderComparisonClause(left, right, OrderOp.LT)

abstract class OrderComparisonClause(leftClause: CalculatedColumnClause, rightClause: CalculatedColumnClause, op: OrderOp) extends CalculatedColumnClause {
  override def dataType: ClauseDataType = ClauseDataType.BOOLEAN

  override def calculate(data: RowData): OptionResult[Boolean] = {
    (leftClause.calculate(data), rightClause.calculate(data)) match {
      case (Success(lValue), Success(rValue)) => (lValue, rValue) match {
        case (Some(l), Some(r)) => OptionResult(applyOperation(l, r))
        case _ => errorTemplate(s"`null` values not supported for order comparisons.")
      }
      case (_, _) => errorTemplate(s"evaluating one of the clauses resulted in an error.")
    }
  }

  private def applyOperation(l: Any, r: Any): Boolean = {
    if (isNumeric(leftClause.dataType) && isNumeric(rightClause.dataType)) {
      op.apply(l.toString.toDouble, r.toString.toDouble)
    } else {
      op.apply(l.toString, r.toString)
    }
  }
}

sealed abstract class OrderOp { def apply[T](v1: T, v2: T)(implicit  ordering: Ordering[T]): Boolean }
object OrderOp {
  final case object GT extends OrderOp {
    override def apply[T](v1: T, v2: T)(implicit ordering: Ordering[T]): Boolean = ordering.gt(v1, v2)
  }
  final case object LT extends OrderOp {
    override def apply[T](v1: T, v2: T)(implicit ordering: Ordering[T]): Boolean = ordering.lt(v1, v2)
  }
}
