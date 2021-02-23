package io.venuu.vuu.core.filter

import io.venuu.toolbox.ImmutableArray
import io.venuu.vuu.core.index.IndexedField
import io.venuu.vuu.core.table.{DataType, RowData}
import io.venuu.vuu.grammer.FilterParser
import io.venuu.vuu.viewport.RowSource

trait FilterClause{
  def filter(data: RowData): Boolean
  def filterAll(source: RowSource, primaryKeys: ImmutableArray[String]): ImmutableArray[String] = {

    val columns = source.asTable.getTableDef.columns.toList

    val pks = primaryKeys.toArray

    val filtered = pks.filter( key => {
      this.filter(source.pullRow(key, columns))
    })

    ImmutableArray.from(filtered)
  }
}
trait DataAndTypeClause extends FilterClause{

  def toType(s: String, dt: Int): Any = {
    dt match {
      case FilterParser.INT => s.toInt
      case FilterParser.FLOAT => s.toDouble
      case FilterParser.FALSE => false
      case FilterParser.TRUE => true
      case FilterParser.STRING => s
      case FilterParser.ID => s
    }
  }
}


case class OrClause(and: FilterClause, ors: List[FilterClause]) extends FilterClause{

  override def filterAll(source: RowSource, primaryKeys: ImmutableArray[String]): ImmutableArray[String] = {
    (and.filterAll(source, primaryKeys) ++ filterAllByOrs(source, primaryKeys)).distinct
  }

  def filterAllByOrs(source: RowSource, primaryKeys: ImmutableArray[String]): ImmutableArray[String] = {
    val resultOrs = ors.map( or => or.filterAll(source, primaryKeys) ).foldLeft(ImmutableArray.empty[String])((left, right) => left.++(right) )
    (resultOrs).distinct
  }

  def filterByOrs(data: RowData): Boolean = {
    ors.find( fc => fc.filter(data) ) match {
      case Some(fc) => true
      case None => false
    }
  }

  override def filter(data: RowData): Boolean = {
    and.filter(data) || filterByOrs(data)
  }
}

case class AndClause(terms: List[FilterClause]) extends FilterClause {

  override def filterAll(source: RowSource, primaryKeys: ImmutableArray[String]): ImmutableArray[String] = {
    terms.foldLeft(primaryKeys)((prePks, term) => term.filterAll(source, prePks))
  }

  override def filter(data: RowData): Boolean = {
    val successTerms = for(term <- terms if term.filter(data) ) yield term
    successTerms.size == terms.size
  }
}

case class TermClause(column: String, dataAndTypeClause: DataAndTypeClause) extends FilterClause{
  override def filterAll(source: RowSource, primaryKeys: ImmutableArray[String]): ImmutableArray[String] = {
    dataAndTypeClause.filterAll(source, primaryKeys)
  }

  override def filter(data: RowData): Boolean = dataAndTypeClause.filter(data)
}

case class EqualsClause(column: String, dataType: Int, value: String) extends DataAndTypeClause{

  val toType: Any = toType(value, dataType)

  override def filterAll(source: RowSource, primaryKeys: ImmutableArray[String]): ImmutableArray[String] = {
    val asColumn = source.asTable.columnForName(column)
    source.asTable.indexForColumn(asColumn) match {
      case Some(ix: IndexedField[String]) if asColumn.dataType == DataType.StringDataType =>
        ix.find(value)
      case Some(ix: IndexedField[Int]) if asColumn.dataType == DataType.IntegerDataType =>
        ix.find(value.toInt)
      case Some(ix: IndexedField[Long]) if asColumn.dataType == DataType.LongDataType =>
        ix.find(value.toLong)
      case None =>
        EqualsClause.super.filterAll(source, primaryKeys)
    }
  }

  override def filter(data: RowData): Boolean = {
    val datum = data.get(column)
    if( datum != null && datum.equals(toType)) true
    else false
  }
}

