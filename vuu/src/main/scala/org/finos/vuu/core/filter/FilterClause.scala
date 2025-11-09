package org.finos.vuu.core.filter

import org.finos.toolbox.collection.array.ImmutableArray
import org.finos.vuu.core.filter.FilterClause.joinResults
import org.finos.vuu.core.index.*
import org.finos.vuu.core.table.column.{Error, Result}
import org.finos.vuu.core.table.{RowData, TablePrimaryKeys}
import org.finos.vuu.feature.inmem.InMemTablePrimaryKeys
import org.finos.vuu.viewport.{RowSource, ViewPortColumns}

sealed trait FilterClause {
  
  def filterAll(rows: RowSource, rowKeys: TablePrimaryKeys): Result[TablePrimaryKeys]
      
  def filterAllSafe(rows: RowSource, rowKeys: TablePrimaryKeys, vpColumns: ViewPortColumns): Result[TablePrimaryKeys] =
    this.validate(vpColumns).fold(errMsg => Error(errMsg), _ => Result(this.filterAll(rows, rowKeys, vpColumns)))

  def filterAll(rows: RowSource, rowKeys: TablePrimaryKeys, vpColumns: ViewPortColumns): TablePrimaryKeys
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

  override def filterAll(rows: RowSource, rowKeys: TablePrimaryKeys, vpColumns: ViewPortColumns): TablePrimaryKeys =
    InMemTablePrimaryKeys(ImmutableArray.from(
      rowKeys.filter(key => filter(rows.pullRow(key, vpColumns))).toArray
    ))

  override def validate(vpColumns: ViewPortColumns): Result[true] = columnExistsInVpColumns(vpColumns)

  private def columnExistsInVpColumns(vpColumns: ViewPortColumns): Result[true] =
    if (vpColumns.columnExists(this.columnName)) Result(true)
    else Error(s"Column `$columnName` not found.")

}

case class NotClause(decorated: FilterClause) extends FilterClause {
  override def filterAll(rows: RowSource, rowKeys: TablePrimaryKeys, vpColumns: ViewPortColumns): TablePrimaryKeys = {
    val matching = decorated.filterAll(rows, rowKeys, vpColumns).toSet
    val notMatching = rowKeys.filter(!matching.contains(_))
    InMemTablePrimaryKeys(ImmutableArray.from(notMatching.toArray))
  }

  override def validate(vpColumns: ViewPortColumns): Result[true] = decorated.validate(vpColumns)
}

case class OrClause(subclauses: List[FilterClause]) extends FilterClause {
  override def filterAll(rows: RowSource, primaryKeys: TablePrimaryKeys, vpColumns: ViewPortColumns): TablePrimaryKeys = InMemTablePrimaryKeys( ImmutableArray.from(
    subclauses.flatMap(_.filterAll(rows, primaryKeys, vpColumns)).distinct.toArray
  ))

  override def validate(vpColumns: ViewPortColumns): Result[true] = joinResults(subclauses.map(_.validate(vpColumns)))
}

case class AndClause(subclauses: List[FilterClause]) extends FilterClause {
  override def filterAll(source: RowSource, primaryKeys: TablePrimaryKeys, viewPortColumns: ViewPortColumns): TablePrimaryKeys =
    subclauses.foldLeft(primaryKeys) {
      (remainingKeys, subclause) => subclause.filterAll(source, remainingKeys, viewPortColumns)
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

  override def filterAll(rows: RowSource, rowKeys: TablePrimaryKeys, viewPortColumns: ViewPortColumns): TablePrimaryKeys = {
    val column = rows.asTable.columnForName(columnName)
    rows.asTable.indexForColumn(column) match {
      case Some(ix: StringIndexedField)  => rowKeys.intersect(ix.find(values))
      case Some(ix: IntIndexedField)     => rowKeys.intersect(ix.find(values.map(s => s.toInt)))
      case Some(ix: LongIndexedField)    => rowKeys.intersect(ix.find(values.map(s => s.toLong)))
      case Some(ix: DoubleIndexedField)  => rowKeys.intersect(ix.find(values.map(s => s.toDouble)))
      case Some(ix: BooleanIndexedField) => rowKeys.intersect(ix.find(values.map(s => s.toBoolean)))
      case _                          => super.filterAll(rows, rowKeys, viewPortColumns)
    }
  }
}

case class GreaterThanClause(columnName: String, value: Double) extends RowFilterClause {
  override def applyFilter(datum: Any): Boolean = {
    if (datum == null) return false

    // the calling code in TreeBuilderImpl.applyFilter() returns all rows on exception
    try { value < datum.toString.toDouble } catch { case _: NumberFormatException  => true}
  }

  override def filterAll(rows: RowSource, rowKeys: TablePrimaryKeys, viewPortColumns: ViewPortColumns): TablePrimaryKeys = {
    val column = rows.asTable.columnForName(columnName)
    rows.asTable.indexForColumn(column) match {
      case Some(ix: DoubleIndexedField) => rowKeys.intersect(ix.greaterThan(value))
      case Some(ix: IntIndexedField) => rowKeys.intersect(ix.greaterThan(value.toInt))
      case Some(ix: LongIndexedField) => rowKeys.intersect(ix.greaterThan(value.toLong))
      case _ => super.filterAll(rows, rowKeys, viewPortColumns)
    }
  }
}

case class LessThanClause(columnName: String, value: Double) extends RowFilterClause {
  override def applyFilter(datum: Any): Boolean = {
    if (datum == null) return false

    // the calling code in TreeBuilderImpl.applyFilter() returns all rows on exception
    try { value > datum.toString.toDouble } catch { case _: NumberFormatException  => false}
  }

  override def filterAll(rows: RowSource, rowKeys: TablePrimaryKeys, viewPortColumns: ViewPortColumns): TablePrimaryKeys = {
    val column = rows.asTable.columnForName(columnName)
    rows.asTable.indexForColumn(column) match {
      case Some(ix: DoubleIndexedField) => rowKeys.intersect(ix.lessThan(value))
      case Some(ix: IntIndexedField)    => rowKeys.intersect(ix.lessThan(value.toInt))
      case Some(ix: LongIndexedField)   => rowKeys.intersect(ix.lessThan(value.toInt))
      case _                         => super.filterAll(rows, rowKeys, viewPortColumns)
    }
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
    }
  }

  override def filterAll(rows: RowSource, rowKeys: TablePrimaryKeys, viewPortColumns: ViewPortColumns): TablePrimaryKeys = {
    val column = rows.asTable.columnForName(columnName)
    rows.asTable.indexForColumn(column) match {
      case Some(ix: StringIndexedField)   => rowKeys.intersect(ix.find(value))
      case Some(ix: IntIndexedField)      => rowKeys.intersect(ix.find(value.toInt))
      case Some(ix: LongIndexedField)     => rowKeys.intersect(ix.find(value.toLong))
      case Some(ix: DoubleIndexedField)   => rowKeys.intersect(ix.find(value.toDouble))
      case Some(ix: BooleanIndexedField)  => rowKeys.intersect(ix.find(value.toBoolean))
      case _                           => super.filterAll(rows, rowKeys, viewPortColumns)
    }
  }
}


