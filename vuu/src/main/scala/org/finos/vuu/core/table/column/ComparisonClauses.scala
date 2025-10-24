package org.finos.vuu.core.table.column

import org.finos.vuu.core.table.RowData
import org.finos.vuu.core.table.column.CalculatedColumnClause.OptionResult
import org.finos.vuu.core.table.column.ClauseDataType.{ClauseDataType, isNumeric}

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
  case object GT extends OrderOp {
    override def apply[T](v1: T, v2: T)(implicit ordering: Ordering[T]): Boolean = ordering.gt(v1, v2)
  }
  case object LT extends OrderOp {
    override def apply[T](v1: T, v2: T)(implicit ordering: Ordering[T]): Boolean = ordering.lt(v1, v2)
  }
}
