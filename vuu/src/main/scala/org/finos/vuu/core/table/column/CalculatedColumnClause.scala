package org.finos.vuu.core.table.column

import org.finos.vuu.core.table.RowData

trait CalculatedColumnClause {
  def calculate(data: RowData): Any
}

trait NumericClause extends CalculatedColumnClause{
  override def calculate(data: RowData): Number
}

case class IntColumnClause(column: String) extends NumericClause{
  override def calculate(data: RowData): Number = data.get(column).asInstanceOf[Int]
}
//
case class DoubleColumnClause(column: String) extends NumericClause{
  override def calculate(data: RowData): Number = data.get(column).asInstanceOf[Double]
}
//
//case class LongColumnClause(column: String) extends NumericClause[java.lang.Long]{
//  override def calculate(data: RowData): Number = data.get(column).asInstanceOf[Long]
//}

case class MultiplyClause(leftClause: NumericClause, rightClause: NumericClause) extends CalculatedColumnClause {
  def calculate(data: RowData): Any = {
    leftClause.calculate(data).intValue() * rightClause.calculate(data).intValue()
  }
}

