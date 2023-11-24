package org.finos.vuu.core.table.column

import org.finos.vuu.core.table.column.ClauseDataType.ClauseDataType
import org.finos.vuu.core.table.{Column, RowData, column}

import java.lang.Number

object ClauseDataType extends Enumeration
{
  // creating with type alias
  type ClauseDataType = Value
  // values foe enum
  val BOOLEAN: column.ClauseDataType.Value = Value(1)
  val INTEGER: column.ClauseDataType.Value = Value(2)
  val LONG: column.ClauseDataType.Value = Value(3)
  val DOUBLE: column.ClauseDataType.Value = Value(4)
  val STRING: column.ClauseDataType.Value = Value(5)
  val NULL: column.ClauseDataType.Value = Value(-1)
  val LIST: column.ClauseDataType.Value = Value(-5)
}

object Clauses{
  def findWidest(cs: List[CalculatedColumnClause]): ClauseDataType = {
    cs.sortBy(_.dataType).reverse.head.dataType
  }

}

case class NullCalculatedColumnClause() extends CalculatedColumnClause {

  override def dataType: ClauseDataType = ClauseDataType.NULL

  def calculate(data: RowData): AnyRef = null
}

case class LiteralIntColumnClause(i: Int) extends CalculatedColumnClause {

  override def dataType: ClauseDataType = ClauseDataType.INTEGER

  def calculate(data: RowData): Any = i
}

case class LiteralBooleanColumnClause(b: Boolean) extends CalculatedColumnClause {

  override def dataType: ClauseDataType = ClauseDataType.BOOLEAN

  def calculate(data: RowData): Any = b
}

case class LiteralDoubleColumnClause(i: Double) extends CalculatedColumnClause {

  override def dataType: ClauseDataType = ClauseDataType.DOUBLE

  def calculate(data: RowData): Any = i
}

case class LiteralLongColumnClause(i: Long) extends CalculatedColumnClause{

  override def dataType: ClauseDataType = ClauseDataType.LONG

  def calculate(data: RowData): Any = i
}

case class LiteralStringColumnClause(i: String) extends CalculatedColumnClause {

  override def dataType: ClauseDataType = ClauseDataType.STRING

  def calculate(data: RowData): Any = i
}



trait CalculatedColumnClause {

  def dataType: ClauseDataType

  def calculate(data: RowData): Any
}

case class ExpressionClause(innerClause: CalculatedColumnClause) extends CalculatedColumnClause {

  override def dataType: ClauseDataType = innerClause.dataType

  override def calculate(data: RowData): Any = innerClause.calculate(data)
}

case class ErrorClause(message: String) extends CalculatedColumnClause {
  override def dataType: ClauseDataType = ClauseDataType.STRING

  override def calculate(data: RowData): Any = "Error:" + message + " "
}

case class IntColumnClause(column: Column) extends CalculatedColumnClause{

  override def dataType: ClauseDataType = ClauseDataType.INTEGER

  override def calculate(data: RowData): Any = data.get(column).asInstanceOf[Int]
}
//
case class DoubleColumnClause(column: Column) extends CalculatedColumnClause{
  override def dataType: ClauseDataType = ClauseDataType.DOUBLE
  override def calculate(data: RowData): Any = data.get(column).asInstanceOf[Double]
}

case class LongColumnClause(column: Column) extends CalculatedColumnClause {
  override def dataType: ClauseDataType = ClauseDataType.LONG
  override def calculate(data: RowData): Any = data.get(column) match {
    case null => null
    case x: Int => x.toLong
    case x => x.asInstanceOf[Long]
  }
}

case class BooleanColumnClause(column: Column) extends CalculatedColumnClause{
  override def dataType: ClauseDataType = ClauseDataType.BOOLEAN
  override def calculate(data: RowData): Any = data.get(column).asInstanceOf[Boolean]
}

case class StringColumnClause(column: Column) extends CalculatedColumnClause {
  override def dataType: ClauseDataType = ClauseDataType.STRING
  override def calculate(data: RowData): Any = data.get(column).asInstanceOf[String]
}

object MultiplyClause{
  def apply(leftClause: CalculatedColumnClause, rightClause: CalculatedColumnClause): CalculatedColumnClause = {
      MultiplyClause(List(leftClause, rightClause))
  }
}

object SubtractClause{
  def apply(leftClause: CalculatedColumnClause, rightClause: CalculatedColumnClause): CalculatedColumnClause = {
    SubtractClause(List(leftClause, rightClause))
  }
}

object DivideClause{
  def apply(leftClause: CalculatedColumnClause, rightClause: CalculatedColumnClause): CalculatedColumnClause = {
    DivideClause(List(leftClause, rightClause))
  }
}

object AddClause{
  def apply(leftClause: CalculatedColumnClause, rightClause: CalculatedColumnClause): CalculatedColumnClause = {
    AddClause(List(leftClause, rightClause))
  }
}

object EqualsClause{
  def apply(leftClause: CalculatedColumnClause, rightClause: CalculatedColumnClause): CalculatedColumnClause = {
    new EqualsClause(leftClause, rightClause)
  }
}

