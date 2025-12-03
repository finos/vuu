package org.finos.vuu.core.filter

import org.finos.toolbox.collection.array.ImmutableArray
import org.finos.vuu.core.filter.FilterClause.joinResults
import org.finos.vuu.core.index.*
import org.finos.vuu.core.table.column.{Error, Result}
import org.finos.vuu.core.table.datatype.EpochTimestamp
import org.finos.vuu.core.table.{EmptyTablePrimaryKeys, RowData, TablePrimaryKeys}
import org.finos.vuu.feature.inmem.InMemTablePrimaryKeys
import org.finos.vuu.viewport.{RowSource, ViewPortColumns}

sealed trait FilterClause {

  def filterAllSafe(rows: RowSource, rowKeys: TablePrimaryKeys, vpColumns: ViewPortColumns, firstInChain: Boolean): Result[TablePrimaryKeys] =
    this.validate(vpColumns).fold(errMsg => Error(errMsg), _ => Result(this.filterAll(rows, rowKeys, vpColumns, firstInChain)))

  def filterAll(rows: RowSource, rowKeys: TablePrimaryKeys, vpColumns: ViewPortColumns, firstInChain: Boolean): TablePrimaryKeys
  def validate(vpColumns: ViewPortColumns): Result[true]
}

private object FilterClause {
  def joinResults(results: List[Result[true]]): Result[true] =
    results.foldLeft[Result[true]](Result(true))(_.joinWithErrors(_)((a, _) => a, errorSep = "\n"))
}

sealed trait RowFilterClause extends FilterClause {
  protected def columnName: String
  protected def applyFilter(value: Any): Boolean
  def filter(row: RowData): Boolean = this.applyFilter(row.get(columnName))

  override def filterAll(rows: RowSource, rowKeys: TablePrimaryKeys, vpColumns: ViewPortColumns, firstInChain: Boolean): TablePrimaryKeys = {
    if (rowKeys.isEmpty) {
      EmptyTablePrimaryKeys
    } else {
      InMemTablePrimaryKeys(ImmutableArray.from(
        rowKeys.filter(key => filter(rows.pullRow(key, vpColumns))).toArray
      ))
    }
  }

  override def validate(vpColumns: ViewPortColumns): Result[true] = columnExistsInVpColumns(vpColumns)

  private def columnExistsInVpColumns(vpColumns: ViewPortColumns): Result[true] =
    if (vpColumns.columnExists(this.columnName)) Result(true)
    else Error(s"Column `$columnName` not found.")

  protected def hitIndex[T](primaryKeys: TablePrimaryKeys, value: T,
                            indexLookup: T => ImmutableArray[String], firstInChain: Boolean): TablePrimaryKeys = {
      val results  = indexLookup.apply(value)
      if (results.isEmpty) {
        EmptyTablePrimaryKeys
      } else if (firstInChain) {
        InMemTablePrimaryKeys(results)
      } else {
        primaryKeys.intersect(results)
      }
  }

}

case class NotClause(decorated: FilterClause) extends FilterClause {
  override def filterAll(rows: RowSource, rowKeys: TablePrimaryKeys, vpColumns: ViewPortColumns, firstInChain: Boolean): TablePrimaryKeys = {
    val matching = decorated.filterAll(rows, rowKeys, vpColumns, firstInChain).toSet
    val notMatching = rowKeys.filter(!matching.contains(_))
    InMemTablePrimaryKeys(ImmutableArray.from(notMatching.toArray))
  }

  override def validate(vpColumns: ViewPortColumns): Result[true] = decorated.validate(vpColumns)
}

case class OrClause(subclauses: List[FilterClause]) extends FilterClause {
  override def filterAll(rows: RowSource, primaryKeys: TablePrimaryKeys,
                         vpColumns: ViewPortColumns, firstInChain: Boolean): TablePrimaryKeys = InMemTablePrimaryKeys( ImmutableArray.from(
    subclauses.flatMap(_.filterAll(rows, primaryKeys, vpColumns, firstInChain)).distinct.toArray
  ))

  override def validate(vpColumns: ViewPortColumns): Result[true] = joinResults(subclauses.map(_.validate(vpColumns)))
}