case class NotEqualsClause(column: String, dataType: Int, value: String)  extends DataAndTypeClause{

  val toType: Any = toType(value, dataType)

  override def filter(data: RowData): Boolean = {
    val datum = data.get(column)

    if( datum == null || !datum.equals(toType)) true
    else false
  }
}

case class GreaterThanClause(column: String, dataType: Int, value: String)  extends DataAndTypeClause{
  val asDouble = value.toDouble

  override def filterAll(source: RowSource, primaryKeys: ImmutableArray[String]): ImmutableArray[String] = {
    val asColumn = source.asTable.columnForName(column)
    source.asTable.indexForColumn(asColumn) match {
      case Some(ix: IndexedField[String]) if asColumn.dataType == DataType.StringDataType =>
        GreaterThanClause.super.filterAll(source, primaryKeys)
      case Some(ix: IndexedField[Int]) if asColumn.dataType == DataType.IntegerDataType =>
        ix.greaterThan(value.toInt)
      case Some(ix: IndexedField[Long]) if asColumn.dataType == DataType.LongDataType =>
        GreaterThanClause.super.filterAll(source, primaryKeys)
      case None =>
        GreaterThanClause.super.filterAll(source, primaryKeys)
    }
  }

  override def filter(data: RowData): Boolean = {
    val datum = data.get(column)

    if(datum == null)
      false
    else
      asDouble < datum.toString.toDouble
  }
}

case class StartsClause(column: String, dataType: Int, value: String)  extends DataAndTypeClause{

  override def filter(data: RowData): Boolean = {
    val datum = data.get(column)

    if(datum == null)
      false
    else
      datum.toString.startsWith(value)
  }
}

case class EndsClause(column: String, dataType: Int, value: String)  extends DataAndTypeClause{

  override def filter(data: RowData): Boolean = {
    val datum = data.get(column)

    if(datum == null)
      false
    else
      datum.toString.endsWith(value)
  }
}

case class LessThanClause(column: String, dataType: Int, value: String)  extends DataAndTypeClause{

  val asDouble = value.toDouble

  override def filterAll(source: RowSource, primaryKeys: ImmutableArray[String]): ImmutableArray[String] = {
    val asColumn = source.asTable.columnForName(column)
    source.asTable.indexForColumn(asColumn) match {
      case Some(ix: IndexedField[String]) if asColumn.dataType == DataType.StringDataType =>
        LessThanClause.super.filterAll(source, primaryKeys)
      case Some(ix: IndexedField[Int]) if asColumn.dataType == DataType.IntegerDataType =>
        ix.lessThan(value.toInt)
      case Some(ix: IndexedField[Long]) if asColumn.dataType == DataType.LongDataType =>
        LessThanClause.super.filterAll(source, primaryKeys)
      case None =>
        LessThanClause.super.filterAll(source, primaryKeys)
    }
  }

  override def filter(data: RowData): Boolean = {
    val datum = data.get(column)

    if(datum == null)
      false
    else
      asDouble > data.toString.toDouble
  }
}

case class InClause(column: String, dataType: Int, values: List[String])  extends DataAndTypeClause{

  override def filterAll(source: RowSource, primaryKeys: ImmutableArray[String]): ImmutableArray[String] = {
    val asColumn = source.asTable.columnForName(column)
    source.asTable.indexForColumn(asColumn) match {
      case Some(ix: IndexedField[String]) if asColumn.dataType == DataType.StringDataType =>
        ix.find(values)
      case Some(ix: IndexedField[Int]) if asColumn.dataType == DataType.IntegerDataType =>
        ix.find(values.map(s => s.toInt))
      case Some(ix: IndexedField[Long]) if asColumn.dataType == DataType.LongDataType =>
        ix.find(values.map(s => s.toLong))
      case None =>
        InClause.super.filterAll(source, primaryKeys)
    }
  }

  override def filter(data: RowData): Boolean = {
    val datum = data.get(column)
    if(datum == null)
      false
    else
      values.contains(datum.toString)
  }
}
