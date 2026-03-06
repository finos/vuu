package org.finos.vuu.core.filter

import org.finos.toolbox.collection.array.ImmutableArray
import org.finos.vuu.core.filter.FilterClause.joinResults
import org.finos.vuu.core.index.*
import org.finos.vuu.core.table.column.{Error, Result}
import org.finos.vuu.core.table.datatype.{EpochTimestamp, ScaledDecimal, ScaledDecimal2, ScaledDecimal4, ScaledDecimal6, ScaledDecimal8}
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
      rowKeys
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
                         viewPortColumns: ViewPortColumns, firstInChain: Boolean): TablePrimaryKeys = {
    if (primaryKeys.isEmpty) {
      primaryKeys
    } else {
      subclauses.foldLeft(primaryKeys) {
        (remainingKeys, subclause) => {
          if (remainingKeys.isEmpty) {
            remainingKeys
          } else {
            val stillFirstInChain = firstInChain && remainingKeys == primaryKeys
            subclause.filterAll(source, remainingKeys, viewPortColumns, stillFirstInChain)
          }
        }
      }
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
      case Some(ix: ScaledDecimal2IndexedField)  => hitIndex(rowKeys, values.map(s => ScaledDecimal2(s.toLong)), ix, firstInChain)
      case Some(ix: ScaledDecimal4IndexedField)  => hitIndex(rowKeys, values.map(s => ScaledDecimal4(s.toLong)), ix, firstInChain)
      case Some(ix: ScaledDecimal6IndexedField)  => hitIndex(rowKeys, values.map(s => ScaledDecimal6(s.toLong)), ix, firstInChain)
      case Some(ix: ScaledDecimal8IndexedField)  => hitIndex(rowKeys, values.map(s => ScaledDecimal8(s.toLong)), ix, firstInChain)
      case _                                     => super.filterAll(rows, rowKeys, viewPortColumns, firstInChain)
    }
  }

  private def hitIndex[T](rowKeys: TablePrimaryKeys, values: List[T],
                          index: IndexedField[T], firstInChain: Boolean): TablePrimaryKeys = {
    hitIndex(rowKeys, values, f => index.find(f), firstInChain)
  }

}

case class EqualsClause(columnName: String, value: String) extends RowFilterClause {

  private lazy val intValue = value.toInt
  private lazy val longValue = value.toLong
  private lazy val doubleValue = value.toDouble
  private lazy val booleanValue = value.equalsIgnoreCase("true")
  private lazy val charValue = value.charAt(0)

  override def applyFilter(data: Any): Boolean = {
    data match {
      case null => false
      case s: String => s == value
      case i: Int => i == intValue
      case i: Long => i == longValue
      case d: Double => d == doubleValue
      case b: Boolean => b == booleanValue
      case e: EpochTimestamp => e.millis == longValue
      case sd: ScaledDecimal => sd.scaledValue == longValue
      case c: Char => c == charValue
    }
  }

  override def filterAll(rows: RowSource, rowKeys: TablePrimaryKeys,
                         viewPortColumns: ViewPortColumns, firstInChain: Boolean): TablePrimaryKeys = {
    val column = rows.asTable.columnForName(columnName)
    rows.asTable.indexForColumn(column) match {
      case Some(ix: StringIndexedField)          => hitIndex(rowKeys, value, ix, firstInChain)
      case Some(ix: DoubleIndexedField)          => hitIndex(rowKeys, doubleValue, ix, firstInChain)
      case Some(ix: IntIndexedField)             => hitIndex(rowKeys, intValue, ix, firstInChain)
      case Some(ix: LongIndexedField)            => hitIndex(rowKeys, longValue, ix, firstInChain)
      case Some(ix: BooleanIndexedField)         => hitIndex(rowKeys, booleanValue, ix, firstInChain)
      case Some(ix: EpochTimestampIndexedField)  => hitIndex(rowKeys, EpochTimestamp(longValue), ix, firstInChain)
      case Some(ix: CharIndexedField)            => hitIndex(rowKeys, charValue, ix, firstInChain)
      case Some(ix: ScaledDecimal2IndexedField)  => hitIndex(rowKeys, ScaledDecimal2(longValue), ix, firstInChain)
      case Some(ix: ScaledDecimal4IndexedField)  => hitIndex(rowKeys, ScaledDecimal4(longValue), ix, firstInChain)
      case Some(ix: ScaledDecimal6IndexedField)  => hitIndex(rowKeys, ScaledDecimal6(longValue), ix, firstInChain)
      case Some(ix: ScaledDecimal8IndexedField)  => hitIndex(rowKeys, ScaledDecimal8(longValue), ix, firstInChain)
      case _                                     => super.filterAll(rows, rowKeys, viewPortColumns, firstInChain)
    }
  }

  private def hitIndex[T](rowKeys: TablePrimaryKeys, value: T,
                          index: IndexedField[T], firstInChain: Boolean): TablePrimaryKeys = {
    hitIndex(rowKeys, value, f => index.find(f), firstInChain)
  }

}

