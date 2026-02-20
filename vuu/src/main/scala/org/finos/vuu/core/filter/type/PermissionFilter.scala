package org.finos.vuu.core.filter.`type`

import com.typesafe.scalalogging.StrictLogging
import org.finos.toolbox.collection.array.{ImmutableArray, VectorImmutableArray}
import org.finos.vuu.core.filter.Filter
import org.finos.vuu.core.index.{BooleanIndexedField, CharIndexedField, DoubleIndexedField, EpochTimestampIndexedField, IndexedField, IntIndexedField, LongIndexedField, StringIndexedField}
import org.finos.vuu.core.table.datatype.EpochTimestamp
import org.finos.vuu.core.table.{Column, DataType, EmptyTablePrimaryKeys, RowData, TablePrimaryKeys}
import org.finos.vuu.feature.inmem.InMemTablePrimaryKeys
import org.finos.vuu.viewport.RowSource

import java.util.Objects

trait PermissionFilter extends Filter {

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

private case class PermissionFilterChain(filters: Iterable[PermissionFilter]) extends PermissionFilter with StrictLogging {

  override def doFilter(source: RowSource, primaryKeys: TablePrimaryKeys, firstInChain: Boolean): TablePrimaryKeys = {
    logger.trace(s"Starting filter with ${primaryKeys.length} rows")
    if (primaryKeys.isEmpty || filters.isEmpty) return primaryKeys

    var remainingKeys = primaryKeys
    val filterIterator = filters.iterator

    while (filterIterator.hasNext && remainingKeys.nonEmpty) {
      val filter = filterIterator.next()
      val stillFirst = firstInChain && (remainingKeys eq primaryKeys)
      remainingKeys = filter.doFilter(source, remainingKeys, stillFirst)
    }

    remainingKeys
  }

  private lazy val hash = filters.hashCode()

  override def hashCode(): Int = hash

}

private case class RowPermissionFilter(rowPredicate: RowData => Boolean) extends PermissionFilter with StrictLogging {

  override def doFilter(source: RowSource, primaryKeys: TablePrimaryKeys, firstInChain: Boolean): TablePrimaryKeys = {
    logger.trace(s"Starting filter with ${primaryKeys.length} rows")
    if (primaryKeys.isEmpty) return primaryKeys

    val filtered = primaryKeys.filter(key => rowPredicate.apply(source.pullRow(key)))
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
        case _ =>
          logger.trace(s"Falling back to row filtering for $column as no Index found")
          filterByRow(source, primaryKeys, firstInChain, column)
      }
    }
  }

  private def hitIndex[T](primaryKeys: TablePrimaryKeys, indexedField: IndexedField[T], values: Set[T],
                          firstInChain: Boolean): TablePrimaryKeys = {
    val results = indexedField.find(values)
    if (results.isEmpty) {
      EmptyTablePrimaryKeys
    } else if (firstInChain) {
      InMemTablePrimaryKeys(results.toImmutableArray)
    } else {
      val keyLength = primaryKeys.length
      val builder = Vector.newBuilder[String]
      builder.sizeHint(Math.min(keyLength, results.length))

      var i = 0
      while (i < keyLength) {
        val key = primaryKeys.get(i)
        if (results.contains(key)) {
          builder += key
        }
        i += 1
      }

      InMemTablePrimaryKeys(VectorImmutableArray.from(builder.result()))
    }
  }

  private def filterByRow(source: RowSource, primaryKeys: TablePrimaryKeys, firstInChain: Boolean, column: Column): TablePrimaryKeys = {
    val rowPermissionFilter = column.dataType match {
      case DataType.StringDataType =>
        buildFilter(column, allowedValues)
      case DataType.LongDataType =>
        buildFilter(column, longValues)
      case DataType.IntegerDataType =>
        buildFilter(column, intValues)
      case DataType.DoubleDataType =>
        buildFilter(column, doubleValues)
      case DataType.BooleanDataType =>
        buildFilter(column, booleanValues)
      case DataType.EpochTimestampType =>
        buildFilter(column, epochTimestampValues)
      case DataType.CharDataType =>
        buildFilter(column, charValues)
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

  private lazy val hash = Objects.hash(columnName, allowedValues)

  override def hashCode(): Int = hash

}
