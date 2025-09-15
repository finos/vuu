package org.finos.vuu.core.sort

import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.core.table.{Column, DataType, RowData}

import java.util.function.ToIntBiFunction
import scala.annotation.tailrec

object SortCompares extends StrictLogging {

  @tailrec
  def compare(o1: RowData, o2: RowData, columns: List[Column], sortDirections: List[Char], columnIndex: Int): Int = {

    val activeColumn = columns(columnIndex)
    val isAscending = sortDirections(columnIndex) == 'A'

    val compareValue = activeColumn.dataType match {
      case DataType.StringDataType => compareString(o1, o2, activeColumn, isAscending)
      case DataType.LongDataType => compareLong(o1, o2, activeColumn, isAscending)
      case DataType.IntegerDataType => compareInt(o1, o2, activeColumn, isAscending)
      case DataType.DoubleDataType => compareDouble(o1, o2, activeColumn, isAscending)
      case DataType.BooleanDataType => compareBoolean(o1, o2, activeColumn, isAscending)
      case DataType.CharDataType => compareChar(o1, o2, activeColumn, isAscending)
      case _ =>
        logger.warn(s"Unable to sort datatype ${activeColumn.dataType}")
        0
    }

    if (compareValue != 0 || columnIndex == (columns.length - 1)) {
      compareValue
    } else {
      compare(o1, o2, columns, sortDirections, columnIndex + 1)
    }
  }

  def compareChar(o1: RowData, o2: RowData, column: Column, isAscending: Boolean): Int = {
    compareComparable[java.lang.Character](o1, o2, column, isAscending)
  }

  def compareDouble(o1: RowData, o2: RowData, column: Column, isAscending: Boolean): Int = {
    compareComparable[java.lang.Double](o1, o2, column, isAscending)
  }

  def compareInt(o1: RowData, o2: RowData, column: Column, isAscending: Boolean): Int = {
    compareComparable[java.lang.Integer](o1, o2, column, isAscending)
  }

  def compareLong(o1: RowData, o2: RowData, column: Column, isAscending: Boolean): Int = {
    compareComparable[java.lang.Long](o1, o2, column, isAscending)
  }

  def compareBoolean(o1: RowData, o2: RowData, column: Column, isAscending: Boolean): Int = {
    compareComparable[java.lang.Boolean](o1, o2, column, isAscending)
  }

  def compareString(o1: RowData, o2: RowData, column: Column, isAscending: Boolean): Int = {
    compareReferenceType[String](o1, o2, column, isAscending, (v1: String, v2: String) => v1.compareToIgnoreCase(v2))
  }

  private def compareComparable[T <: AnyRef with Comparable[T]](o1: RowData, o2: RowData, column: Column, isAscending: Boolean): Int = {
    compareReferenceType(o1, o2, column, isAscending, (c1: T, c2: T) => c1.compareTo(c2))
  }

  private def compareReferenceType[T <: AnyRef](o1: RowData, o2: RowData, column: Column, isAscending: Boolean, compareFunction: ToIntBiFunction[T,T]): Int = {
    val c1 = o1.get(column).asInstanceOf[T]
    val c2 = o2.get(column).asInstanceOf[T]
    if (c1 eq c2) { //Short circuit for reference equality
      0
    } else if (c1 == null) {
      if (isAscending) 1 else -1
    } else if (c2 == null) {
      if (isAscending) -1 else 1
    } else if (isAscending) {
      compareFunction.applyAsInt(c1, c2)
    } else {
      compareFunction.applyAsInt(c2, c1)
    }
  }

}

