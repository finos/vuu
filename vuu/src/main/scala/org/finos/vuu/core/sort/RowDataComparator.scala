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
    RowDataComparatorImpl(comparators)
  }

  private def buildColumnComparator(column: Column, isAscending: Boolean): (RowData, RowData) => Int = {
    column.dataType match {
      case DataType.StringDataType =>
        (o1: RowData, o2: RowData) => compareString(o1.get(column), o2.get(column), isAscending)
      case DataType.LongDataType | DataType.IntegerDataType | DataType.DoubleDataType |
           DataType.BooleanDataType | DataType.CharDataType | DataType.EpochTimestampType |
           DataType.ScaledDecimal2Type | DataType.ScaledDecimal4Type |
           DataType.ScaledDecimal6Type | DataType.ScaledDecimal8Type =>
        (o1: RowData, o2: RowData) => compareComparable(o1.get(column), o2.get(column), isAscending)
      case _ =>
        logger.warn(s"Unable to sort datatype ${column.dataType}")
        (_, _) => 0
    }
  }

  private def compareComparable(v1: Any, v2: Any, isAscending: Boolean): Int = {
    val c1 = v1.asInstanceOf[Comparable[AnyRef]]
    val c2 = v2.asInstanceOf[AnyRef]

    if (c1 eq c2) 0
    else if (c1 == null) if (isAscending) 1 else -1
    else if (c2 == null) if (isAscending) -1 else 1
    else {
      val res = c1.compareTo(c2)
      if (isAscending) res else -res
    }
  }

  private def compareString(v1: Any, v2: Any, isAscending: Boolean): Int = {
    val c1 = v1.asInstanceOf[String]
    val c2 = v2.asInstanceOf[String]

    if (c1 eq c2) 0
    else if (c1 == null) if (isAscending) 1 else -1
    else if (c2 == null) if (isAscending) -1 else 1
    else {
      val res = c1.compareToIgnoreCase(c2)
      if (isAscending) res else -res
    }
  }

}

case class RowDataComparatorImpl(comparators: Array[(RowData, RowData) => Int]) extends RowDataComparator {

  override def compare(o1: RowData, o2: RowData): Int = {
    var i = 0
    var result = 0
    while (i < comparators.length && result == 0) {
      result = comparators(i)(o1, o2)
      i += 1
    }
    result
  }

}