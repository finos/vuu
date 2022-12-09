package org.finos.vuu.core.table.column
import org.finos.vuu.core.table.RowData
import org.finos.vuu.core.table.column.ClauseDataType.ClauseDataType

//case class

case class MinFunction(clauses: List[CalculatedColumnClause]) extends CalculatedColumnClause {
  override def dataType: ClauseDataType = Clauses.findWidest(clauses)
  override def calculate(data: RowData): Any = {
    this.dataType match {
      case ClauseDataType.LONG => Calculations.mathLong(clauses, data, (a, b) => Math.min(a , b), 0L)
      case ClauseDataType.INTEGER => Calculations.mathInt(clauses, data, (a, b) => Math.min(a , b), 0)
      case ClauseDataType.DOUBLE => Calculations.mathDouble(clauses, data, (a, b) => Math.min(a , b), 0D)
    }
  }
}

case class MaxFunction(clauses: List[CalculatedColumnClause]) extends CalculatedColumnClause {
  override def dataType: ClauseDataType = Clauses.findWidest(clauses)
  override def calculate(data: RowData): Any = {
    this.dataType match {
      case ClauseDataType.LONG => Calculations.mathLong(clauses, data, (a, b) => Math.max(a , b), 0L)
      case ClauseDataType.INTEGER => Calculations.mathInt(clauses, data, (a, b) => Math.max(a , b), 0)
      case ClauseDataType.DOUBLE => Calculations.mathDouble(clauses, data, (a, b) => Math.max(a , b), 0D)
    }
  }
}

case class TextFunction(clause: List[CalculatedColumnClause]) extends CalculatedColumnClause {
  override def dataType: ClauseDataType = ClauseDataType.STRING

  private def clauseToText(clause: CalculatedColumnClause, data: RowData): String = {
    this.dataType match {
      case ClauseDataType.LONG => clause.calculate(data).toString
      case ClauseDataType.INTEGER => clause.calculate(data).toString
      case ClauseDataType.DOUBLE => clause.calculate(data).toString
      case ClauseDataType.STRING => clause.calculate(data).toString
      case ClauseDataType.BOOLEAN => clause.calculate(data).toString
    }
  }

  override def calculate(data: RowData): Any = {
      clause.map(clauseToText(_, data)).mkString("")
  }
}

case class ConcatenateFunction(clauses: List[CalculatedColumnClause]) extends CalculatedColumnClause {
  override def dataType: ClauseDataType = ClauseDataType.STRING

  override def calculate(data: RowData): Any = {
    TextFunction(clauses).calculate(data)
  }
}

object Functions {

  def create(name: String, args: List[CalculatedColumnClause]): CalculatedColumnClause = {
    name.toLowerCase match {
      case "min" => MinFunction(args)
      case "max" => MaxFunction(args)
      case "text" => TextFunction(args)
      case "concatenate" => ConcatenateFunction(args)
    }
  }
}
