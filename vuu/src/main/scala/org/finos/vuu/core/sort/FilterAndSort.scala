package org.finos.vuu.core.sort

import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.core.filter.{Filter, FilterClause, NoFilter}
import org.finos.vuu.core.index._
import org.finos.vuu.core.table.{Column, DataType, EmptyTablePrimaryKeys, TablePrimaryKeys, ViewPortColumnCreator}
import org.finos.vuu.viewport.{RowSource, ViewPortColumns, ViewPortVisualLink}
import org.finos.toolbox.collection.array.ImmutableArray
import org.finos.vuu.core.auths.RowPermissionChecker
import org.finos.vuu.core.table.column.{Error, Success}
import org.finos.vuu.feature.inmem.InMemTablePrimaryKeys

case class VisualLinkedFilter(viewPortVisualLink: ViewPortVisualLink) extends Filter with StrictLogging {

  private def doFilterByIndexIfPossible(parentSelectionKeys: Map[String, Int], parentColumn: Column,
                                        childColumn: Column, source: RowSource, primaryKeys: TablePrimaryKeys): TablePrimaryKeys = {

    if (parentSelectionKeys.isEmpty) {
      primaryKeys
    } else {
      source.asTable.indexForColumn(childColumn) match {
        case Some(index: StringIndexedField) if childColumn.dataType == DataType.StringDataType =>
          val parentSelField = parentSelectionKeys.map(key => viewPortVisualLink.parentVp.table.pullRow(key._1).get(parentColumn).asInstanceOf[String]).toList
          filterIndexByValues[String](index, parentSelField)
        case Some(index: IntIndexedField) if childColumn.dataType == DataType.IntegerDataType =>
          val parentSelField = parentSelectionKeys.map(key => viewPortVisualLink.parentVp.table.pullRow(key._1).get(parentColumn).asInstanceOf[Int]).toList
          filterIndexByValues(index, parentSelField)
        case Some(index: LongIndexedField) if childColumn.dataType == DataType.LongDataType =>
          val parentSelField = parentSelectionKeys.map(key => viewPortVisualLink.parentVp.table.pullRow(key._1).get(parentColumn).asInstanceOf[Long]).toList
          filterIndexByValues(index, parentSelField)
        case Some(index: DoubleIndexedField) if childColumn.dataType == DataType.DoubleDataType =>
          val parentSelField = parentSelectionKeys.map(key => viewPortVisualLink.parentVp.table.pullRow(key._1).get(parentColumn).asInstanceOf[Double]).toList
          filterIndexByValues(index, parentSelField)
        case Some(index: BooleanIndexedField) if childColumn.dataType == DataType.BooleanDataType =>
          val parentSelField = parentSelectionKeys.map(key => viewPortVisualLink.parentVp.table.pullRow(key._1).get(parentColumn).asInstanceOf[Boolean]).toList
          filterIndexByValues(index, parentSelField)
        case _ =>
          val parentDataValues = parentSelectionKeys.map(key => viewPortVisualLink.parentVp.table.pullRow(key._1).get(parentColumn) -> 0)
          doFilterByBruteForce(parentDataValues, childColumn, source, primaryKeys)
      }
    }
  }

  def filterIndexByValues[TYPE](index: IndexedField[TYPE], parentSelected: List[TYPE]): TablePrimaryKeys = {
    InMemTablePrimaryKeys(index.find(parentSelected))
  }


  private def doFilterByBruteForce(parentDataValues: Map[Any, Int], childColumn: Column, source: RowSource, primaryKeys: TablePrimaryKeys): TablePrimaryKeys = {
    val pks = primaryKeys.toArray
    val childColumns = ViewPortColumnCreator.create(source.asTable, List(childColumn.name))

    val filtered = pks.filter(key => {
      val childField = source.pullRow(key, childColumns).get(childColumn)
      parentDataValues.contains(childField)
    })

    InMemTablePrimaryKeys(ImmutableArray.from(filtered))
  }

  override def dofilter(source: RowSource, primaryKeys: TablePrimaryKeys, vpColumns: ViewPortColumns): TablePrimaryKeys = {

    val parentSelectionKeys = viewPortVisualLink.parentVp.getSelection
    val parentColumn = viewPortVisualLink.parentColumn
    val childColumn = viewPortVisualLink.childColumn

    try {
      doFilterByIndexIfPossible(parentSelectionKeys, parentColumn, childColumn, source, primaryKeys)
    } catch {
      case e: Exception =>
        logger.error(s"Error while filtering by visual link $viewPortVisualLink", e)
        InMemTablePrimaryKeys(ImmutableArray.empty[String])
    }
  }
}

case class RowPermissionFilter(checker: RowPermissionChecker) extends Filter with StrictLogging {
  override def dofilter(source: RowSource, primaryKeys: TablePrimaryKeys, vpColumns: ViewPortColumns): TablePrimaryKeys = {
    val filtered = primaryKeys.filter(key => {
      try {
      checker.canSeeRow(source.pullRow(key, vpColumns))
      } catch {
        case e: Exception =>
          logger.error(s"Error while checking row permission for keys $primaryKeys with checker $checker", e)
          false
      }
    }).toArray

    InMemTablePrimaryKeys(ImmutableArray.from[String](filtered))
  }
}

case class TwoStepCompoundFilter(first: Filter, second: Filter) extends Filter with StrictLogging {
  override def dofilter(source: RowSource, primaryKeys: TablePrimaryKeys, vpColumns: ViewPortColumns): TablePrimaryKeys = {

    val firstStep = first.dofilter(source, primaryKeys, vpColumns)

    val secondStep = second.dofilter(source, firstStep, vpColumns)

    secondStep
  }
}

case class AntlrBasedFilter(clause: FilterClause) extends Filter with StrictLogging {

  override def dofilter(source: RowSource, primaryKeys: TablePrimaryKeys, vpColumns: ViewPortColumns): TablePrimaryKeys = {
    logger.debug(s"starting filter with ${primaryKeys.length}")
    clause.filterAllSafe(source, primaryKeys, vpColumns) match {
      case Success(filteredKeys) =>
        logger.debug(s"complete filter with ${filteredKeys.length}")
        filteredKeys
      case Error(msg) =>
        logger.error(s"Unexpected error occurred while filtering (skipping filters): \n$msg")
        EmptyTablePrimaryKeys
    }
  }
}


trait FilterAndSort {
  def filterAndSort(source: RowSource, primaryKeys: TablePrimaryKeys, vpColumns: ViewPortColumns, permission: Option[RowPermissionChecker]): TablePrimaryKeys

  def filter: Filter

  def sort: Sort
}

case class UserDefinedFilterAndSort(filter: Filter, sort: Sort) extends FilterAndSort with StrictLogging {

  override def filterAndSort(source: RowSource, primaryKeys: TablePrimaryKeys, vpColumns: ViewPortColumns, checkerOption: Option[RowPermissionChecker]): TablePrimaryKeys = {
    if(primaryKeys == null || primaryKeys.length == 0) {
      // nothing to filter or sort
      return primaryKeys
    }

    try {
      val realizedFilter = checkerOption match {
        case Some(checker) => TwoStepCompoundFilter(RowPermissionFilter(checker), filter)
        case None => filter
      }

      val filteredKeys = realizedFilter.dofilter(source, primaryKeys, vpColumns)

      val sortedKeys = sort.doSort(source, filteredKeys, vpColumns)
      logger.trace("sorted")
      sortedKeys
    } catch {
      case e: Throwable =>
        logger.error("Error during filtering and sorting", e)
        //debugData(source, primaryKeys)
        EmptyTablePrimaryKeys
    }
  }

}