case class AndClause(subclauses: List[FilterClause]) extends FilterClause {
  override def filterAll(source: RowSource, primaryKeys: TablePrimaryKeys,
                         viewPortColumns: ViewPortColumns, firstInChain: Boolean): TablePrimaryKeys =
    subclauses.foldLeft(primaryKeys) {
      (remainingKeys, subclause) => {
        val isStillFirstInChain = firstInChain && remainingKeys.length == primaryKeys.length
        subclause.filterAll(source, remainingKeys, viewPortColumns, isStillFirstInChain)
      }
    }

  override def validate(vpColumns: ViewPortColumns): Result[true] = joinResults(subclauses.map(_.validate(vpColumns)))
}

case class StartsClause(columnName: String, prefix: String) extends RowFilterClause {
  override def applyFilter(datum: Any): Boolean = {
    if (datum == null) return false
    datum.toString.startsWith(prefix)
  }
}

case class EndsClause(columnName: String, suffix: String) extends RowFilterClause {
  override def applyFilter(datum: Any): Boolean = {
    if (datum == null) return false
    datum.toString.endsWith(suffix)
  }
}

case class ContainsClause(columnName: String, substring: String) extends RowFilterClause {
  override def applyFilter(data: Any): Boolean = {
    data != null && data.toString.contains(substring)
  }
}

case class InClause(columnName: String, values: List[String]) extends RowFilterClause {
  override def applyFilter(data: Any): Boolean = {
    data != null && values.contains(data.toString)
  }

  override def filterAll(rows: RowSource, rowKeys: TablePrimaryKeys,
                         viewPortColumns: ViewPortColumns, firstInChain: Boolean): TablePrimaryKeys = {
    val column = rows.asTable.columnForName(columnName)
    rows.asTable.indexForColumn(column) match {
      case Some(ix: StringIndexedField)          => hitIndex(rowKeys, values, ix, firstInChain)
      case Some(ix: DoubleIndexedField)          => hitIndex(rowKeys, values.map(s => s.toDouble), ix, firstInChain)
      case Some(ix: IntIndexedField)             => hitIndex(rowKeys, values.map(s => s.toInt), ix, firstInChain)
      case Some(ix: LongIndexedField)            => hitIndex(rowKeys, values.map(s => s.toLong), ix, firstInChain)
      case Some(ix: BooleanIndexedField)         => hitIndex(rowKeys, values.map(s => s.toBoolean), ix, firstInChain)
      case Some(ix: EpochTimestampIndexedField)  => hitIndex(rowKeys, values.map(s => EpochTimestamp(s.toLong)), ix, firstInChain)
      case Some(ix: CharIndexedField)            => hitIndex(rowKeys, values.map(s => s.charAt(0)), ix, firstInChain)
      case _                                     => super.filterAll(rows, rowKeys, viewPortColumns, firstInChain)
    }
  }

  private def hitIndex[T](rowKeys: TablePrimaryKeys, values: List[T],
                          index: IndexedField[T], firstInChain: Boolean): TablePrimaryKeys = {
    hitIndex(rowKeys, values, f => index.find(f), firstInChain)
  }

}

case class GreaterThanClause(columnName: String, value: Double) extends RowFilterClause {
  override def applyFilter(datum: Any): Boolean = {
    if (datum == null) return false

    // the calling code in TreeBuilderImpl.applyFilter() returns all rows on exception
    try { value < datum.toString.toDouble } catch { case _: NumberFormatException  => true}
  }

  override def filterAll(rows: RowSource, rowKeys: TablePrimaryKeys,
                         viewPortColumns: ViewPortColumns, firstInChain: Boolean): TablePrimaryKeys = {
    val column = rows.asTable.columnForName(columnName)
    rows.asTable.indexForColumn(column) match {
      case Some(ix: DoubleIndexedField)           => hitIndex(rowKeys, value, ix, firstInChain)
      case Some(ix: IntIndexedField)              => hitIndex(rowKeys, value.toInt, ix, firstInChain)
      case Some(ix: LongIndexedField)             => hitIndex(rowKeys, value.toLong, ix, firstInChain)
      case Some(ix: EpochTimestampIndexedField)   => hitIndex(rowKeys, EpochTimestamp(value.toLong), ix, firstInChain)
      case _                                      => super.filterAll(rows, rowKeys, viewPortColumns, firstInChain)
    }
  }

  private def hitIndex[T](rowKeys: TablePrimaryKeys, value: T,
                          index: IndexedField[T], firstInChain: Boolean): TablePrimaryKeys = {
    hitIndex(rowKeys, value, f => index.greaterThan(f), firstInChain)
  }

}

