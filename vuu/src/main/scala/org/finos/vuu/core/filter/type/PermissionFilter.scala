package org.finos.vuu.core.filter.`type`

import com.typesafe.scalalogging.{LazyLogging, StrictLogging}
import org.finos.toolbox.collection.array.ImmutableArray
import org.finos.vuu.core.filter.{CompoundFilter, Filter}
import org.finos.vuu.core.index.{BooleanIndexedField, CharIndexedField, DoubleIndexedField, EpochTimestampIndexedField, IndexedField, IntIndexedField, LongIndexedField, ScaledDecimal2IndexedField, ScaledDecimal4IndexedField, ScaledDecimal6IndexedField, ScaledDecimal8IndexedField, StringIndexedField}
import org.finos.vuu.core.table.datatype.{EpochTimestamp, ScaledDecimal2, ScaledDecimal4, ScaledDecimal6, ScaledDecimal8}
import org.finos.vuu.core.table.{Column, DataType, EmptyTablePrimaryKeys, RowData, TablePrimaryKeys}
import org.finos.vuu.feature.inmem.InMemTablePrimaryKeys
import org.finos.vuu.viewport.{RowSource, ViewPortColumns}

trait PermissionFilter extends Filter { }

object PermissionFilter {

  def apply(rowPredicate: RowData => Boolean): PermissionFilter = RowPermissionFilter(rowPredicate)

  def apply(columnName: String, allowedValues: Set[String]): PermissionFilter = ContainsPermissionFilter(columnName, allowedValues)

  def apply(filters: Iterable[PermissionFilter]): PermissionFilter = PermissionFilterChain(filters)

}

object AllowAllPermissionFilter extends PermissionFilter {

  override def doFilter(source: RowSource, primaryKeys: TablePrimaryKeys, firstInChain: Boolean): TablePrimaryKeys = primaryKeys

}

object DenyAllPermissionFilter extends PermissionFilter {

  override def doFilter(source: RowSource, primaryKeys: TablePrimaryKeys, firstInChain: Boolean): TablePrimaryKeys = EmptyTablePrimaryKeys

}

private case class PermissionFilterChain(filters: Iterable[PermissionFilter]) extends PermissionFilter with StrictLogging {

  private val internalFilter = CompoundFilter(filters.toSeq: _*)

  override def doFilter(source: RowSource, primaryKeys: TablePrimaryKeys, firstInChain: Boolean): TablePrimaryKeys = {
    internalFilter.doFilter(source, primaryKeys, firstInChain)
  }

}

private case class RowPermissionFilter(rowPredicate: RowData => Boolean) extends PermissionFilter with StrictLogging {

  override def doFilter(source: RowSource, primaryKeys: TablePrimaryKeys, firstInChain: Boolean): TablePrimaryKeys = {
    logger.trace(s"Starting filter with ${primaryKeys.length} rows")
    if (primaryKeys.isEmpty) return primaryKeys

    val filtered = primaryKeys.view.filter(key => rowPredicate.apply(source.pullRow(key)))
    InMemTablePrimaryKeys(ImmutableArray.from[String](filtered))
  }

}

