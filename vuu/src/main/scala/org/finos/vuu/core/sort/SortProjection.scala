package org.finos.vuu.core.sort

import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.core.sort.SortDirection.Ascending
import org.finos.vuu.core.table.{Column, DataType}

trait SortProjectionComparator extends java.util.Comparator[Array[AnyRef]]

object SortProjectionComparator extends StrictLogging {

  def apply(columns: Array[Column], sortDirections: Array[SortDirection]): SortProjectionComparator = {
    val comparators = columns.indices.map { i =>
      val col = columns(i)
      val dir = sortDirections(i)
      buildColumnComparator(col, i + 1, dir == Ascending)
    }.toArray

    comparators.length match {
      case 1 => SingleColumnComparatorImpl(comparators.head)
      case _ => MultiColumnComparatorImpl(comparators)
    }
  }

  private def buildColumnComparator(column: Column, index: Int, isAscending: Boolean): ColumnSort = {
    column.dataType match {
      case DataType.StringDataType =>
        if (isAscending) StringColumnSortAsc(index) else StringColumnSortDesc(index)
      case DataType.LongDataType | DataType.IntegerDataType | DataType.DoubleDataType |
           DataType.BooleanDataType | DataType.CharDataType | DataType.EpochTimestampType |
           DataType.ScaledDecimal2Type | DataType.ScaledDecimal4Type |
           DataType.ScaledDecimal6Type | DataType.ScaledDecimal8Type =>
        if (isAscending) ComparableColumnSortAsc(index) else ComparableColumnSortDesc(index)
      case _ =>
        logger.warn(s"Unable to sort datatype ${column.dataType}")
        NoColumnSort
    }
  }

}

case class SingleColumnComparatorImpl(columnSort: ColumnSort) extends SortProjectionComparator {

  override def compare(o1: Array[AnyRef], o2: Array[AnyRef]): Int = {
    columnSort.compare(o1, o2)
  }

}

case class MultiColumnComparatorImpl(comparators: Array[ColumnSort]) extends SortProjectionComparator {

  override def compare(o1: Array[AnyRef], o2: Array[AnyRef]): Int = {
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
  def compare(o1: Array[AnyRef], o2: Array[AnyRef]): Int
}

object NoColumnSort extends ColumnSort {
  override def compare(o1: Array[AnyRef], o2: Array[AnyRef]): Int = 0
}

case class StringColumnSortAsc(index: Int) extends ColumnSort {
  override def compare(o1: Array[AnyRef], o2: Array[AnyRef]): Int = {
    val v1 = o1(index).asInstanceOf[String]
    val v2 = o2(index).asInstanceOf[String]

    if (v1 eq v2) 0
    else if (v1 == null) 1
    else if (v2 == null) -1
    else v1.compareToIgnoreCase(v2)
  }
}

case class StringColumnSortDesc(index: Int) extends ColumnSort {
  override def compare(o1: Array[AnyRef], o2: Array[AnyRef]): Int = {
    val v1 = o1(index).asInstanceOf[String]
    val v2 = o2(index).asInstanceOf[String]

    if (v1 eq v2) 0
    else if (v1 == null) -1
    else if (v2 == null) 1
    else v2.compareToIgnoreCase(v1)
  }
}

case class ComparableColumnSortAsc(index: Int) extends ColumnSort {
  override def compare(o1: Array[AnyRef], o2: Array[AnyRef]): Int = {
    val v1 = o1(index).asInstanceOf[Comparable[AnyRef]]
    val v2 = o2(index).asInstanceOf[Comparable[AnyRef]]

    if (v1 eq v2) 0
    else if (v1 == null) 1
    else if (v2 == null) -1
    else v1.compareTo(v2)
  }
}

case class ComparableColumnSortDesc(index: Int) extends ColumnSort {
  override def compare(o1: Array[AnyRef], o2: Array[AnyRef]): Int = {
    val v1 = o1(index).asInstanceOf[Comparable[AnyRef]]
    val v2 = o2(index).asInstanceOf[Comparable[AnyRef]]

    if (v1 eq v2) 0
    else if (v1 == null) -1
    else if (v2 == null) 1
    else v2.compareTo(v1)
  }
}