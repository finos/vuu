package org.finos.vuu.core.table.column
import org.finos.vuu.core.table.RowData
import org.finos.vuu.core.table.column.CalculatedColumnClause.OptionResult
import org.finos.vuu.core.table.column.ClauseDataType.{ClauseDataType, findWidest, isNumeric}

case class LenFunction(clause: CalculatedColumnClause) extends CalculatedColumnClause {
  private val baseFn = BaseFunction(List(TextFunction(clause)), errorTemplate)
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
  Functions.assertMinimumLength(clauses, 2)
  private val baseFn = BaseFunction(clauses.take(2).map(TextFunction(_)), errorTemplate)
  override def dataType: ClauseDataType = ClauseDataType.BOOLEAN
  override def calculate(data: RowData): OptionResult[Boolean] =
    baseFn.calculate[Boolean](data, { case str :: subStr :: _ => op.apply(str.toString, subStr.toString) })
}

private sealed abstract class StringMatchOp(val apply: (String, String) => Boolean)
private object StringMatchOp {
  final case object Starts extends StringMatchOp((str, subStr) => str.startsWith(subStr))
  final case object Ends extends StringMatchOp((str, subStr) => str.endsWith(subStr))
  final case object Contains extends StringMatchOp((str, subStr) => str.contains(subStr))
}

case class LowerFunction(clauses: List[CalculatedColumnClause]) extends CalculatedColumnClause {
  private val baseFn = BaseFunction(List(TextFunction(clauses)), errorTemplate)
  override def dataType: ClauseDataType = ClauseDataType.STRING
  override def calculate(data: RowData): OptionResult[String] = baseFn.calculate(data, _.head.toString.toLowerCase)
}

case class UpperFunction(clauses: List[CalculatedColumnClause]) extends CalculatedColumnClause {
  private val baseFn = BaseFunction(List(TextFunction(clauses)), errorTemplate)
  override def dataType: ClauseDataType = ClauseDataType.STRING
  override def calculate(data: RowData): OptionResult[String] = baseFn.calculate(data, _.head.toString.toUpperCase)
}

case class ReplaceFunction(clauses: List[CalculatedColumnClause]) extends CalculatedColumnClause {
  Functions.assertMinimumLength(clauses, 3)
  private val baseFn = BaseFunction(clauses.take(3).map(TextFunction(_)), errorTemplate)
  override def dataType: ClauseDataType = ClauseDataType.STRING

  override def calculate(data: RowData): OptionResult[String] = baseFn.calculate[String](
    data,
    { case source :: target :: replacement :: _ => source.toString.replace(target.toString, replacement.toString) }
  )
}

case class LeftFunction(clauses: List[CalculatedColumnClause]) extends SubstringFunction(clauses, SubstringOp.Left)
case class RightFunction(clauses: List[CalculatedColumnClause]) extends SubstringFunction(clauses, SubstringOp.Right)

abstract class SubstringFunction(clauses: List[CalculatedColumnClause], op: SubstringOp) extends CalculatedColumnClause {
  Functions.assertMinimumLength(clauses, 2)
  private val sourceClause :: countClause :: _ = clauses
  private val baseFn = BaseFunction(List(TextFunction(sourceClause), countClause), errorTemplate)

  override def dataType: ClauseDataType = ClauseDataType.STRING

  override def calculate(data: RowData): OptionResult[String] = {
    if (!isNumeric(countClause.dataType)) errorTemplate(s"`count clause` should have a numeric datatype.")
    else baseFn.calculate(data, { case source :: count :: _ => op.apply(source.toString, count.toString.toDouble.toInt) })
  }
}

private sealed abstract class SubstringOp(val apply: (String, Int) => String)
private object SubstringOp {
  final case object Left extends SubstringOp((str, n) => str.substring(0, Math.min(n, str.length)))
  final case object Right extends SubstringOp((str, n) => str.substring(str.length - Math.min(n, str.length)))
}

