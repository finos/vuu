package io.venuu.vuu.core.filter

import io.venuu.toolbox.collection.array.ImmutableArray
import io.venuu.vuu.core.index._
import io.venuu.vuu.core.table.{DataType, RowData}
import io.venuu.vuu.grammer.FilterParser
import io.venuu.vuu.viewport.RowSource

trait FilterClause {

  def stripQuotes(value: String) = {
    if(value.startsWith("\"") && value.endsWith("\"")){
      value.drop(1).dropRight(1)
    }else{
      value
    }
  }

  def filter(data: RowData): Boolean

  def filterAll(source: RowSource, primaryKeys: ImmutableArray[String]): ImmutableArray[String] = {

    val columns = source.asTable.getTableDef.columns.toList

    val pks = primaryKeys.toArray

    val filtered = pks.filter(key => {
      this.filter(source.pullRow(key, columns))
    })

    ImmutableArray.from(filtered)
  }
}

trait DataAndTypeClause extends FilterClause {

  def toType(s: String, dt: Int): Any = {
    dt match {
      case FilterParser.INT => s.toInt
      case FilterParser.FLOAT => s.toDouble
      case FilterParser.FALSE => false
      case FilterParser.TRUE => true
      case FilterParser.STRING => stripQuotes(s)
      case FilterParser.ID => s
    }
  }
}


