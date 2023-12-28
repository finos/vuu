package org.finos.vuu.core.filter

import org.finos.toolbox.collection.array.ImmutableArray
import org.finos.vuu.core.index._
import org.finos.vuu.core.table.{RowData, TablePrimaryKeys}
import org.finos.vuu.feature.inmem.InMemTablePrimaryKeys
import org.finos.vuu.viewport.{RowSource, ViewPortColumns}

trait FilterClause {
  def filterAll(rows: RowSource, rowKeys: TablePrimaryKeys, vpColumns: ViewPortColumns): TablePrimaryKeys
}

trait RowFilterClause extends FilterClause {
  def filter(row: RowData): Boolean
  def filterAll(rows: RowSource, rowKeys: TablePrimaryKeys, vpColumns: ViewPortColumns): TablePrimaryKeys =
    InMemTablePrimaryKeys( ImmutableArray.from(
    rowKeys
      .filter(key => filter(rows.pullRow(key, vpColumns)))
      .toArray
  ))
}

case class NotClause(decorated: FilterClause) extends FilterClause {
  override def filterAll(rows: RowSource, rowKeys: TablePrimaryKeys, vpColumns: ViewPortColumns): TablePrimaryKeys = {
    val matching = decorated.filterAll(rows, rowKeys, vpColumns).toSet
    val notMatching = rowKeys.filter(!matching.contains(_))
    InMemTablePrimaryKeys(ImmutableArray.from(notMatching.toArray))
  }
}

case class OrClause(subclauses: List[FilterClause]) extends FilterClause {
  override def filterAll(rows: RowSource, primaryKeys: TablePrimaryKeys, vpColumns: ViewPortColumns): TablePrimaryKeys = InMemTablePrimaryKeys( ImmutableArray.from(
    subclauses.flatMap(_.filterAll(rows, primaryKeys, vpColumns)).distinct.toArray
  ))
}

case class AndClause(subclauses: List[FilterClause]) extends FilterClause {
  override def filterAll(source: RowSource, primaryKeys: TablePrimaryKeys, viewPortColumns: ViewPortColumns): TablePrimaryKeys =
    subclauses.foldLeft(primaryKeys) {
      (remainingKeys, subclause) => subclause.filterAll(source, remainingKeys, viewPortColumns)
    }
}

case class StartsClause(columnName: String, prefix: String) extends RowFilterClause {
  override def filter(row: RowData): Boolean = {
    val datum = row.get(columnName)
    if (datum == null) return false
    datum.toString.startsWith(prefix)
  }
}

case class EndsClause(columnName: String, suffix: String) extends RowFilterClause {
  override def filter(row: RowData): Boolean = {
    val datum = row.get(columnName)
    if (datum == null) return false
    datum.toString.endsWith(suffix)
  }
}

case class InClause(columnName: String, values: List[String]) extends RowFilterClause {
  override def filter(row: RowData): Boolean = {
    val datum = row.get(columnName)
    if (datum == null) return false

    values.contains(datum.toString)
  }

  override def filterAll(rows: RowSource, rowKeys: TablePrimaryKeys, viewPortColumns: ViewPortColumns): TablePrimaryKeys = {
    val column = rows.asTable.columnForName(columnName)
    rows.asTable.indexForColumn(column) match {
      case Some(ix: StringIndexedField)  => InMemTablePrimaryKeys( ix.find(values) )
      case Some(ix: IntIndexedField)     => InMemTablePrimaryKeys( ix.find(values.map(s => s.toInt)))
      case Some(ix: LongIndexedField)    => InMemTablePrimaryKeys( ix.find(values.map(s => s.toLong)))
      case Some(ix: DoubleIndexedField)  => InMemTablePrimaryKeys( ix.find(values.map(s => s.toDouble)))
      case Some(ix: BooleanIndexedField) => InMemTablePrimaryKeys( ix.find(values.map(s => s.toBoolean)))
      case None                          => super.filterAll(rows, rowKeys, viewPortColumns)
    }
  }
}

case class GreaterThanClause(columnName: String, value: Double) extends RowFilterClause {
  override def filter(row: RowData): Boolean = {
    val datum = row.get(columnName)
    if (datum == null) return false

    // the calling code in TreeBuilderImpl.applyFilter() returns all rows on exception
    try { value < datum.toString.toDouble } catch { case _: NumberFormatException  => true}
  }

  override def filterAll(rows: RowSource, rowKeys: TablePrimaryKeys, viewPortColumns: ViewPortColumns): TablePrimaryKeys = {
    val column = rows.asTable.columnForName(columnName)
    rows.asTable.indexForColumn(column) match {
      case Some(ix: DoubleIndexedField) => InMemTablePrimaryKeys(ix.greaterThan(value))
      case Some(ix: IntIndexedField) => InMemTablePrimaryKeys(ix.greaterThan(value.toInt))
      case Some(ix: LongIndexedField) => InMemTablePrimaryKeys(ix.greaterThan(value.toLong))
      case None => super.filterAll(rows, rowKeys, viewPortColumns)
    }
  }
}

case class LessThanClause(columnName: String, value: Double) extends RowFilterClause {
  override def filter(row: RowData): Boolean = {
    val datum = row.get(columnName)
    if (datum == null) return false

    // the calling code in TreeBuilderImpl.applyFilter() returns all rows on exception
    try { value > datum.toString.toDouble } catch { case _: NumberFormatException  => false}
  }

  override def filterAll(rows: RowSource, rowKeys: TablePrimaryKeys, viewPortColumns: ViewPortColumns): TablePrimaryKeys = {
    val column = rows.asTable.columnForName(columnName)
    rows.asTable.indexForColumn(column) match {
      case Some(ix: DoubleIndexedField) => InMemTablePrimaryKeys(ix.lessThan(value))
      case Some(ix: IntIndexedField)    => InMemTablePrimaryKeys(ix.lessThan(value.toInt))
      case Some(ix: LongIndexedField)   => InMemTablePrimaryKeys(ix.lessThan(value.toInt))
      case None                         => super.filterAll(rows, rowKeys, viewPortColumns)
    }
  }
}


case class EqualsClause(columnName: String, value: String) extends RowFilterClause {
  override def filter(row: RowData): Boolean = {
    row.get(columnName) match {
      case null => false
      case s: String => s == value
      case i: Int => i == value.toInt
      case f: Float => f == value.toFloat
      case d: Double => d == value.toDouble
      case b: Boolean => b == value.equalsIgnoreCase("true")
    }
  }

  override def filterAll(rows: RowSource, rowKeys: TablePrimaryKeys, viewPortColumns: ViewPortColumns): TablePrimaryKeys = {
    val column = rows.asTable.columnForName(columnName)
    rows.asTable.indexForColumn(column) match {
      case Some(ix: StringIndexedField)   => InMemTablePrimaryKeys(ix.find(value))
      case Some(ix: IntIndexedField)      => InMemTablePrimaryKeys(ix.find(value.toInt))
      case Some(ix: LongIndexedField)     => InMemTablePrimaryKeys(ix.find(value.toLong))
      case Some(ix: DoubleIndexedField)   => InMemTablePrimaryKeys(ix.find(value.toDouble))
      case Some(ix: BooleanIndexedField)  => InMemTablePrimaryKeys(ix.find(value.toBoolean))
      case None => super.filterAll(rows, rowKeys, viewPortColumns)
    }
  }
}
