package org.finos.vuu.core.sort

import com.typesafe.scalalogging.StrictLogging
import org.finos.toolbox.collection.array.ImmutableArray
import org.finos.vuu.core.auths.RowPermissionChecker
import org.finos.vuu.core.filter.{AndClause, CompoundFilter, Filter, FilterClause, FilterOutEverythingFilter, FilterSpecParser, NoFilter}
import org.finos.vuu.core.index.*
import org.finos.vuu.core.table.column.{Error, Success}
import org.finos.vuu.core.table.{Column, DataType, DefaultColumnNames, EmptyTablePrimaryKeys, TablePrimaryKeys, ViewPortColumnCreator}
import org.finos.vuu.feature.inmem.InMemTablePrimaryKeys
import org.finos.vuu.net.FilterSpec
import org.finos.vuu.viewport.{RowSource, ViewPortColumns, ViewPortVisualLink}

import scala.collection.immutable.{AbstractSeq, LinearSeq}
import scala.util.{Try, Success, Failure}

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
        false
        // calling source.pullRow(key) rather than source.pullRow(key, vpColumns) because user might remove the columns we need from view port
        //checker.canSeeRow(source.pullRow(key))
      } catch {
        case e: Exception =>
          logger.error(s"Error while checking row permission for keys $primaryKeys with checker $checker", e)
          false
      }
    }).toArray

    InMemTablePrimaryKeys(ImmutableArray.from[String](filtered))
  }
}

case class AntlrBasedFilter(clause: FilterClause) extends Filter with StrictLogging {

  override def doFilter(source: RowSource, primaryKeys: TablePrimaryKeys, vpColumns: ViewPortColumns): TablePrimaryKeys = {
    logger.trace(s"starting filter with ${primaryKeys.length}")
    clause.filterAllSafe(source, primaryKeys, vpColumns) match {
      case scala.util.Success(filteredKeys) =>
        logger.trace(s"complete filter with ${filteredKeys.length}")
        filteredKeys
      case Error(msg) =>
        logger.error(s"Unexpected error occurred while filtering (skipping filters): \n$msg")
        primaryKeys
    }
  }

  def combine(other: AntlrBasedFilter): AntlrBasedFilter = {
    val combinedClause = AndClause(List(clause, other.clause))
    AntlrBasedFilter(combinedClause)
  }
  
}

trait FilterAndSort {
  def filterAndSort(source: RowSource, primaryKeys: TablePrimaryKeys, vpColumns: ViewPortColumns, 
                    permission: Option[RowPermissionChecker], viewPortFrozenTime: Option[Long]): TablePrimaryKeys

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
        case Some(defaultFilter) => CompoundFilter(defaultFilter, filter)
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
    val frozenTimeFilter = viewPortFrozenTime match {
      case Some(value) => Option.apply(createFrozenTimeFilter(value))
      case None => Option.empty
    }
    val rowPermissionFilter = checkerOption match {
      case Some(value) => Option.apply(createRowPermissionFilter(value))
      case None => Option.empty
    }
    
    if (frozenTimeFilter.nonEmpty && rowPermissionFilter.nonEmpty) {
      
      
    } else if (frozenTimeFilter.nonEmpty) {
      frozenTimeFilter
    } else if (rowPermissionFilter.nonEmpty) {
      rowPermissionFilter
    } else {
      Option.empty
    }
  }

  private def createFrozenTimeFilter(frozenTime: Long): Filter = {
    val frozenTimeSpec = FilterSpec(s"${DefaultColumnNames.CreatedTimeColumnName} < $frozenTime")
    Try(FilterSpecParser.parse(frozenTimeSpec.filter)) match {
      case scala.util.Success(clause) =>
        AntlrBasedFilter(clause)
      case scala.util.Failure(err) =>
        logger.error(s"Could not create frozen time filter from ${frozenTimeSpec.filter}", err)
        FilterOutEverythingFilter
    }    
  }

  private def createRowPermissionFilter(checker: RowPermissionChecker): Filter = {    
    Try(FilterSpecParser.parse(checker.filterSpec.filter)) match {
      case scala.util.Success(clause) =>
        AntlrBasedFilter(clause)
      case scala.util.Failure(err) =>
        logger.error(s"Could not create row permission filter from ${checker.filterSpec.filter}", err)
        FilterOutEverythingFilter
    }
  }
  
}