case class OrFunction(clauses: List[CalculatedColumnClause]) extends CalculatedColumnClause {
  override def dataType: ClauseDataType = ClauseDataType.BOOLEAN

  override def calculate(data: RowData): OptionResult[Boolean] = {
    clauses.iterator
      .map(_.calculate(data))
      .find(r => r.isError || r.getValue.contains(true))
      .getOrElse(OptionResult(false))
      .asInstanceOf[OptionResult[Boolean]]
  }
}

case class AndFunction(clauses: List[CalculatedColumnClause]) extends CalculatedColumnClause {
  override def dataType: ClauseDataType = ClauseDataType.BOOLEAN

  override def calculate(data: RowData): OptionResult[Boolean] = {
    clauses.iterator
      .map(_.calculate(data))
      .collectFirst({
        case Success(value) if !value.contains(true) => OptionResult(false)
        case Error(msg) => Error(msg)
      }).getOrElse(OptionResult(true))
  }
}

object TextFunction {
  def apply(clauses: CalculatedColumnClause*): TextFunction = new TextFunction(clauses.toList)
}

case class TextFunction(clauses: List[CalculatedColumnClause]) extends CalculatedColumnClause {
  private val baseFn = BaseFunction(clauses, errorTemplate)
  override def dataType: ClauseDataType = ClauseDataType.STRING
  override def calculate(data: RowData): OptionResult[String] = baseFn.calculate(data, _.map(_.toString).mkString(""))
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

case class IfFunction(conditionClause: CalculatedColumnClause, thenClause: CalculatedColumnClause, elseClause: CalculatedColumnClause) extends CalculatedColumnClause {
  override def dataType: ClauseDataType = findWidest(List(thenClause, elseClause))
  override def calculate(data: RowData): OptionResult[Any] = {
    conditionClause.calculate(data) match {
      case Success(Some(true))  => thenClause.calculate(data)
      case Success(_)           => elseClause.calculate(data)
      case err                  => err
    }
  }
}

case class ConcatenateFunction(clauses: List[CalculatedColumnClause]) extends CalculatedColumnClause {
  override def dataType: ClauseDataType = ClauseDataType.STRING

  override def calculate(data: RowData): OptionResult[String] = {
    TextFunction(clauses).calculate(data)
  }
}

object Functions {

  def createIf(name: String, condition: CalculatedColumnClause,thenClause: CalculatedColumnClause,elseClause: CalculatedColumnClause): CalculatedColumnClause = {
    name.toLowerCase match {
      case "if" => IfFunction(condition, thenClause, elseClause)
    }
  }

  def create(name: String, arg: CalculatedColumnClause): CalculatedColumnClause = {
    name.toLowerCase match {
      case "abs" => AbsClause(arg)
      case "len" => LenFunction(arg)
    }
  }

  def create(name: String, args: List[CalculatedColumnClause]): CalculatedColumnClause = {
    name.toLowerCase match {
      case "abs" => AbsClause(args.head)
      case "sum" => SumClause(args)
      case "min" => MinClause(args)
      case "max" => MaxClause(args)
      case "text" => TextFunction(args)
      case "concatenate" => ConcatenateFunction(args)
      case "starts" => StartsFunction(args)
      case "ends" => EndsFunction(args)
      case "or" => OrFunction(args)
      case "and" => AndFunction(args)
      case "contains" => ContainsFunction(args)
      case "upper" => UpperFunction(args)
      case "lower" => LowerFunction(args)
      case "replace" => ReplaceFunction(args)
      case "left" => LeftFunction(args)
      case "right" => RightFunction(args)
    }
  }

  // temporary guard (ideally should never happen), but better if we can make Function clauses accept exact number of params instead of a list.
  def assertMinimumLength(clauses: List[CalculatedColumnClause], length: Int): Unit = {
    if (clauses.length < length)
      throw CalcColumnFunctionsParsingException(s"Parsing error: sub-clauses should have a length of $length")
  }

  case class CalcColumnFunctionsParsingException(msg: String) extends RuntimeException(msg)
}
