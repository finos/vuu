package org.finos.vuu.core.sort

import org.finos.vuu.core.table.{Column, DataType, RowData}

import java.lang
import scala.annotation.tailrec
import math.Ordered.orderingToOrdered

object SortCompares {

  @tailrec
  def compare(o1: RowData, o2: RowData, columns: List[Column], sortDirections: List[Char], columnIndex: Int): Int = {

    val activeColumn = columns(columnIndex)
    val direction    = sortDirections(columnIndex)

    val compareValue = if(activeColumn.dataType.equals(DataType.StringDataType)){
        compareString(o1, o2, activeColumn, direction)
    }else if(activeColumn.dataType.equals(DataType.CharDataType)){
        compareChar(o1, o2, activeColumn, direction)
    } else if (activeColumn.dataType.equals(DataType.IntegerDataType)) {
      compareInt(o1, o2, activeColumn, direction)
    } else if (activeColumn.dataType.equals(DataType.BooleanDataType)) {
      compareBoolean(o1, o2, activeColumn, direction)
    } else if (activeColumn.dataType.equals(DataType.DoubleDataType)) {
      compareDouble(o1, o2, activeColumn, direction)
    } else if (activeColumn.dataType.equals(DataType.LongDataType)) {
      compareLong(o1, o2, activeColumn, direction)
    }else {
      throw new Exception("have field but don't know what it is....")
    }

    if(compareValue != 0){
       compareValue
    }else if(columnIndex == (columns.length - 1)){
      compareValue
    }else{
      compare(o1, o2, columns, sortDirections, columnIndex + 1)
    }
  }

  def compareChar(o1: RowData, o2: RowData, column: Column, direction: Char): Int = {
    val c1 = o1.get(column).asInstanceOf[Char]
    val c2 = o2.get(column).asInstanceOf[Char]
    compareWithDirection(c1, c2)(direction)
  }

  def compareString(o1: RowData, o2: RowData, column: Column, direction: Char): Int = {
    val c1 = getString(o1.get(column))
    val c2 = getString(o2.get(column))

    val resultIfAscending = c1.compareToIgnoreCase(c2)
    switchSignIfDescending(resultIfAscending, direction = direction)
  }

  private def getString(value: Any): String = {
    if (value == null) {
      ""
    } else {
      value.asInstanceOf[String]
    }
  }

  def compareDouble(o1: RowData, o2: RowData, column: Column, direction: Char): Int = {
    val c1 = o1.get(column).asInstanceOf[Double]
    val c2 = o2.get(column).asInstanceOf[Double]
    compareWithDirection(c1, c2)(direction)
  }

  def compareBoolean(o1: RowData, o2: RowData, column: Column, direction: Char): Int = {
    val c1 = o1.get(column).asInstanceOf[Boolean]
    val c2 = o2.get(column).asInstanceOf[Boolean]

    val lessThan = if (direction == 'A') 1 else -1
    val greaterThan = if (direction == 'A') -1 else 1

    if (c1 == true && c2 == false) {
      lessThan
    } else if (c1 == false && c2 == true) {
      greaterThan
    } else {
      0
    }
  }

  def compareInt(o1: RowData, o2: RowData, column: Column, direction: Char): Int = {
    val c1 = o1.get(column).asInstanceOf[Int]
    val c2 = o2.get(column).asInstanceOf[Int]
    compareWithDirection(c1, c2)(direction)
  }

  def compareLong(o1: RowData, o2: RowData, column: Column, direction: Char): Int = {
    val c1 = o1.get(column).asInstanceOf[Long]
    val c2 = o2.get(column).asInstanceOf[Long]
    compareWithDirection(c1, c2)(direction)
  }

  private def compareWithDirection[T: Ordering](v1: T, v2: T)(direction: Char): Int = {
    val resultIfAscending = v1.compare(v2)
    switchSignIfDescending(resultIfAscending, direction)
  }

  private def switchSignIfDescending(res: Int, direction: Char): Int = if (direction == 'A') res else res * -1
}