private case class ContainsPermissionFilter(columnName: String, allowedValues: Set[String]) extends PermissionFilter with StrictLogging {

  private lazy val longValues = allowedValues.map(f => f.toLong)
  private lazy val intValues = allowedValues.map(f => f.toInt)
  private lazy val doubleValues = allowedValues.map(f => f.toDouble)
  private lazy val booleanValues = allowedValues.map(f => f.toBoolean)
  private lazy val epochTimestampValues = allowedValues.map(f => EpochTimestamp(f.toLong))
  private lazy val charValues = allowedValues.map(f => f.charAt(0))
  private lazy val scaledDecimal2Values = allowedValues.map(s => ScaledDecimal2(s.toLong))
  private lazy val scaledDecimal4Values = allowedValues.map(s => ScaledDecimal4(s.toLong))
  private lazy val scaledDecimal6Values = allowedValues.map(s => ScaledDecimal6(s.toLong))
  private lazy val scaledDecimal8Values = allowedValues.map(s => ScaledDecimal8(s.toLong))

  override def doFilter(source: RowSource, primaryKeys: TablePrimaryKeys, firstInChain: Boolean): TablePrimaryKeys = {
    logger.trace(s"Starting filter with ${primaryKeys.length} rows")
    if (primaryKeys.isEmpty) return primaryKeys

    val column = source.asTable.columnForName(columnName)
    if (column == null || allowedValues.isEmpty) {
      EmptyTablePrimaryKeys
    } else {
      source.asTable.indexForColumn(column) match {
        case Some(index: StringIndexedField) =>
          hitIndex(primaryKeys, index, allowedValues, firstInChain)
        case Some(index: LongIndexedField) =>
          hitIndex(primaryKeys, index, longValues, firstInChain)
        case Some(index: IntIndexedField) =>
          hitIndex(primaryKeys, index, intValues, firstInChain)
        case Some(index: DoubleIndexedField) =>
          hitIndex(primaryKeys, index, doubleValues, firstInChain)
        case Some(index: BooleanIndexedField) =>
          hitIndex(primaryKeys, index, booleanValues, firstInChain)
        case Some(index: EpochTimestampIndexedField) =>
          hitIndex(primaryKeys, index, epochTimestampValues, firstInChain)
        case Some(index: CharIndexedField) =>
          hitIndex(primaryKeys, index, charValues, firstInChain)
        case Some(index: ScaledDecimal2IndexedField) =>
          hitIndex(primaryKeys, index, scaledDecimal2Values, firstInChain)
        case Some(index: ScaledDecimal4IndexedField) =>
          hitIndex(primaryKeys, index, scaledDecimal4Values, firstInChain)
        case Some(index: ScaledDecimal6IndexedField) =>
          hitIndex(primaryKeys, index, scaledDecimal6Values, firstInChain)
        case Some(index: ScaledDecimal8IndexedField) =>
          hitIndex(primaryKeys, index, scaledDecimal8Values, firstInChain)
        case _ =>
          logger.trace(s"Falling back to row filtering for $column as no Index found")
          filterByRow(source, primaryKeys, firstInChain, column)
      }
    }
  }

  private def hitIndex[T](primaryKeys: TablePrimaryKeys, indexedField: IndexedField[T], values: Set[T],
                          firstInChain: Boolean): TablePrimaryKeys = {
    val results = indexedField.find(values)
    if (results.isEmpty || firstInChain) {
      InMemTablePrimaryKeys(results.toImmutableArray)
    } else {
      val filtered = primaryKeys.view.filter(results.contains)
      InMemTablePrimaryKeys(ImmutableArray.from(filtered))
    }
  }

  private def filterByRow(source: RowSource, primaryKeys: TablePrimaryKeys, firstInChain: Boolean, column: Column): TablePrimaryKeys = {
    column.dataType match {
      case DataType.StringDataType =>
        applyFilter(source, primaryKeys, column, allowedValues)
      case DataType.LongDataType =>
        applyFilter(source, primaryKeys, column, longValues)
      case DataType.IntegerDataType =>
        applyFilter(source, primaryKeys, column, intValues)
      case DataType.DoubleDataType =>
        applyFilter(source, primaryKeys, column, doubleValues)
      case DataType.BooleanDataType =>
        applyFilter(source, primaryKeys, column, booleanValues)
      case DataType.EpochTimestampType =>
        applyFilter(source, primaryKeys, column, epochTimestampValues)
      case DataType.CharDataType =>
        applyFilter(source, primaryKeys,column, charValues)
      case DataType.ScaledDecimal2Type =>
        applyFilter(source, primaryKeys, column, scaledDecimal2Values)
      case DataType.ScaledDecimal4Type =>
        applyFilter(source, primaryKeys, column, scaledDecimal4Values)
      case DataType.ScaledDecimal6Type =>
        applyFilter(source, primaryKeys, column, scaledDecimal6Values)
      case DataType.ScaledDecimal8Type =>
        applyFilter(source, primaryKeys, column, scaledDecimal8Values)
      case _ =>
        logger.warn(s"Unable to permission filter $column")
        EmptyTablePrimaryKeys
    }
  }

  private def applyFilter[T](source: RowSource, primaryKeys: TablePrimaryKeys, column: Column, items: Set[T]): TablePrimaryKeys = {
    val predicate: RowData => Boolean = r => {
      val value = r.get(column)
      value != null && items.contains(value.asInstanceOf[T])
    }
    val filtered = primaryKeys.view.filter(key => predicate.apply(source.pullRow(key)))
    InMemTablePrimaryKeys(ImmutableArray.from[String](filtered))
  }
  
}
