package org.finos.vuu.core.table.column

import org.finos.vuu.core.table.{Column, RowData}

case class NullCalculatedColumnClause() extends CalculatedColumnClause {
  def calculate(data: RowData): Any = null
}

case class LiteralIntColumnClause(i: Int) extends NumericClause {
  def calculate(data: RowData): Number = i
}

trait CalculatedColumnClause {
  def calculate(data: RowData): Any
}

trait NumericClause extends CalculatedColumnClause{
  override def calculate(data: RowData): Number
}

case class IntColumnClause(column: Column) extends NumericClause{
  override def calculate(data: RowData): Number = data.get(column).asInstanceOf[Int]
}
//
case class DoubleColumnClause(column: Column) extends NumericClause{
  override def calculate(data: RowData): Number = data.get(column).asInstanceOf[Double]
}

case class LongColumnClause(column: Column) extends NumericClause{
  override def calculate(data: RowData): Number = data.get(column).asInstanceOf[Long]
}

case class BooleanColumnClause(column: Column) extends CalculatedColumnClause{
  override def calculate(data: RowData): Boolean = data.get(column).asInstanceOf[Boolean]
}

case class StringColumnClause(column: Column) extends CalculatedColumnClause {
  override def calculate(data: RowData): String = data.get(column).asInstanceOf[String]
}

//
//case class LongColumnClause(column: String) extends NumericClause[java.lang.Long]{
//  override def calculate(data: RowData): Number = data.get(column).asInstanceOf[Long]
//}

case class MultiplyClause(clauses: List[NumericClause]) extends CalculatedColumnClause {
  def calculate(data: RowData): Any = {
    clauses.foldLeft(0.0)((x,y) => {
      if(x == 0.0){
        y.calculate(data).doubleValue()
      }else{
        x * y.calculate(data).doubleValue()
      }
    })
  }
}

