package org.finos.vuu.core.filter.`type`

import com.typesafe.scalalogging.LazyLogging
import org.finos.toolbox.collection.array.ImmutableArray
import org.finos.vuu.core.filter.ViewPortFilter
import org.finos.vuu.core.index.{BooleanIndexedField, DoubleIndexedField, EpochTimestampIndexedField, IndexedField, IntIndexedField, LongIndexedField, ScaledDecimal2IndexedField, ScaledDecimal4IndexedField, ScaledDecimal6IndexedField, ScaledDecimal8IndexedField, StringIndexedField}
import org.finos.vuu.core.table.datatype.{EpochTimestamp, ScaledDecimal2, ScaledDecimal4, ScaledDecimal6, ScaledDecimal8}
import org.finos.vuu.core.table.{Column, DataType, EmptyTablePrimaryKeys, TablePrimaryKeys, ViewPortColumnCreator}
import org.finos.vuu.feature.inmem.InMemTablePrimaryKeys
import org.finos.vuu.viewport.{RowSource, ViewPortColumns, ViewPortVisualLink}

case class VisualLinkedFilter(viewPortVisualLink: ViewPortVisualLink) extends ViewPortFilter with LazyLogging {

  override def doFilter(source: RowSource, primaryKeys: TablePrimaryKeys, vpColumns: ViewPortColumns, firstInChain: Boolean): TablePrimaryKeys = {

    val parentSelectionKeys = viewPortVisualLink.parentVp.getSelection
    val parentColumn = viewPortVisualLink.parentColumn
    val childColumn = viewPortVisualLink.childColumn

    try {
      doFilterByIndexIfPossible(parentSelectionKeys, parentColumn, childColumn, source, primaryKeys)
    } catch {
      case e: Exception =>
        logger.error(s"Error while filtering by visual link $viewPortVisualLink", e)
        EmptyTablePrimaryKeys
    }
  }

  private def doFilterByIndexIfPossible(parentSelectionKeys: Set[String], parentColumn: Column,
                                        childColumn: Column, source: RowSource, primaryKeys: TablePrimaryKeys): TablePrimaryKeys = {

    if (parentSelectionKeys.isEmpty) {
      primaryKeys
    } else {
      source.asTable.indexForColumn(childColumn) match {
        case Some(index: StringIndexedField) if childColumn.dataType == DataType.StringDataType =>
          val parentSelField = parentSelectionKeys.map(key => viewPortVisualLink.parentVp.table.pullRow(key).get(parentColumn).asInstanceOf[String])
          filterIndexByValues[String](index, parentSelField)
        case Some(index: IntIndexedField) if childColumn.dataType == DataType.IntegerDataType =>
          val parentSelField = parentSelectionKeys.map(key => viewPortVisualLink.parentVp.table.pullRow(key).get(parentColumn).asInstanceOf[Int])
          filterIndexByValues(index, parentSelField)
        case Some(index: LongIndexedField) if childColumn.dataType == DataType.LongDataType =>
          val parentSelField = parentSelectionKeys.map(key => viewPortVisualLink.parentVp.table.pullRow(key).get(parentColumn).asInstanceOf[Long])
          filterIndexByValues(index, parentSelField)
        case Some(index: DoubleIndexedField) if childColumn.dataType == DataType.DoubleDataType =>
          val parentSelField = parentSelectionKeys.map(key => viewPortVisualLink.parentVp.table.pullRow(key).get(parentColumn).asInstanceOf[Double])
          filterIndexByValues(index, parentSelField)
        case Some(index: BooleanIndexedField) if childColumn.dataType == DataType.BooleanDataType =>
          val parentSelField = parentSelectionKeys.map(key => viewPortVisualLink.parentVp.table.pullRow(key).get(parentColumn).asInstanceOf[Boolean])
          filterIndexByValues(index, parentSelField)
        case Some(index: EpochTimestampIndexedField) if childColumn.dataType == DataType.EpochTimestampType =>
          val parentSelField = parentSelectionKeys.map(key => viewPortVisualLink.parentVp.table.pullRow(key).get(parentColumn).asInstanceOf[EpochTimestamp])
          filterIndexByValues(index, parentSelField)
        case Some(index: ScaledDecimal2IndexedField) if childColumn.dataType == DataType.ScaledDecimal2Type =>
          val parentSelField = parentSelectionKeys.map(key => viewPortVisualLink.parentVp.table.pullRow(key).get(parentColumn).asInstanceOf[ScaledDecimal2])
          filterIndexByValues(index, parentSelField)
        case Some(index: ScaledDecimal4IndexedField) if childColumn.dataType == DataType.ScaledDecimal4Type =>
          val parentSelField = parentSelectionKeys.map(key => viewPortVisualLink.parentVp.table.pullRow(key).get(parentColumn).asInstanceOf[ScaledDecimal4])
          filterIndexByValues(index, parentSelField)
        case Some(index: ScaledDecimal6IndexedField) if childColumn.dataType == DataType.ScaledDecimal6Type =>
          val parentSelField = parentSelectionKeys.map(key => viewPortVisualLink.parentVp.table.pullRow(key).get(parentColumn).asInstanceOf[ScaledDecimal6])
          filterIndexByValues(index, parentSelField)
        case Some(index: ScaledDecimal8IndexedField) if childColumn.dataType == DataType.ScaledDecimal8Type =>
          val parentSelField = parentSelectionKeys.map(key => viewPortVisualLink.parentVp.table.pullRow(key).get(parentColumn).asInstanceOf[ScaledDecimal8])
          filterIndexByValues(index, parentSelField)
        case _ =>
          val parentDataValues: Set[Any] = parentSelectionKeys.map(key => viewPortVisualLink.parentVp.table.pullRow(key).get(parentColumn))
          doFilterByBruteForce(parentDataValues, childColumn, source, primaryKeys)
      }
    }
  }

  private def filterIndexByValues[TYPE](index: IndexedField[TYPE], parentSelected: Set[TYPE]): TablePrimaryKeys = {
    InMemTablePrimaryKeys(index.find(parentSelected).toImmutableArray)
  }

  private def doFilterByBruteForce(parentDataValues: Set[Any], childColumn: Column, source: RowSource, primaryKeys: TablePrimaryKeys): TablePrimaryKeys = {
    val childColumns = ViewPortColumnCreator.create(source.asTable, List(childColumn.name))
    val filtered = primaryKeys.filter(key => {
      val childField = source.pullRow(key, childColumns).get(childColumn)
      parentDataValues.contains(childField)
    })

    InMemTablePrimaryKeys(ImmutableArray.from(filtered))
  }

}

