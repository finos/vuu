package org.finos.vuu.core.filter

import org.finos.toolbox.collection.array.ImmutableArray
import org.finos.toolbox.collection.set.ImmutableArraySet
import org.finos.vuu.core.filter.FilterClause.joinResults
import org.finos.vuu.core.index.*
import org.finos.vuu.core.table.column.{Error, Result}
import org.finos.vuu.core.table.datatype.{EpochTimestamp, ScaledDecimal, ScaledDecimal2, ScaledDecimal4, ScaledDecimal6, ScaledDecimal8}
import org.finos.vuu.core.table.{RowData, TablePrimaryKeys}
import org.finos.vuu.feature.inmem.InMemTablePrimaryKeys
import org.finos.vuu.viewport.{RowSource, ViewPortColumns}

import scala.collection.immutable.HashSet

sealed trait FilterClause {

  def filterAllSafe(rows: RowSource, rowKeys: Iterable[String], vpColumns: ViewPortColumns, firstInChain: Boolean): Result[TablePrimaryKeys] =
    this.validate(vpColumns).fold(
      errMsg => Error(errMsg),
      _ => Result(InMemTablePrimaryKeys(ImmutableArray.from(this.filterAll(rows, rowKeys, vpColumns, firstInChain))))
    )

  def filterAll(rows: RowSource, rowKeys: Iterable[String], vpColumns: ViewPortColumns, firstInChain: Boolean): Iterable[String]

  def validate(vpColumns: ViewPortColumns): Result[true]
}

private object FilterClause {
  def joinResults(results: Array[Result[true]]): Result[true] =
    results.foldLeft[Result[true]](Result(true))(_.joinWithErrors(_)((a, _) => a))
}

sealed trait RowFilterClause extends FilterClause {
  protected def columnName: String
  protected def applyFilter(value: Any): Boolean

  def filter(row: RowData): Boolean = this.applyFilter(row.get(columnName))

  override def filterAll(rows: RowSource, rowKeys: Iterable[String],
                         vpColumns: ViewPortColumns, firstInChain: Boolean): Iterable[String] = {
    if (rowKeys.isEmpty) {
      rowKeys
    } else {
      rowKeys.view.filter(key => filter(rows.pullRow(key, vpColumns)))
    }
  }

  override def validate(vpColumns: ViewPortColumns): Result[true] = columnExistsInVpColumns(vpColumns)

  private def columnExistsInVpColumns(vpColumns: ViewPortColumns): Result[true] =
    if (vpColumns.columnExists(this.columnName)) Result(true)
    else Error(s"Column `$columnName` not found.")

  protected def hitIndex[T](primaryKeys: Iterable[String], value: T,
                            indexLookup: T => ImmutableArraySet[String], firstInChain: Boolean): Iterable[String] = {
      val results  = indexLookup.apply(value)
      if (results.isEmpty || firstInChain) {
        results
      } else {
        primaryKeys.view.filter(results.contains)
      }
  }

}

case class NotClause(decorated: FilterClause) extends FilterClause {

  override def filterAll(rows: RowSource, rowKeys: Iterable[String],
                         vpColumns: ViewPortColumns, firstInChain: Boolean): Iterable[String] = {
    decorated.filterAll(rows, rowKeys, vpColumns, firstInChain) match {
      case ias: ImmutableArraySet[String] =>
        rowKeys.view.filterNot(f => ias.contains(f))
      case other =>
        val set = scala.collection.mutable.HashSet.from(other)
        rowKeys.view.filterNot(f => set.contains(f))
    }
  }

  override def validate(vpColumns: ViewPortColumns): Result[true] = decorated.validate(vpColumns)
}

case class OrClause(subclauses: Array[FilterClause]) extends FilterClause {

  override def filterAll(source: RowSource, primaryKeys: Iterable[String],
                         viewPortColumns: ViewPortColumns, firstInChain: Boolean): Iterable[String] = {
    if (subclauses.isEmpty || primaryKeys.isEmpty) {
      return ImmutableArraySet.empty
    }

    if (subclauses.length == 1) {
      return subclauses.head.filterAll(source, primaryKeys, viewPortColumns, firstInChain)
    }

    val builder = HashSet.newBuilder[String]
    if (primaryKeys.knownSize > 0) {
      builder.sizeHint(primaryKeys.knownSize)
    }

    var i = 0
    while (i < subclauses.length) {
      builder.addAll(subclauses(i).filterAll(source, primaryKeys, viewPortColumns, firstInChain))
      i += 1
    }

    ImmutableArraySet.from(builder.result())
  }

  override def validate(vpColumns: ViewPortColumns): Result[true] = joinResults(subclauses.map(_.validate(vpColumns)))
}

