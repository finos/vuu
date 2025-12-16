package org.finos.vuu.core.table.column

import org.finos.vuu.core.table.RowData
import org.finos.vuu.core.table.column.CalculatedColumnClause.OptionResult
import org.finos.vuu.core.table.column.ClauseDataType.{ClauseDataType, isNumeric}
import org.finos.vuu.core.table.column.StringFunctions.assertMinimumLength

case class LenFunction(clause: CalculatedColumnClause) extends CalculatedColumnClause {
  private val baseFn = BaseFunction(List(TextFunction(clause)), errorTemplate(_))
  override def dataType: ClauseDataType = ClauseDataType.INTEGER
  override def calculate(data: RowData): OptionResult[Int] = clause.dataType match {
    case ClauseDataType.STRING => baseFn.calculate(data, _.head.toString.length)
    case _                     => errorTemplate(s"cannot be applied to non-string clause.")
  }
}

case class StartsFunction(clauses: List[CalculatedColumnClause]) extends StringMatchFunction(clauses, StringMatchOp.Starts)
case class EndsFunction(clauses: List[CalculatedColumnClause]) extends StringMatchFunction(clauses, StringMatchOp.Ends)
case class ContainsFunction(clauses: List[CalculatedColumnClause]) extends StringMatchFunction(clauses, StringMatchOp.Contains)

abstract class StringMatchFunction(clauses: List[CalculatedColumnClause], op: StringMatchOp) extends CalculatedColumnClause {
  assertMinimumLength(clauses, 2)
  private val baseFn = BaseFunction(clauses.take(2).map(TextFunction(_)), errorTemplate(_))
  override def dataType: ClauseDataType = ClauseDataType.BOOLEAN
  override def calculate(data: RowData): OptionResult[Boolean] =
    baseFn.calculate[Boolean](data, {
      case str :: subStr :: _ => op.apply(str.toString, subStr.toString)
      case _ => false
    })
}

private sealed abstract class StringMatchOp(val apply: (String, String) => Boolean)
private object StringMatchOp {
  case object Starts extends StringMatchOp((str, subStr) => str.startsWith(subStr))
  case object Ends extends StringMatchOp((str, subStr) => str.endsWith(subStr))
  case object Contains extends StringMatchOp((str, subStr) => str.contains(subStr))
}

case class LowerFunction(clauses: List[CalculatedColumnClause]) extends CalculatedColumnClause {
  private val baseFn = BaseFunction(List(TextFunction(clauses)), errorTemplate(_))
  override def dataType: ClauseDataType = ClauseDataType.STRING
  override def calculate(data: RowData): OptionResult[String] = baseFn.calculate(data, _.head.toString.toLowerCase)
}

case class UpperFunction(clauses: List[CalculatedColumnClause]) extends CalculatedColumnClause {
  private val baseFn = BaseFunction(List(TextFunction(clauses)), errorTemplate(_))
  override def dataType: ClauseDataType = ClauseDataType.STRING
  override def calculate(data: RowData): OptionResult[String] = baseFn.calculate(data, _.head.toString.toUpperCase)
}

case class ReplaceFunction(clauses: List[CalculatedColumnClause]) extends CalculatedColumnClause {
  assertMinimumLength(clauses, 3)
  private val baseFn = BaseFunction(clauses.take(3).map(TextFunction(_)), errorTemplate(_))
  override def dataType: ClauseDataType = ClauseDataType.STRING

  override def calculate(data: RowData): OptionResult[String] = baseFn.calculate[String](
    data,
    { case source :: target :: replacement :: _ => source.toString.replace(target.toString, replacement.toString) }
  )
}

case class LeftFunction(clauses: List[CalculatedColumnClause]) extends SubstringFunction(clauses, SubstringOp.Left)
case class RightFunction(clauses: List[CalculatedColumnClause]) extends SubstringFunction(clauses, SubstringOp.Right)

abstract class SubstringFunction(clauses: List[CalculatedColumnClause], op: SubstringOp) extends CalculatedColumnClause {
  assertMinimumLength(clauses, 2)

  private val sourceClause = clauses.head
  private val countClause = clauses(1)
  private val baseFn = BaseFunction(List(TextFunction(sourceClause), countClause), errorTemplate(_))

  override def dataType: ClauseDataType = ClauseDataType.STRING

  override def calculate(data: RowData): OptionResult[String] = {
    if (!isNumeric(countClause.dataType)) errorTemplate(s"`count clause` should have a numeric datatype.")
    else baseFn.calculate(data, { case source :: count :: _ => op.apply(source.toString, count.toString.toDouble.toInt) })
  }
}

private sealed abstract class SubstringOp(val apply: (String, Int) => String)
private object SubstringOp {
  case object Left extends SubstringOp((str, n) => str.substring(0, Math.min(n, str.length)))
  case object Right extends SubstringOp((str, n) => str.substring(str.length - Math.min(n, str.length)))
}

object TextFunction {
  def apply(clauses: CalculatedColumnClause*): TextFunction = new TextFunction(clauses.toList)
}

case class TextFunction(clauses: List[CalculatedColumnClause]) extends CalculatedColumnClause {
  private val baseFn = BaseFunction(clauses, errorTemplate(_))
  override def dataType: ClauseDataType = ClauseDataType.STRING
  override def calculate(data: RowData): OptionResult[String] = baseFn.calculate(data, _.map(_.toString).mkString(""))
}

case class ConcatenateFunction(clauses: List[CalculatedColumnClause]) extends CalculatedColumnClause {
  override def dataType: ClauseDataType = ClauseDataType.STRING

  override def calculate(data: RowData): OptionResult[String] = {
    TextFunction(clauses).calculate(data)
  }
}

case class BaseFunction(clauses: List[CalculatedColumnClause], errorTemplate: String => Error) {
  def calculate[T](data: RowData, op: List[Any] => T): OptionResult[T] = {
    val calculatedClauses = clauses.map(_.calculate(data)).map(flattenOptionResult)

    val firstError = calculatedClauses.find(_.isError).map(_.getError)
    if (firstError.nonEmpty) return Error(firstError.get)

    val values = calculatedClauses.map(_.getValue)
    OptionResult(op(values))
  }

  private def flattenOptionResult[T](res: OptionResult[T]): Result[T] = res match {
    case Success(None)    => errorTemplate(s"cannot have clauses that evaluate to `null`.")
    case Success(Some(v)) => Success(v)
    case Error(any)       => Error(any)
  }
}

object StringFunctions {
  // should never happen - should already be caught during ANTLR parsing
  // but would be better if we can make Function clauses accept exact number of params instead of a list so that the
  // reader doesn't have to guess where the guarantee on the length of the list comes from.
  def assertMinimumLength(clauses: List[CalculatedColumnClause], length: Int): Unit = {
    if (clauses.length < length)
      throw CalcColumnFunctionsParsingException(s"Parsing error: sub-clauses should have a length of $length")
  }

  case class CalcColumnFunctionsParsingException(msg: String) extends RuntimeException(msg)
}
