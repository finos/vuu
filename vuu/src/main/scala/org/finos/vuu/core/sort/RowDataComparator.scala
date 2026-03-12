package org.finos.vuu.core.sort

import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.core.sort.SortDirection.Ascending
import org.finos.vuu.core.table.{Column, DataType, RowData}

trait RowDataComparator extends java.util.Comparator[RowData]

object RowDataComparator extends StrictLogging {

  def apply(columns: List[Column], sortDirections: List[SortDirection]): RowDataComparator = {
    val comparators = columns
      .lazyZip(sortDirections)
      .map((col, dir) => buildColumnComparator(col, dir == Ascending))
      .toArray

    comparators.length match {
      case 1 => SingleColumnRowDataComparatorImpl(comparators.head)
      case _ => RowDataComparatorImpl(comparators)
    }
  }

  private def buildColumnComparator(column: Column, isAscending: Boolean): ColumnSort = {
    column.dataType match {
      case DataType.StringDataType =>
        StringColumnSort(column, isAscending)
      case DataType.LongDataType | DataType.IntegerDataType | DataType.DoubleDataType |
           DataType.BooleanDataType | DataType.CharDataType | DataType.EpochTimestampType |
           DataType.ScaledDecimal2Type | DataType.ScaledDecimal4Type |
           DataType.ScaledDecimal6Type | DataType.ScaledDecimal8Type =>
        ComparableColumnSort(column, isAscending)
      case _ =>
        logger.warn(s"Unable to sort datatype ${column.dataType}")
        NoColumnSort
    }
  }

}

case class SingleColumnRowDataComparatorImpl(columnSort: ColumnSort) extends RowDataComparator {

  override def compare(o1: RowData, o2: RowData): Int = {
    columnSort.compare(o1, o2)
  }

}

case class RowDataComparatorImpl(comparators: Array[ColumnSort]) extends RowDataComparator {

  override def compare(o1: RowData, o2: RowData): Int = {
    var i = 0
    val len = comparators.length
    while (i < len) {
      val res = comparators(i).compare(o1, o2)
      if (res != 0) return res
      i += 1
    }
    0
  }
}

sealed trait ColumnSort {
  def compare(o1: RowData, o2: RowData): Int
}

object NoColumnSort extends ColumnSort {
  override def compare(o1: RowData, o2: RowData): Int = 0
}

case class StringColumnSort(column: Column, ascending: Boolean) extends ColumnSort {
  private val multiplier = if (ascending) 1 else -1
  override def compare(o1: RowData, o2: RowData): Int = {
    val v1 = o1.get(column).asInstanceOf[String]
    val v2 = o2.get(column).asInstanceOf[String]

    if (v1 eq v2) return 0
    if (v1 == null) return multiplier
    if (v2 == null) return -multiplier

    v1.compareToIgnoreCase(v2) * multiplier
  }
}

case class ComparableColumnSort(column: Column, ascending: Boolean) extends ColumnSort {
  private val multiplier = if (ascending) 1 else -1
  override def compare(o1: RowData, o2: RowData): Int = {
    val v1 = o1.get(column).asInstanceOf[Comparable[AnyRef]]
    val v2 = o2.get(column).asInstanceOf[AnyRef]

    if (v1 eq v2) return 0
    if (v1 == null) return multiplier
    if (v2 == null) return -multiplier

    v1.compareTo(v2) * multiplier
  }
}