case class AndClause(subclauses: Array[FilterClause]) extends FilterClause {
  override def filterAll(source: RowSource, primaryKeys: Iterable[String],
                         viewPortColumns: ViewPortColumns, firstInChain: Boolean): Iterable[String] = {
    if (subclauses.isEmpty || primaryKeys.isEmpty) {
      return primaryKeys
    }

    if (subclauses.length == 1) {
      return subclauses.head.filterAll(source, primaryKeys, viewPortColumns, firstInChain)
    }

    var currentKeys = primaryKeys
    var i = 0
    var isFirst = firstInChain
    while (i < subclauses.length) {
      currentKeys = subclauses(i).filterAll(source, currentKeys, viewPortColumns, isFirst)
      isFirst = false
      i += 1
    }
    currentKeys
  }

  override def validate(vpColumns: ViewPortColumns): Result[true] = joinResults(subclauses.map(_.validate(vpColumns)))
}

case class StartsClause(columnName: String, prefix: String) extends RowFilterClause {
  override def applyFilter(data: Any): Boolean = {
    data match {
      case s: String => s.startsWith(prefix)
      case _ => false
    }
  }
}

case class EndsClause(columnName: String, suffix: String) extends RowFilterClause {
  override def applyFilter(data: Any): Boolean = {
    data match {
      case s: String => s.endsWith(suffix)
      case _ => false
    }
  }
}

case class ContainsClause(columnName: String, substring: String) extends RowFilterClause {
  override def applyFilter(data: Any): Boolean = {
    data match {
      case s: String => s.contains(substring)
      case _ => false
    }
  }
}

case class InClause(columnName: String, values: Set[String]) extends RowFilterClause {

  private lazy val intValues = values.map(s => s.toInt)
  private lazy val longValues = values.map(s => s.toLong)
  private lazy val doubleValues = values.map(s => s.toDouble)
  private lazy val booleanValues = values.map(s => s.equalsIgnoreCase("true"))
  private lazy val charValues = values.map(s => s.charAt(0))
  private lazy val epochTimestampValues = values.map(s => EpochTimestamp(s.toLong))
  private lazy val scaledDecimal2Values = values.map(s => ScaledDecimal2(s.toLong))
  private lazy val scaledDecimal4Values = values.map(s => ScaledDecimal4(s.toLong))
  private lazy val scaledDecimal6Values = values.map(s => ScaledDecimal6(s.toLong))
  private lazy val scaledDecimal8Values = values.map(s => ScaledDecimal8(s.toLong))

  override def applyFilter(data: Any): Boolean = {
    data match {
      case null => false
      case s: String => values.contains(s)
      case i: Int => intValues.contains(i)
      case l: Long => longValues.contains(l)
      case d: Double => doubleValues.contains(d)
      case b: Boolean => booleanValues.contains(b)
      case e: EpochTimestamp => epochTimestampValues.contains(e)
      case sd2: ScaledDecimal2 => scaledDecimal2Values.contains(sd2)
      case sd4: ScaledDecimal4 => scaledDecimal4Values.contains(sd4)
      case sd6: ScaledDecimal6 => scaledDecimal6Values.contains(sd6)
      case sd8: ScaledDecimal8 => scaledDecimal8Values.contains(sd8)
      case c: Char => charValues.contains(c)
    }
  }

  override def filterAll(rows: RowSource, rowKeys: Iterable[String],
                         viewPortColumns: ViewPortColumns, firstInChain: Boolean): Iterable[String] = {
    val column = rows.asTable.columnForName(columnName)
    rows.asTable.indexForColumn(column) match {
      case Some(ix: StringIndexedField)          => hitIndex(rowKeys, values, ix, firstInChain)
      case Some(ix: DoubleIndexedField)          => hitIndex(rowKeys, doubleValues, ix, firstInChain)
      case Some(ix: IntIndexedField)             => hitIndex(rowKeys, intValues, ix, firstInChain)
      case Some(ix: LongIndexedField)            => hitIndex(rowKeys, longValues, ix, firstInChain)
      case Some(ix: BooleanIndexedField)         => hitIndex(rowKeys, booleanValues, ix, firstInChain)
      case Some(ix: EpochTimestampIndexedField)  => hitIndex(rowKeys, epochTimestampValues, ix, firstInChain)
      case Some(ix: CharIndexedField)            => hitIndex(rowKeys, charValues, ix, firstInChain)
      case Some(ix: ScaledDecimal2IndexedField)  => hitIndex(rowKeys, scaledDecimal2Values, ix, firstInChain)
      case Some(ix: ScaledDecimal4IndexedField)  => hitIndex(rowKeys, scaledDecimal4Values, ix, firstInChain)
      case Some(ix: ScaledDecimal6IndexedField)  => hitIndex(rowKeys, scaledDecimal6Values, ix, firstInChain)
      case Some(ix: ScaledDecimal8IndexedField)  => hitIndex(rowKeys, scaledDecimal8Values, ix, firstInChain)
      case _                                     => super.filterAll(rows, rowKeys, viewPortColumns, firstInChain)
    }
  }

  private def hitIndex[T](rowKeys: Iterable[String], values: Set[T],
                          index: IndexedField[T], firstInChain: Boolean): Iterable[String] = {
    hitIndex(rowKeys, values, f => index.find(f), firstInChain)
  }

}