case class GreaterThanClause(override val columnName: String,
                             override val value: String) extends NumericComparisonClause(columnName, value) {
  override protected def compareDouble(filterVal: Double, datum: Double): Boolean = filterVal < datum
  override protected def compareLong(filterVal: Long, datum: Long): Boolean      = filterVal < datum
  override protected def compareInt(filterVal: Int, datum: Int): Boolean         = filterVal < datum
  override protected def indexOp[T](idx: IndexedField[T], v: T): ImmutableArray[String] = idx.greaterThan(v)
}

case class GreaterThanOrEqualsClause(override val columnName: String,
                                     override val value: String) extends NumericComparisonClause(columnName, value) {
  override protected def compareDouble(filterVal: Double, datum: Double): Boolean = filterVal <= datum
  override protected def compareLong(filterVal: Long, datum: Long): Boolean      = filterVal <= datum
  override protected def compareInt(filterVal: Int, datum: Int): Boolean         = filterVal <= datum
  override protected def indexOp[T](idx: IndexedField[T], v: T): ImmutableArray[String] = idx.greaterThanOrEqual(v)
}

case class LessThanClause(override val columnName: String,
                          override val value: String) extends NumericComparisonClause(columnName, value) {
  override protected def compareDouble(filterVal: Double, datum: Double): Boolean = filterVal > datum
  override protected def compareLong(filterVal: Long, datum: Long): Boolean      = filterVal > datum
  override protected def compareInt(filterVal: Int, datum: Int): Boolean         = filterVal > datum
  override protected def indexOp[T](idx: IndexedField[T], v: T): ImmutableArray[String] = idx.lessThan(v)
}

case class LessThanOrEqualsClause(override val columnName: String,
                                  override val value: String) extends NumericComparisonClause(columnName, value) {
  override protected def compareDouble(filterVal: Double, datum: Double): Boolean = filterVal >= datum
  override protected def compareLong(filterVal: Long, datum: Long): Boolean      = filterVal >= datum
  override protected def compareInt(filterVal: Int, datum: Int): Boolean         = filterVal >= datum
  override protected def indexOp[T](idx: IndexedField[T], v: T): ImmutableArray[String] = idx.lessThanOrEqual(v)
}

private abstract class NumericComparisonClause(val columnName: String, val value: String) extends RowFilterClause {

  private lazy val intValue: Int = value.toInt
  private lazy val longValue: Long = value.toLong
  private lazy val doubleValue: Double = value.toDouble
  private lazy val epochTimestampValue = EpochTimestamp(longValue)
  private lazy val scaledDecimal2Value = ScaledDecimal2(longValue)
  private lazy val scaledDecimal4Value = ScaledDecimal4(longValue)
  private lazy val scaledDecimal6Value = ScaledDecimal6(longValue)
  private lazy val scaledDecimal8Value = ScaledDecimal8(longValue)

  protected def compareDouble(filterVal: Double, datum: Double): Boolean
  protected def compareLong(filterVal: Long, datum: Long): Boolean
  protected def compareInt(filterVal: Int, datum: Int): Boolean
  protected def indexOp[T](index: IndexedField[T], value: T): ImmutableArray[String]

  override def applyFilter(datum: Any): Boolean = datum match {
    case null => false
    case d: Double         => compareDouble(doubleValue, d)
    case i: Int            => compareInt(intValue, i)
    case l: Long           => compareLong(longValue, l)
    case e: EpochTimestamp => compareLong(longValue, e.millis)
    case sd: ScaledDecimal => compareLong(longValue, sd.scaledValue)
    case _                 => false
  }

  override def filterAll(rows: RowSource, rowKeys: TablePrimaryKeys,
                         viewPortColumns: ViewPortColumns, firstInChain: Boolean): TablePrimaryKeys = {
    val column = rows.asTable.columnForName(columnName)
    rows.asTable.indexForColumn(column) match {
      case Some(ix: DoubleIndexedField)         => hitIndex(rowKeys, doubleValue, ix, firstInChain)
      case Some(ix: IntIndexedField)            => hitIndex(rowKeys, intValue, ix, firstInChain)
      case Some(ix: LongIndexedField)           => hitIndex(rowKeys, longValue, ix, firstInChain)
      case Some(ix: EpochTimestampIndexedField) => hitIndex(rowKeys, epochTimestampValue, ix, firstInChain)
      case Some(ix: ScaledDecimal2IndexedField) => hitIndex(rowKeys, scaledDecimal2Value, ix, firstInChain)
      case Some(ix: ScaledDecimal4IndexedField) => hitIndex(rowKeys, scaledDecimal4Value, ix, firstInChain)
      case Some(ix: ScaledDecimal6IndexedField) => hitIndex(rowKeys, scaledDecimal6Value, ix, firstInChain)
      case Some(ix: ScaledDecimal8IndexedField) => hitIndex(rowKeys, scaledDecimal8Value, ix, firstInChain)
      case _                                    => super.filterAll(rows, rowKeys, viewPortColumns, firstInChain)
    }
  }

  private def hitIndex[T](rowKeys: TablePrimaryKeys, v: T,
                          index: IndexedField[T], firstInChain: Boolean): TablePrimaryKeys = {
    hitIndex(rowKeys, v, _ => indexOp(index, v), firstInChain)
  }
}
