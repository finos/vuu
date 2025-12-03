package org.finos.vuu.core.filter.`type`

import com.typesafe.scalalogging.LazyLogging
import org.finos.toolbox.collection.array.ImmutableArray
import org.finos.vuu.core.index.{BooleanIndexedField, CharIndexedField, DoubleIndexedField, EpochTimestampIndexedField, IndexedField, IntIndexedField, LongIndexedField, StringIndexedField}
import org.finos.vuu.core.table.datatype.EpochTimestamp
import org.finos.vuu.core.table.{Column, DataType, EmptyTablePrimaryKeys, RowData, TablePrimaryKeys}
import org.finos.vuu.feature.inmem.InMemTablePrimaryKeys
import org.finos.vuu.viewport.RowSource

trait PermissionFilter {

  def doFilter(source: RowSource, primaryKeys: TablePrimaryKeys, firstInChain: Boolean): TablePrimaryKeys

}

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

private case class PermissionFilterChain(filters: Iterable[PermissionFilter]) extends PermissionFilter with LazyLogging {

  override def doFilter(source: RowSource, primaryKeys: TablePrimaryKeys, firstInChain: Boolean): TablePrimaryKeys = {
    logger.trace(s"Starting filter with ${primaryKeys.length} rows")

    if (primaryKeys.isEmpty) {
      EmptyTablePrimaryKeys
    } else {
      filters.foldLeft(primaryKeys) {
        (remainingKeys, filter) => {
          val stillFirstInChain = firstInChain && remainingKeys.length == primaryKeys.length
          filter.doFilter(source, remainingKeys, stillFirstInChain)
        }
      }
    }
  }

}

private case class RowPermissionFilter(rowPredicate: RowData => Boolean) extends PermissionFilter with LazyLogging {

  override def doFilter(source: RowSource, primaryKeys: TablePrimaryKeys, firstInChain: Boolean): TablePrimaryKeys = {
    logger.trace(s"Starting filter with ${primaryKeys.length} rows")

    if (primaryKeys.isEmpty) {
      EmptyTablePrimaryKeys
    } else {
      val filtered = primaryKeys.filter(key => rowPredicate.apply(source.pullRow(key)))
      InMemTablePrimaryKeys(ImmutableArray.from[String](filtered.toArray))
    }
  }

}

private case class ContainsPermissionFilter(columnName: String, allowedValues: Set[String]) extends PermissionFilter with LazyLogging {

  override def doFilter(source: RowSource, primaryKeys: TablePrimaryKeys, firstInChain: Boolean): TablePrimaryKeys = {
    logger.trace(s"Starting filter with ${primaryKeys.length} rows")

    val column = source.asTable.columnForName(columnName)
    if (column == null || primaryKeys.isEmpty || allowedValues.isEmpty) {
      EmptyTablePrimaryKeys
    } else {
      source.asTable.indexForColumn(column) match {
        case Some(index: StringIndexedField) =>
          hitIndex(primaryKeys, index, allowedValues, firstInChain)
        case Some(index: LongIndexedField) =>
          hitIndex(primaryKeys, index, allowedValues.map(f => f.toLong), firstInChain)
        case Some(index: IntIndexedField) =>
          hitIndex(primaryKeys, index, allowedValues.map(f => f.toInt), firstInChain)
        case Some(index: DoubleIndexedField) =>
          hitIndex(primaryKeys, index, allowedValues.map(f => f.toDouble), firstInChain)
        case Some(index: BooleanIndexedField) =>
          hitIndex(primaryKeys, index, allowedValues.map(f => f.toBoolean), firstInChain)
        case Some(index: EpochTimestampIndexedField) =>
          hitIndex(primaryKeys, index, allowedValues.map(f => EpochTimestamp(f.toLong)), firstInChain)
        case Some(index: CharIndexedField) =>
          hitIndex(primaryKeys, index, allowedValues.map(f => f.charAt(0)), firstInChain)
        case _ =>
          logger.trace(s"Falling back to row filtering for $column as no Index found")
          filterByRow(source, primaryKeys, firstInChain, column)
      }
    }
  }

  private def hitIndex[T](primaryKeys: TablePrimaryKeys, indexedField: IndexedField[T], values: Set[T],
                          firstInChain: Boolean): TablePrimaryKeys = {
    val results = indexedField.find(values.toList)
    if (results.isEmpty) {
      EmptyTablePrimaryKeys
    } else if (firstInChain) {
      InMemTablePrimaryKeys(results)
    } else {
      primaryKeys.intersect(results)
    }
  }

  private def filterByRow(source: RowSource, primaryKeys: TablePrimaryKeys, firstInChain: Boolean, column: Column): TablePrimaryKeys = {
    val rowPermissionFilter = column.dataType match {
      case DataType.StringDataType =>
        buildFilter(column, allowedValues)
      case DataType.LongDataType =>
        buildFilter(column, allowedValues.map(f => f.toLong))
      case DataType.IntegerDataType =>
        buildFilter(column, allowedValues.map(f => f.toInt))
      case DataType.DoubleDataType =>
        buildFilter(column, allowedValues.map(f => f.toDouble))
      case DataType.BooleanDataType =>
        buildFilter(column, allowedValues.map(f => f.toBoolean))
      case DataType.EpochTimestampType =>
        buildFilter(column, allowedValues.map(f => EpochTimestamp(f.toLong)))
      case DataType.CharDataType =>
        buildFilter(column, allowedValues.map(f => f.charAt(0)))
      case _ =>
        logger.warn(s"Unable to permission filter $column")
        DenyAllPermissionFilter
    }

    rowPermissionFilter.doFilter(source, primaryKeys, firstInChain)
  }

  private def buildFilter[T](column: Column, items: Set[T]): RowPermissionFilter = {
    val predicate: RowData => Boolean = r => {
      val value = r.get(column)
      value != null && items.contains(value.asInstanceOf[T])
    }
    RowPermissionFilter(predicate)
  }
  
}