case class EqualsClause(columnName: String, value: String) extends RowFilterClause {

  private lazy val intValue = value.toInt
  private lazy val longValue = value.toLong
  private lazy val doubleValue = value.toDouble
  private lazy val booleanValue = value.equalsIgnoreCase("true")
  private lazy val charValue = value.charAt(0)
  private lazy val epochTimestampValue = EpochTimestamp(value.toLong)
  private lazy val scaledDecimal2Value = ScaledDecimal2(value.toLong)
  private lazy val scaledDecimal4Value = ScaledDecimal4(value.toLong)
  private lazy val scaledDecimal6Value = ScaledDecimal6(value.toLong)
  private lazy val scaledDecimal8Value = ScaledDecimal8(value.toLong)

  override def applyFilter(data: Any): Boolean = {
    data match {
      case null => false
      case s: String => s == value
      case i: Int => i == intValue
      case l: Long => l == longValue
      case d: Double => d == doubleValue
      case b: Boolean => b == booleanValue
      case e: EpochTimestamp => e.millis == longValue
      case sd: ScaledDecimal => sd.scaledValue == longValue
      case c: Char => c == charValue
    }
  }

  override def filterAll(rows: RowSource, rowKeys: Iterable[String],
                         viewPortColumns: ViewPortColumns, firstInChain: Boolean): Iterable[String] = {
    val column = rows.asTable.columnForName(columnName)
    rows.asTable.indexForColumn(column) match {
      case Some(ix: StringIndexedField)          => hitIndex(rowKeys, value, ix, firstInChain)
      case Some(ix: DoubleIndexedField)          => hitIndex(rowKeys, doubleValue, ix, firstInChain)
      case Some(ix: IntIndexedField)             => hitIndex(rowKeys, intValue, ix, firstInChain)
      case Some(ix: LongIndexedField)            => hitIndex(rowKeys, longValue, ix, firstInChain)
      case Some(ix: BooleanIndexedField)         => hitIndex(rowKeys, booleanValue, ix, firstInChain)
      case Some(ix: EpochTimestampIndexedField)  => hitIndex(rowKeys, epochTimestampValue, ix, firstInChain)
      case Some(ix: CharIndexedField)            => hitIndex(rowKeys, charValue, ix, firstInChain)
      case Some(ix: ScaledDecimal2IndexedField)  => hitIndex(rowKeys, scaledDecimal2Value, ix, firstInChain)
      case Some(ix: ScaledDecimal4IndexedField)  => hitIndex(rowKeys, scaledDecimal4Value, ix, firstInChain)
      case Some(ix: ScaledDecimal6IndexedField)  => hitIndex(rowKeys, scaledDecimal6Value, ix, firstInChain)
      case Some(ix: ScaledDecimal8IndexedField)  => hitIndex(rowKeys, scaledDecimal8Value, ix, firstInChain)
      case _                                     => super.filterAll(rows, rowKeys, viewPortColumns, firstInChain)
    }
  }

  private def hitIndex[T](rowKeys: Iterable[String], value: T,
                          index: IndexedField[T], firstInChain: Boolean): Iterable[String] = {
    hitIndex(rowKeys, value, f => index.find(f), firstInChain)
  }

}

