package org.finos.vuu.core.table.column
import org.finos.vuu.core.table.RowData
import org.finos.vuu.core.table.column.CalculatedColumnClause.OptionResult
import org.finos.vuu.core.table.column.ClauseDataType.{ClauseDataType, findWidest}

case class OrFunction(clauses: List[CalculatedColumnClause]) extends CalculatedColumnClause {
  override def dataType: ClauseDataType = ClauseDataType.BOOLEAN

  override def calculate(data: RowData): OptionResult[Boolean] = {
    clauses.iterator
      .map(_.calculate(data))
      .collectFirst({
        case Success(Some(true)) => OptionResult(true)
        case Error(msg) => Error(msg)
      }).getOrElse(OptionResult(false))
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

object Functions {

  def createIf(name: String, condition: CalculatedColumnClause,thenClause: CalculatedColumnClause,elseClause: CalculatedColumnClause): CalculatedColumnClause = {
    name.toLowerCase match {
      case "if" => IfFunction(condition, thenClause, elseClause)
    }
  }

  def create(name: String, arg: CalculatedColumnClause): CalculatedColumnClause = {
    name.toLowerCase match {
      case "abs" => AbsFunction(arg)
      case "len" => LenFunction(arg)
    }
  }

  def create(name: String, args: List[CalculatedColumnClause]): CalculatedColumnClause = {
    name.toLowerCase match {
      case "abs" => AbsFunction(args.head)
      case "sum" => AdditionClause(args)
      case "min" => MinFunction(args)
      case "max" => MaxFunction(args)
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
}
