package org.finos.vuu.core.table.column

import org.finos.vuu.core.table.RowData

object Calculations {

  def coerceToDouble(clause: CalculatedColumnClause, data: RowData): Double = {
    clause.dataType match {
      case ClauseDataType.DOUBLE => clause.calculate(data).asInstanceOf[Double]
      case ClauseDataType.INTEGER => clause.calculate(data).asInstanceOf[Int].toDouble
      case ClauseDataType.BOOLEAN => clause.calculate(data).asInstanceOf[Int]
      case ClauseDataType.LONG => clause.calculate(data).asInstanceOf[java.lang.Long].toDouble
    }
  }
  def coerceToLong(clause: CalculatedColumnClause, data: RowData): Long = {
    clause.dataType match {
      case ClauseDataType.DOUBLE => clause.calculate(data).asInstanceOf[Double].toLong
      case ClauseDataType.INTEGER => clause.calculate(data).asInstanceOf[Int].toLong
      case ClauseDataType.BOOLEAN => clause.calculate(data).asInstanceOf[Int].toLong
      case ClauseDataType.LONG => clause.calculate(data).asInstanceOf[Long]
    }
  }

  def coerceToInt(clause: CalculatedColumnClause, data: RowData): Int = {
    clause.dataType match {
      case ClauseDataType.INTEGER => clause.calculate(data).asInstanceOf[Int]
      case ClauseDataType.BOOLEAN => clause.calculate(data).asInstanceOf[Int]
    }
  }

  def coerceToBool(clause: CalculatedColumnClause, data: RowData): Boolean = {
    clause.dataType match {
      case ClauseDataType.BOOLEAN => clause.calculate(data).asInstanceOf[Boolean]
    }
  }


  def mathDouble(clauses: List[CalculatedColumnClause], data: RowData, op:(Double, Double) => Double, default: Double): Double = {
    clauses.foldLeft(0D)((x, y) => {
      if (x == 0D) {
        coerceToDouble(y, data)
      } else {
        op(x, coerceToDouble(y, data))
      }
    })
  }

  def mathLong(clauses: List[CalculatedColumnClause], data: RowData, op: (Long, Long) => Long, default: Long): Long = {
    clauses.foldLeft(0L)((x, y) => {
      if (x == 0L) {
        coerceToLong(y, data)
      } else {
        op(x, coerceToLong(y, data))
      }
    })
  }

  def mathInt(clauses: List[CalculatedColumnClause], data: RowData, op: (Int, Int) => Int, default: Int): Int = {
    clauses.foldLeft(0)((x, y) => {
      if (x == 0) {
        coerceToInt(y, data)
      } else {
        op(x, coerceToInt(y, data))
      }
    })
  }

  def mathBool(clauses: List[CalculatedColumnClause], data: RowData, op: (Boolean, Boolean) => Boolean, default: Boolean): Boolean = {
    false
  }
}