case class GreaterThanClause(override val columnName: String,
                             override val value: String) extends NumericComparisonClause(columnName, value) {
  override protected def compareDouble(filterVal: Double, datum: Double): Boolean = filterVal < datum
  override protected def compareLong(filterVal: Long, datum: Long): Boolean      = filterVal < datum
  override protected def compareInt(filterVal: Int, datum: Int): Boolean         = filterVal < datum
  override protected def indexOp[T](idx: IndexedField[T], v: T): ImmutableArraySet[String] = idx.greaterThan(v)
}

case class GreaterThanOrEqualsClause(override val columnName: String,
                                     override val value: String) extends NumericComparisonClause(columnName, value) {
  override protected def compareDouble(filterVal: Double, datum: Double): Boolean = filterVal <= datum
  override protected def compareLong(filterVal: Long, datum: Long): Boolean      = filterVal <= datum
  override protected def compareInt(filterVal: Int, datum: Int): Boolean         = filterVal <= datum
  override protected def indexOp[T](idx: IndexedField[T], v: T): ImmutableArraySet[String] = idx.greaterThanOrEqual(v)
}

case class LessThanClause(override val columnName: String,
                          override val value: String) extends NumericComparisonClause(columnName, value) {
  override protected def compareDouble(filterVal: Double, datum: Double): Boolean = filterVal > datum
  override protected def compareLong(filterVal: Long, datum: Long): Boolean      = filterVal > datum
  override protected def compareInt(filterVal: Int, datum: Int): Boolean         = filterVal > datum
  override protected def indexOp[T](idx: IndexedField[T], v: T): ImmutableArraySet[String] = idx.lessThan(v)
}

case class LessThanOrEqualsClause(override val columnName: String,
                                  override val value: String) extends NumericComparisonClause(columnName, value) {
  override protected def compareDouble(filterVal: Double, datum: Double): Boolean = filterVal >= datum
  override protected def compareLong(filterVal: Long, datum: Long): Boolean      = filterVal >= datum
  override protected def compareInt(filterVal: Int, datum: Int): Boolean         = filterVal >= datum
  override protected def indexOp[T](idx: IndexedField[T], v: T): ImmutableArraySet[String] = idx.lessThanOrEqual(v)
}

private abstract class NumericComparisonClause(val columnName: String, val value: String) extends RowFilterClause {

  private lazy val intValue: Int = value.toInt
  private lazy val longValue: Long = value.toLong
  private lazy val doubleValue: Double = value.toDouble
  private lazy val epochTimestampValue = EpochTimestamp(value.toLong)
  private lazy val scaledDecimal2Value = ScaledDecimal2(value.toLong)
  private lazy val scaledDecimal4Value = ScaledDecimal4(value.toLong)
  private lazy val scaledDecimal6Value = ScaledDecimal6(value.toLong)
  private lazy val scaledDecimal8Value = ScaledDecimal8(value.toLong)

  protected def compareDouble(filterVal: Double, datum: Double): Boolean
  protected def compareLong(filterVal: Long, datum: Long): Boolean
  protected def compareInt(filterVal: Int, datum: Int): Boolean
  protected def indexOp[T](index: IndexedField[T], value: T): ImmutableArraySet[String]

  override def applyFilter(datum: Any): Boolean = datum match {
    case null => false
    case d: Double         => compareDouble(doubleValue, d)
    case i: Int            => compareInt(intValue, i)
    case l: Long           => compareLong(longValue, l)
    case e: EpochTimestamp => compareLong(longValue, e.millis)
    case sd: ScaledDecimal => compareLong(longValue, sd.scaledValue)
    case _                 => false
  }

  override def filterAll(rows: RowSource, rowKeys: Iterable[String],
                         viewPortColumns: ViewPortColumns, firstInChain: Boolean): Iterable[String] = {
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

  private def hitIndex[T](rowKeys: Iterable[String], v: T,
                          index: IndexedField[T], firstInChain: Boolean): Iterable[String] = {
    hitIndex(rowKeys, v, _ => indexOp(index, v), firstInChain)
  }
}