object GreaterThanClause{
  def apply(leftClause: CalculatedColumnClause, rightClause: CalculatedColumnClause): CalculatedColumnClause = {
    new GreaterThanClause(leftClause, rightClause)
  }
}

object LessThanClause{
  def apply(leftClause: CalculatedColumnClause, rightClause: CalculatedColumnClause): CalculatedColumnClause = {
    new GreaterThanClause(leftClause, rightClause)
  }
}

case class MultiplyClause(clauses: List[CalculatedColumnClause]) extends CalculatedColumnClause {
  override def dataType: ClauseDataType = Clauses.findWidest(clauses)

  def calculate(data: RowData): Any = {
    this.dataType match {
      case ClauseDataType.LONG => Calculations.mathLong(clauses, data, (a, b) => a * b, 0L)
      case ClauseDataType.INTEGER => Calculations.mathInt(clauses, data, (a, b) => a * b, 0)
      case ClauseDataType.DOUBLE => Calculations.mathDouble(clauses, data, (a, b) => a * b, 0D)
      case ClauseDataType.STRING => ErrorClause("Can't multiply string by numeric:" + clauses.map(c => c.calculate(data).toString).mkString(",")).calculate(data)
    }
  }
}



case class AddClause(clauses: List[CalculatedColumnClause]) extends CalculatedColumnClause {

  override def dataType: ClauseDataType = Clauses.findWidest(clauses)

  def calculate(data: RowData): Any = {
    this.dataType match {
      case ClauseDataType.LONG => Calculations.mathLong(clauses, data, (a, b) => a + b, 0L)
      case ClauseDataType.INTEGER => Calculations.mathInt(clauses, data, (a, b) => a + b, 0)
      case ClauseDataType.DOUBLE => Calculations.mathDouble(clauses, data, (a, b) => a + b, 0D)
    }
  }
}

case class EqualsClause(left: CalculatedColumnClause, right: CalculatedColumnClause) extends CalculatedColumnClause {

  override def dataType: ClauseDataType = ClauseDataType.BOOLEAN

  def calculate(data: RowData): Any = {
    left.calculate(data) == right.calculate(data)
  }
}

case class GreaterThanClause(left: CalculatedColumnClause, right: CalculatedColumnClause) extends CalculatedColumnClause {

  override def dataType: ClauseDataType = ClauseDataType.BOOLEAN

  def calculate(data: RowData): Any = {
    left.dataType match {
      case ClauseDataType.INTEGER => left.calculate(data).toString.toInt > right.calculate(data).toString.toInt
      case ClauseDataType.LONG => left.calculate(data).toString.toLong > right.calculate(data).toString.toLong
      case ClauseDataType.DOUBLE => left.calculate(data).toString.toDouble > right.calculate(data).toString.toDouble
      case ClauseDataType.BOOLEAN => left.calculate(data).toString.toBoolean > right.calculate(data).toString.toBoolean
    }
  }
}

case class LessThanClause(left: CalculatedColumnClause, right: CalculatedColumnClause) extends CalculatedColumnClause {

  override def dataType: ClauseDataType = ClauseDataType.BOOLEAN

  def calculate(data: RowData): Any = {
    left.dataType match {
      case ClauseDataType.INTEGER => left.calculate(data).toString.toInt < right.calculate(data).toString.toInt
      case ClauseDataType.LONG => left.calculate(data).toString.toLong < right.calculate(data).toString.toLong
      case ClauseDataType.DOUBLE => left.calculate(data).toString.toDouble < right.calculate(data).toString.toDouble
      case ClauseDataType.BOOLEAN => left.calculate(data).toString.toBoolean < right.calculate(data).toString.toBoolean
    }
  }
}


case class SubtractClause(clauses: List[CalculatedColumnClause]) extends CalculatedColumnClause {
  override def dataType: ClauseDataType = Clauses.findWidest(clauses)

  def calculate(data: RowData): Any = {
    this.dataType match {
      case ClauseDataType.LONG => Calculations.mathLong(clauses, data, (a, b) => a - b, 0L)
      case ClauseDataType.INTEGER => Calculations.mathInt(clauses, data, (a, b) => a - b, 0)
      case ClauseDataType.DOUBLE => Calculations.mathDouble(clauses, data, (a, b) => a - b, 0)
    }
  }
}

case class DivideClause(clauses: List[CalculatedColumnClause]) extends CalculatedColumnClause {
  override def dataType: ClauseDataType = Clauses.findWidest(clauses)

  def calculate(data: RowData): Any = {
    this.dataType match {
      case ClauseDataType.NULL => Double.NaN
      case ClauseDataType.LONG => Calculations.mathLong(clauses, data, (a, b) => a / b, 0L)
      case ClauseDataType.INTEGER => Calculations.mathInt(clauses, data, (a, b) => a / b, 0)
      case ClauseDataType.DOUBLE => Calculations.mathDouble(clauses, data, (a, b) => a / b, 0)
    }
  }
}