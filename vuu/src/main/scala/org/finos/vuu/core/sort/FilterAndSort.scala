package org.finos.vuu.core.sort

import com.typesafe.scalalogging.StrictLogging
import org.finos.toolbox.collection.array.ImmutableArray
import org.finos.vuu.core.auths.RowPermissionChecker
import org.finos.vuu.core.filter.{Filter, FilterClause}
import org.finos.vuu.core.index.*
import org.finos.vuu.core.table.column.{Error, Success}
import org.finos.vuu.core.table.datatype.EpochTimestamp
import org.finos.vuu.core.table.{Column, DataType, DefaultColumnNames, EmptyTablePrimaryKeys, TablePrimaryKeys, ViewPortColumnCreator}
import org.finos.vuu.feature.inmem.InMemTablePrimaryKeys
import org.finos.vuu.viewport.{RowSource, ViewPortColumns, ViewPortVisualLink}

case class VisualLinkedFilter(viewPortVisualLink: ViewPortVisualLink) extends Filter with StrictLogging {

  private def doFilterByIndexIfPossible(parentSelectionKeys: Set[String], parentColumn: Column,
                                        childColumn: Column, source: RowSource, primaryKeys: TablePrimaryKeys): TablePrimaryKeys = {

    if (parentSelectionKeys.isEmpty) {
      primaryKeys
    } else {
      source.asTable.indexForColumn(childColumn) match {
        case Some(index: StringIndexedField) if childColumn.dataType == DataType.StringDataType =>
          val parentSelField = parentSelectionKeys.map(key => viewPortVisualLink.parentVp.table.pullRow(key).get(parentColumn).asInstanceOf[String]).toList
          filterIndexByValues[String](index, parentSelField)
        case Some(index: IntIndexedField) if childColumn.dataType == DataType.IntegerDataType =>
          val parentSelField = parentSelectionKeys.map(key => viewPortVisualLink.parentVp.table.pullRow(key).get(parentColumn).asInstanceOf[Int]).toList
          filterIndexByValues(index, parentSelField)
        case Some(index: LongIndexedField) if childColumn.dataType == DataType.LongDataType =>
          val parentSelField = parentSelectionKeys.map(key => viewPortVisualLink.parentVp.table.pullRow(key).get(parentColumn).asInstanceOf[Long]).toList
          filterIndexByValues(index, parentSelField)
        case Some(index: DoubleIndexedField) if childColumn.dataType == DataType.DoubleDataType =>
          val parentSelField = parentSelectionKeys.map(key => viewPortVisualLink.parentVp.table.pullRow(key).get(parentColumn).asInstanceOf[Double]).toList
          filterIndexByValues(index, parentSelField)
        case Some(index: BooleanIndexedField) if childColumn.dataType == DataType.BooleanDataType =>
          val parentSelField = parentSelectionKeys.map(key => viewPortVisualLink.parentVp.table.pullRow(key).get(parentColumn).asInstanceOf[Boolean]).toList
          filterIndexByValues(index, parentSelField)
        case Some(index: EpochTimestampIndexedField) if childColumn.dataType == DataType.EpochTimestampType =>
          val parentSelField = parentSelectionKeys.map(key => viewPortVisualLink.parentVp.table.pullRow(key).get(parentColumn).asInstanceOf[EpochTimestamp]).toList
          filterIndexByValues(index, parentSelField)
        case _ =>
          val parentDataValues = parentSelectionKeys.map(key => viewPortVisualLink.parentVp.table.pullRow(key).get(parentColumn) -> 0).toList
          doFilterByBruteForce(parentDataValues, childColumn, source, primaryKeys)
      }
    }
  }

  private def filterIndexByValues[TYPE](index: IndexedField[TYPE], parentSelected: List[TYPE]): TablePrimaryKeys = {
    InMemTablePrimaryKeys(index.find(parentSelected))
  }

  private def doFilterByBruteForce(parentDataValues: List[Any], childColumn: Column, source: RowSource, primaryKeys: TablePrimaryKeys): TablePrimaryKeys = {
    val pks = primaryKeys.toArray
    val childColumns = ViewPortColumnCreator.create(source.asTable, List(childColumn.name))

    val filtered = pks.filter(key => {
      val childField = source.pullRow(key, childColumns).get(childColumn)
      parentDataValues.contains(childField)
    })

    InMemTablePrimaryKeys(ImmutableArray.from(filtered))
  }

  override def doFilter(source: RowSource, primaryKeys: TablePrimaryKeys, vpColumns: ViewPortColumns): TablePrimaryKeys = {

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
  override def doFilter(source: RowSource, primaryKeys: TablePrimaryKeys, vpColumns: ViewPortColumns): TablePrimaryKeys = {
    val filtered = primaryKeys.filter(key => {
      try {
        // calling source.pullRow(key) rather than source.pullRow(key, vpColumns) because user might remove the columns we need from view port
        checker.canSeeRow(source.pullRow(key))
      } catch {
        case e: Exception =>
          logger.error(s"Error while checking row permission for keys $primaryKeys with checker $checker", e)
          false
      }
    }).toArray

    InMemTablePrimaryKeys(ImmutableArray.from[String](filtered))
  }
}

case class FrozenTimeFilter(frozenTime: Long) extends Filter with StrictLogging {
  override def doFilter(source: RowSource, primaryKeys: TablePrimaryKeys, vpColumns: ViewPortColumns): TablePrimaryKeys = {
    val filtered = primaryKeys.filter(key => {
      try {
        val vuuCreatedTimestamp = source.pullRow(key).get(DefaultColumnNames.CreatedTimeColumnName).asInstanceOf[Long]
        vuuCreatedTimestamp < frozenTime
      } catch {
        case e: Exception =>
          logger.error(s"Error while checking frozen time for keys $primaryKeys with frozen time $frozenTime", e)
          false
      }
    }).toArray

    InMemTablePrimaryKeys(ImmutableArray.from[String](filtered))
  }
}

case class RowPermissionAndFrozenTimeFilter(checker: RowPermissionChecker, frozenTime: Long) extends Filter with StrictLogging {
  override def doFilter(source: RowSource, primaryKeys: TablePrimaryKeys, vpColumns: ViewPortColumns): TablePrimaryKeys = {
    val filtered = primaryKeys.filter(key => {
      try {
        val rowData = source.pullRow(key)
        rowData.get(DefaultColumnNames.CreatedTimeColumnName).asInstanceOf[Long] < frozenTime && checker.canSeeRow(rowData)
      } catch {
        case e: Exception =>
          logger.error(s"Error while checking row permission and view port frozen time for keys $primaryKeys with checker $checker and frozen time $frozenTime", e)
          false
      }
    }).toArray

    InMemTablePrimaryKeys(ImmutableArray.from[String](filtered))
  }
}

case class TwoStepCompoundFilter(first: Filter, second: Filter) extends Filter with StrictLogging {
  override def doFilter(source: RowSource, primaryKeys: TablePrimaryKeys, vpColumns: ViewPortColumns): TablePrimaryKeys = {

    val firstStep = first.doFilter(source, primaryKeys, vpColumns)

    val secondStep = second.doFilter(source, firstStep, vpColumns)

    secondStep
  }
}

case class AntlrBasedFilter(clause: FilterClause) extends Filter with StrictLogging {

  override def doFilter(source: RowSource, primaryKeys: TablePrimaryKeys, vpColumns: ViewPortColumns): TablePrimaryKeys = {
    logger.debug(s"starting filter with ${primaryKeys.length}")
    clause.filterAllSafe(source, primaryKeys, vpColumns) match {
      case Success(filteredKeys) =>
        logger.debug(s"complete filter with ${filteredKeys.length}")
        filteredKeys
      case Error(msg) =>
        logger.error(s"Unexpected error occurred while filtering (skipping filters): \n$msg")
        primaryKeys
    }
  }
}


trait FilterAndSort {
  def filterAndSort(source: RowSource, primaryKeys: TablePrimaryKeys, vpColumns: ViewPortColumns, permission: Option[RowPermissionChecker], viewPortFrozenTime: Option[Long]): TablePrimaryKeys

  def filter: Filter

  def sort: Sort
}

case class UserDefinedFilterAndSort(filter: Filter, sort: Sort) extends FilterAndSort with StrictLogging {

  override def filterAndSort(source: RowSource, primaryKeys: TablePrimaryKeys, vpColumns: ViewPortColumns, checkerOption: Option[RowPermissionChecker], viewPortFrozenTime: Option[Long]): TablePrimaryKeys = {
    if (primaryKeys == null || primaryKeys.length == 0) {
      // nothing to filter or sort
      return primaryKeys
    }

    try {
      val realizedFilter = createDefaultFilter(checkerOption, viewPortFrozenTime) match {
        case Some(defaultFilter) => TwoStepCompoundFilter(defaultFilter, filter)
        case None => filter
      }

      val filteredKeys = realizedFilter.doFilter(source, primaryKeys, vpColumns)

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

  private def createDefaultFilter(checkerOption: Option[RowPermissionChecker], viewPortFrozenTime: Option[Long]): Option[Filter] = {
    checkerOption match {
      case Some(checker) =>
        viewPortFrozenTime match {
          case Some(frozenTime) =>
            Some(RowPermissionAndFrozenTimeFilter(checker, frozenTime))
          case None =>
            Some(RowPermissionFilter(checker))
        }
      case None =>
        viewPortFrozenTime match {
          case Some(t) =>
            Some(FrozenTimeFilter(t))
          case None =>
            None
        }
    }
  }

}


