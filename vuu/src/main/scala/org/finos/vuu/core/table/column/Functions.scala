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

case class AbsFunction(clause: CalculatedColumnClause) extends CalculatedColumnClause {
  override def dataType: ClauseDataType = clause.dataType
  override def calculate(data: RowData): Any = {
    this.dataType match {
      case ClauseDataType.LONG => Math.abs(clause.calculate(data).asInstanceOf[Long])
      case ClauseDataType.INTEGER => Math.abs(clause.calculate(data).asInstanceOf[Int])
      case ClauseDataType.DOUBLE => Math.abs(clause.calculate(data).asInstanceOf[Double])
    }
  }
}

case class LenFunction(clause: CalculatedColumnClause) extends CalculatedColumnClause {
  override def dataType: ClauseDataType = ClauseDataType.INTEGER
  override def calculate(data: RowData): Any = {
    this.dataType match {
      case ClauseDataType.STRING => TextFunction(List(clause)).calculate(data).toString.length
    }
  }
}

case class StartsFunction(clauses: List[CalculatedColumnClause]) extends CalculatedColumnClause {
  val left :: right :: _ = clauses
  override def dataType: ClauseDataType = ClauseDataType.BOOLEAN
  override def calculate(data: RowData): Any = {
      TextFunction(List(left)).calculate(data).toString.startsWith(TextFunction(List(right)).calculate(data).toString)

  }
}

case class OrFunction(clauses: List[CalculatedColumnClause]) extends CalculatedColumnClause {
  override def dataType: ClauseDataType = ClauseDataType.BOOLEAN
  override def calculate(data: RowData): Any = {
      clauses.map(_.calculate(data)).find(_ == true) match {
        case Some(vals) => true
        case None => false
      }
  }
}

case class AndFunction(clauses: List[CalculatedColumnClause]) extends CalculatedColumnClause {
  override def dataType: ClauseDataType = ClauseDataType.BOOLEAN
  override def calculate(data: RowData): Any = {
    clauses.map(_.calculate(data)).find(_ == false) match {
      case Some(vals) => false
      case None => true
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
      case ClauseDataType.LONG => ifNotNull(clause.calculate(data), x => x.toString)
      case ClauseDataType.INTEGER => ifNotNull(clause.calculate(data), x => x.toString)
      case ClauseDataType.DOUBLE => ifNotNull(clause.calculate(data), x => x.toString)
      case ClauseDataType.STRING => ifNotNull(clause.calculate(data), x => x.toString)
      case ClauseDataType.BOOLEAN => ifNotNull(clause.calculate(data), x => x.toString)
    }
  }

  def ifNotNull(dataPoint: Any, x: Any => String): String = {
    if(dataPoint == null){
      null
    }else{
      dataPoint.toString
    }
  }

  override def calculate(data: RowData): Any = {
      clause.map(clauseToText(_, data)).mkString("")
  }
}

object ErrorClause extends CalculatedColumnClause {
  override def dataType: ClauseDataType = ClauseDataType.STRING

  override def calculate(data: RowData): Any = "ERROR"
}

case class IfFunction(conditionClause: CalculatedColumnClause, thenClause: CalculatedColumnClause, elseClause: CalculatedColumnClause) extends CalculatedColumnClause {

  //private val (conditionClause :: trueCluse :: falseClause :: _) = clauses

  override def dataType: ClauseDataType = thenClause.dataType //this may be a hack, should we take the most conservative of the datatypes..?

  override def calculate(data: RowData): Any = {
    if(conditionClause.dataType == ClauseDataType.BOOLEAN){
      conditionClause.calculate(data) match {
        case true => thenClause.calculate(data)
        case false => elseClause.calculate(data)
      }
    }else{
       ErrorClause
    }
  }
}

case class ConcatenateFunction(clauses: List[CalculatedColumnClause]) extends CalculatedColumnClause {
  override def dataType: ClauseDataType = ClauseDataType.STRING

  override def calculate(data: RowData): Any = {
    TextFunction(clauses).calculate(data)
  }
}

object Functions {

  def createIf(name: String, condition: CalculatedColumnClause,thenClause: CalculatedColumnClause,elseClause: CalculatedColumnClause): CalculatedColumnClause = {
    name.toLowerCase match {
      case "if" => IfFunction(condition, thenClause, elseClause)
      //case "if" => IfFunction(args)
    }
  }

  def create(name: String, arg: CalculatedColumnClause): CalculatedColumnClause = {
    name.toLowerCase match {
      case "abs" => AbsFunction(arg)
      case "len" => LenFunction(arg)
      case "starts" => LenFunction(arg)
      //case "if" => IfFunction(args)
    }
  }

  def create(name: String, args: List[CalculatedColumnClause]): CalculatedColumnClause = {
    name.toLowerCase match {
      case "min" => MinFunction(args)
      case "max" => MaxFunction(args)
      case "text" => TextFunction(args)
      case "concatenate" => ConcatenateFunction(args)
      case "starts" => StartsFunction(args)
      case "or" => OrFunction(args)
      case "and" => AndFunction(args)
    }
  }
}