case class OrClause(and: FilterClause, ors: List[FilterClause]) extends FilterClause {

  override def filterAll(source: RowSource, primaryKeys: ImmutableArray[String]): ImmutableArray[String] = {
    (and.filterAll(source, primaryKeys) ++ filterAllByOrs(source, primaryKeys)).distinct
  }

  def filterAllByOrs(source: RowSource, primaryKeys: ImmutableArray[String]): ImmutableArray[String] = {
    val resultOrs = ors.map(or => or.filterAll(source, primaryKeys)).foldLeft(ImmutableArray.empty[String])((left, right) => left.++(right))
    (resultOrs).distinct
  }

  def filterByOrs(data: RowData): Boolean = {
    ors.find(fc => fc.filter(data)) match {
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
    val successTerms = for (term <- terms if term.filter(data)) yield term
    successTerms.size == terms.size
  }
}

case class TermClause(column: String, dataAndTypeClause: DataAndTypeClause) extends FilterClause {
  override def filterAll(source: RowSource, primaryKeys: ImmutableArray[String]): ImmutableArray[String] = {
    dataAndTypeClause.filterAll(source, primaryKeys)
  }

  override def filter(data: RowData): Boolean = dataAndTypeClause.filter(data)
}

case class EqualsClause(column: String, dataType: Int, value: String) extends DataAndTypeClause {

  val toType: Any = toType(value, dataType)



  override def filterAll(source: RowSource, primaryKeys: ImmutableArray[String]): ImmutableArray[String] = {
    val asColumn = source.asTable.columnForName(column)
    source.asTable.indexForColumn(asColumn) match {
      case Some(ix: StringIndexedField) if asColumn.dataType == DataType.StringDataType =>
          ix.find(stripQuotes(value))
      case Some(ix: IntIndexedField) if asColumn.dataType == DataType.IntegerDataType =>
        ix.find(value.toInt)
      case Some(ix: LongIndexedField) if asColumn.dataType == DataType.LongDataType =>
        ix.find(value.toLong)
      case Some(ix: DoubleIndexedField) if asColumn.dataType == DataType.DoubleDataType =>
        ix.find(value.toDouble)
      case Some(ix: BooleanIndexedField) if asColumn.dataType == DataType.BooleanDataType =>
        ix.find(value.toBoolean)
      case Some(ix: IndexedField[_]) =>
        EqualsClause.super.filterAll(source, primaryKeys)
      case _ =>
        EqualsClause.super.filterAll(source, primaryKeys)
    }
  }

  override def filter(data: RowData): Boolean = {
    val datum = data.get(column)
    if (datum != null && datum == toType) true
    else false
  }
}

case class NotEqualsClause(column: String, dataType: Int, value: String) extends DataAndTypeClause {

  val toType: Any = toType(value, dataType)

  override def filter(data: RowData): Boolean = {
    val datum = data.get(column)

    if (datum == null || datum != toType) true
    else false
  }
}

case class GreaterThanClause(column: String, dataType: Int, value: String) extends DataAndTypeClause {
  val asDouble = value.toDouble

  override def filterAll(source: RowSource, primaryKeys: ImmutableArray[String]): ImmutableArray[String] = {
    val asColumn = source.asTable.columnForName(column)
    source.asTable.indexForColumn(asColumn) match {
      case Some(ix: StringIndexedField) if asColumn.dataType == DataType.StringDataType =>
        GreaterThanClause.super.filterAll(source, primaryKeys)
      case Some(ix: IntIndexedField) if asColumn.dataType == DataType.IntegerDataType =>
        ix.greaterThan(value.toInt)
      case Some(ix: LongIndexedField) if asColumn.dataType == DataType.LongDataType =>
        ix.greaterThan(value.toLong)
      case Some(ix: DoubleIndexedField) if asColumn.dataType == DataType.DoubleDataType =>
        ix.greaterThan(value.toDouble)
      case Some(ix: BooleanIndexedField) if asColumn.dataType == DataType.BooleanDataType =>
        ix.greaterThan(value.toBoolean)
      case _ =>
        GreaterThanClause.super.filterAll(source, primaryKeys)
    }
  }

  override def filter(data: RowData): Boolean = {
    val datum = data.get(column)

    if (datum == null)
      false
    else
      asDouble < datum.toString.toDouble
  }
}

case class StartsClause(column: String, dataType: Int, value: String) extends DataAndTypeClause {

  override def filter(data: RowData): Boolean = {
    val datum = data.get(column)

    if (datum == null)
      false
    else
      datum.toString.startsWith(value)
  }
}

case class EndsClause(column: String, dataType: Int, value: String) extends DataAndTypeClause {

  override def filter(data: RowData): Boolean = {
    val datum = data.get(column)

    if (datum == null)
      false
    else
      datum.toString.endsWith(value)
  }
}

case class LessThanClause(column: String, dataType: Int, value: String) extends DataAndTypeClause {

  val asDouble = value.toDouble

  override def filterAll(source: RowSource, primaryKeys: ImmutableArray[String]): ImmutableArray[String] = {
    val asColumn = source.asTable.columnForName(column)
    source.asTable.indexForColumn(asColumn) match {
      case Some(ix: StringIndexedField) if asColumn.dataType == DataType.StringDataType =>
        LessThanClause.super.filterAll(source, primaryKeys)
      case Some(ix: IntIndexedField) if asColumn.dataType == DataType.IntegerDataType =>
        ix.lessThan(value.toInt)
      case Some(ix: LongIndexedField) if asColumn.dataType == DataType.LongDataType =>
        ix.lessThan(value.toInt)
      case Some(ix: BooleanIndexedField) if asColumn.dataType == DataType.BooleanDataType =>
        ix.lessThan(value.toBoolean)
      case Some(ix: DoubleIndexedField) if asColumn.dataType == DataType.DoubleDataType =>
        ix.lessThan(value.toDouble)
      case _ =>
        LessThanClause.super.filterAll(source, primaryKeys)
    }
  }

  override def filter(data: RowData): Boolean = {
    val datum = data.get(column)

    if (datum == null)
      false
    else
      asDouble > datum.toString.toDouble
  }
}

case class InClause(column: String, dataType: Int, values: List[String]) extends DataAndTypeClause {

  override def filterAll(source: RowSource, primaryKeys: ImmutableArray[String]): ImmutableArray[String] = {
    val asColumn = source.asTable.columnForName(column)
    source.asTable.indexForColumn(asColumn) match {
      case Some(ix: StringIndexedField) if asColumn.dataType == DataType.StringDataType =>
        ix.find(values)
      case Some(ix: IntIndexedField) if asColumn.dataType == DataType.IntegerDataType =>
        ix.find(values.map(s => s.toInt))
      case Some(ix: LongIndexedField) if asColumn.dataType == DataType.LongDataType =>
        ix.find(values.map(s => s.toLong))
      case Some(ix: DoubleIndexedField) if asColumn.dataType == DataType.DoubleDataType =>
        ix.find(values.map(s => s.toDouble))
      case Some(ix: BooleanIndexedField) if asColumn.dataType == DataType.BooleanDataType =>
        ix.find(values.map(s => s.toBoolean))
      case _ =>
        InClause.super.filterAll(source, primaryKeys)
    }
  }

  override def filter(data: RowData): Boolean = {
    val datum = data.get(column)
    if (datum == null)
      false
    else
      values.contains(datum.toString)
  }
}
