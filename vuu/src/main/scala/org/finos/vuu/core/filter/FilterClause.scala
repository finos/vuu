package org.finos.vuu.core.filter

import org.finos.toolbox.collection.array.ImmutableArray
import org.finos.vuu.core.index._
import org.finos.vuu.core.table.RowData
import org.finos.vuu.viewport.{RowSource, ViewPortColumns}

trait FilterClause {
  def filterAll(rows: RowSource, rowKeys: ImmutableArray[String], vpColumns: ViewPortColumns): ImmutableArray[String]
}

trait RowFilterClause extends FilterClause {
  def filter(row: RowData): Boolean
  def filterAll(rows: RowSource, rowKeys: ImmutableArray[String], vpColumns: ViewPortColumns): ImmutableArray[String] = ImmutableArray.from(
    rowKeys
      .filter(key => filter(rows.pullRow(key, vpColumns)))
      .toArray
  )
}

case class NotClause(decorated: FilterClause) extends FilterClause {
  override def filterAll(rows: RowSource, rowKeys: ImmutableArray[String], vpColumns: ViewPortColumns): ImmutableArray[String] = {
    val matching = decorated.filterAll(rows, rowKeys, vpColumns).toSet
    val notMatching = rowKeys.filter(!matching.contains(_))
    ImmutableArray.from(notMatching.toArray)
  }
}

case class OrClause(subclauses: List[FilterClause]) extends FilterClause {
  override def filterAll(rows: RowSource, primaryKeys: ImmutableArray[String], vpColumns: ViewPortColumns): ImmutableArray[String] = ImmutableArray.from(
    subclauses.flatMap(_.filterAll(rows, primaryKeys, vpColumns)).distinct.toArray
  )
}

case class AndClause(subclauses: List[FilterClause]) extends FilterClause {
  override def filterAll(source: RowSource, primaryKeys: ImmutableArray[String], viewPortColumns: ViewPortColumns): ImmutableArray[String] =
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

case class InClause(columnName: String, values: List[String]) extends FilterClause {
  override def filterAll(rows: RowSource, rowKeys: ImmutableArray[String], viewPortColumns: ViewPortColumns): ImmutableArray[String] = {
    val column = rows.asTable.columnForName(columnName)
    rows.asTable.indexForColumn(column) match {
      case Some(ix: StringIndexedField)  => ix.find(values)
      case Some(ix: IntIndexedField)     => ix.find(values.map(s => s.toInt))
      case Some(ix: LongIndexedField)    => ix.find(values.map(s => s.toLong))
      case Some(ix: DoubleIndexedField)  => ix.find(values.map(s => s.toDouble))
      case Some(ix: BooleanIndexedField) => ix.find(values.map(s => s.toBoolean))
      case None                          => super.filterAll(rows, rowKeys, viewPortColumns)
    }
  }
}

case class GreaterThanClause(columnName: String, value: Double) extends FilterClause {
  override def filterAll(rows: RowSource, rowKeys: ImmutableArray[String], viewPortColumns: ViewPortColumns): ImmutableArray[String] = {
    val column = rows.asTable.columnForName(columnName)
    rows.asTable.indexForColumn(column) match {
      case Some(ix: DoubleIndexedField) => ix.greaterThan(value)
      case Some(ix: IntIndexedField)    => ix.greaterThan(value.toInt)
      case Some(ix: LongIndexedField)   => ix.greaterThan(value.toLong)
    }
  }
}

case class LessThanClause(columnName: String, value: Double) extends FilterClause {
  override def filterAll(rows: RowSource, rowKeys: ImmutableArray[String], viewPortColumns: ViewPortColumns): ImmutableArray[String] = {
    val column = rows.asTable.columnForName(columnName)
    rows.asTable.indexForColumn(column) match {
      case Some(ix: DoubleIndexedField) => ix.lessThan(value)
      case Some(ix: IntIndexedField)    => ix.lessThan(value.toInt)
      case Some(ix: LongIndexedField)   => ix.lessThan(value.toInt)
      case None => super.filterAll(rows, rowKeys, viewPortColumns)
    }
  }
}


case class EqualsClause(columnName: String, value: String) extends FilterClause {
  override def filterAll(rows: RowSource, rowKeys: ImmutableArray[String], viewPortColumns: ViewPortColumns): ImmutableArray[String] = {
    val column = rows.asTable.columnForName(columnName)
    rows.asTable.indexForColumn(column) match {
      case Some(ix: StringIndexedField)   => ix.find(value)
      case Some(ix: IntIndexedField)      => ix.find(value.toInt)
      case Some(ix: LongIndexedField)     => ix.find(value.toLong)
      case Some(ix: DoubleIndexedField)   => ix.find(value.toDouble)
      case Some(ix: BooleanIndexedField)  => ix.find(value.toBoolean)
      case None => super.filterAll(rows, rowKeys, viewPortColumns)
    }
  }
}
