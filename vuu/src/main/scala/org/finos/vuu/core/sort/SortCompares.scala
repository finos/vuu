package org.finos.vuu.core.sort

import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.core.table.datatype.{Decimal, EpochTimestamp}
import org.finos.vuu.core.table.{Column, DataType, RowData}

import java.util.function.ToIntBiFunction
import scala.annotation.tailrec

object SortCompares extends StrictLogging {

  @tailrec
  def compare(o1: RowData, o2: RowData, columns: List[Column], sortDirections: List[Char], columnIndex: Int): Int = {

    val activeColumn = columns(columnIndex)
    val isAscending = sortDirections(columnIndex) == 'A'

    val compareValue = activeColumn.dataType match {
      case DataType.CharDataType => compareChar(o1, o2, activeColumn, isAscending)
      case DataType.IntegerDataType => compareInt(o1, o2, activeColumn, isAscending)
      case DataType.BooleanDataType => compareBoolean(o1, o2, activeColumn, isAscending)
      case DataType.DoubleDataType => compareDouble(o1, o2, activeColumn, isAscending)
      case DataType.LongDataType => compareLong(o1, o2, activeColumn, isAscending)
      case DataType.StringDataType => compareString(o1, o2, activeColumn, isAscending)
      case DataType.EpochTimestampType => compareEpochTimestamp(o1, o2, activeColumn, isAscending)
      case DataType.DecimalType => compareDecimal(o1, o2, activeColumn, isAscending)
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
    val c1 = o1.get(column).asInstanceOf[Char]
    val c2 = o2.get(column).asInstanceOf[Char]
    if (c1 == c2) 0 else if ((isAscending && c1 > c2) || (!isAscending && c2 > c1)) 1 else -1
  }

  def compareDouble(o1: RowData, o2: RowData, column: Column, isAscending: Boolean): Int = {
    val c1 = o1.get(column).asInstanceOf[Double]
    val c2 = o2.get(column).asInstanceOf[Double]
    if (c1 == c2) 0 else if ((isAscending && c1 > c2) || (!isAscending && c2 > c1)) 1 else -1
  }

  def compareInt(o1: RowData, o2: RowData, column: Column, isAscending: Boolean): Int = {
    val c1 = o1.get(column).asInstanceOf[Int]
    val c2 = o2.get(column).asInstanceOf[Int]
    if (c1 == c2) 0 else if ((isAscending && c1 > c2) || (!isAscending && c2 > c1)) 1 else -1
  }

  def compareLong(o1: RowData, o2: RowData, column: Column, isAscending: Boolean): Int = {
    val c1 = o1.get(column).asInstanceOf[Long]
    val c2 = o2.get(column).asInstanceOf[Long]
    if (c1 == c2) 0 else if ((isAscending && c1 > c2) || (!isAscending && c2 > c1)) 1 else -1
  }

  def compareBoolean(o1: RowData, o2: RowData, column: Column, isAscending: Boolean): Int = {
    val c1 = o1.get(column).asInstanceOf[Boolean]
    val c2 = o2.get(column).asInstanceOf[Boolean]
    if (c1 == c2) 0 else if ((c1 && isAscending) || (c2 && !isAscending)) 1 else -1
  }

  def compareString(o1: RowData, o2: RowData, column: Column, isAscending: Boolean): Int = {
    compareReferenceType[String](o1, o2, column, isAscending, (v1: String, v2: String) => {
      v1.compareToIgnoreCase(v2)
    })
  }

  def compareEpochTimestamp(o1: RowData, o2: RowData, column: Column, isAscending: Boolean): Int = {
    compareOrderedReferenceType[EpochTimestamp](o1, o2, column, isAscending)
  }

  def compareDecimal(o1: RowData, o2: RowData, column: Column, isAscending: Boolean): Int =  {
    compareOrderedReferenceType[Decimal](o1, o2, column, isAscending)
  }

  private def compareOrderedReferenceType[T <: AnyRef with Ordered[T]](o1: RowData, o2: RowData, column: Column, isAscending: Boolean): Int = {
    compareReferenceType[T](o1, o2, column, isAscending, (v1: T, v2: T) => {
      v1.compare(v2)
    })
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
    } else {
      if (isAscending) compareFunction.applyAsInt(c1, c2) else compareFunction.applyAsInt(c2, c1)
    }
  }

}
