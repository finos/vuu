package org.finos.vuu.core.table.column

import org.finos.vuu.core.table.RowData

import java.util.function.BinaryOperator

object Calculations {

  private def coerceToDouble(clause: CalculatedColumnClause, data: RowData): Double = {
    clause.calculate(data) match {
      case null => Double.NaN
      case v =>
        clause.dataType match {
          case ClauseDataType.DOUBLE  => v.asInstanceOf[Double]
          case ClauseDataType.INTEGER => v.asInstanceOf[Int].toDouble
          case ClauseDataType.BOOLEAN => v.asInstanceOf[Int]
          case ClauseDataType.LONG    => v.asInstanceOf[Long].toDouble
        }
    }
  }
  private def coerceToLong(clause: CalculatedColumnClause, data: RowData): Long = {
    clause.dataType match {
      case ClauseDataType.DOUBLE => clause.calculate(data).asInstanceOf[Double].toLong
      case ClauseDataType.INTEGER => clause.calculate(data).asInstanceOf[Int].toLong
      case ClauseDataType.BOOLEAN => clause.calculate(data).asInstanceOf[Int].toLong
      case ClauseDataType.LONG => clause.calculate(data).asInstanceOf[Long]
    }
  }

  private def coerceToInt(clause: CalculatedColumnClause, data: RowData): Int = {
    clause.dataType match {
      case ClauseDataType.NULL => 0
      case ClauseDataType.INTEGER => clause.calculate(data).asInstanceOf[Int]
      case ClauseDataType.BOOLEAN => clause.calculate(data).asInstanceOf[Int]
    }
  }

  def coerceToBool(clause: CalculatedColumnClause, data: RowData): Boolean = {
    clause.dataType match {
      case ClauseDataType.BOOLEAN => clause.calculate(data).asInstanceOf[Boolean]
    }
  }

  def mathDouble(clauses: List[CalculatedColumnClause], data: RowData, op:(Double, Double) => Double, default: Double): Double =
    mathCalc(clauses, op, v => coerceToDouble(v, data), default)

  def mathLong(clauses: List[CalculatedColumnClause], data: RowData, op: (Long, Long) => Long, default: Long): Long =
    mathCalc(clauses, op, v => coerceToLong(v, data), default)

  def mathInt(clauses: List[CalculatedColumnClause], data: RowData, op: (Int, Int) => Int, default: Int): Int =
    mathCalc(clauses, op, v => coerceToInt(v, data), default)

  private type Coercer[T] = CalculatedColumnClause => T
  private def mathCalc[T](clauses: List[CalculatedColumnClause], op: (T, T) => T, coercer: Coercer[T], default: T): T = {
    clauses match {
      case head :: rest => rest.foldLeft(coercer(head))((x, y) => op(x, coercer(y)))
      case _ => default
    }
  }

  def mathBool(clauses: List[CalculatedColumnClause], data: RowData, op: (Boolean, Boolean) => Boolean, default: Boolean): Boolean = {
    false
  }
}