case class LessThanClause(columnName: String, value: Double) extends RowFilterClause {
  override def applyFilter(datum: Any): Boolean = {
    if (datum == null) return false

    // the calling code in TreeBuilderImpl.applyFilter() returns all rows on exception
    try { value > datum.toString.toDouble } catch { case _: NumberFormatException  => false}
  }

  override def filterAll(rows: RowSource, rowKeys: TablePrimaryKeys,
                         viewPortColumns: ViewPortColumns, firstInChain: Boolean): TablePrimaryKeys = {
    val column = rows.asTable.columnForName(columnName)
    rows.asTable.indexForColumn(column) match {
      case Some(ix: DoubleIndexedField)           => hitIndex(rowKeys, value, ix, firstInChain)
      case Some(ix: IntIndexedField)              => hitIndex(rowKeys, value.toInt, ix, firstInChain)
      case Some(ix: LongIndexedField)             => hitIndex(rowKeys, value.toLong, ix, firstInChain)
      case Some(ix: EpochTimestampIndexedField)   => hitIndex(rowKeys, EpochTimestamp(value.toLong), ix, firstInChain)
      case _                                      => super.filterAll(rows, rowKeys, viewPortColumns, firstInChain)
    }
  }

  private def hitIndex[T](rowKeys: TablePrimaryKeys, value: T,
                          index: IndexedField[T], firstInChain: Boolean): TablePrimaryKeys = {
    hitIndex(rowKeys, value, f => index.lessThan(f), firstInChain)
  }

}

case class EqualsClause(columnName: String, value: String) extends RowFilterClause {
  override def applyFilter(data: Any): Boolean = {
    data match {
      case null => false
      case s: String => s == value
      case i: Int => i == value.toInt
      case i: Long => i == value.toLong
      case f: Float => f == value.toFloat
      case d: Double => d == value.toDouble
      case b: Boolean => b == value.equalsIgnoreCase("true")
      case e: EpochTimestamp => e.nanos == value.toLong
      case c: Char => c == value.charAt(0)
    }
  }

  override def filterAll(rows: RowSource, rowKeys: TablePrimaryKeys,
                         viewPortColumns: ViewPortColumns, firstInChain: Boolean): TablePrimaryKeys = {
    val column = rows.asTable.columnForName(columnName)
    rows.asTable.indexForColumn(column) match {
      case Some(ix: StringIndexedField)          => hitIndex(rowKeys, value, ix, firstInChain)
      case Some(ix: DoubleIndexedField)          => hitIndex(rowKeys, value.toDouble, ix, firstInChain)
      case Some(ix: IntIndexedField)             => hitIndex(rowKeys, value.toInt, ix, firstInChain)
      case Some(ix: LongIndexedField)            => hitIndex(rowKeys, value.toLong, ix, firstInChain)
      case Some(ix: BooleanIndexedField)         => hitIndex(rowKeys, value.toBoolean, ix, firstInChain)
      case Some(ix: EpochTimestampIndexedField)  => hitIndex(rowKeys, EpochTimestamp(value.toLong), ix, firstInChain)
      case Some(ix: CharIndexedField)            => hitIndex(rowKeys, value.charAt(0), ix, firstInChain)
      case _                                     => super.filterAll(rows, rowKeys, viewPortColumns, firstInChain)
    }
  }

  private def hitIndex[T](rowKeys: TablePrimaryKeys, value: T,
                          index: IndexedField[T], firstInChain: Boolean): TablePrimaryKeys = {
    hitIndex(rowKeys, value, f => index.find(f), firstInChain)
  }

}


