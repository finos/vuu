package org.finos.vuu.core.sort

import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.core.filter.{Filter, FilterClause, NoFilter}
import org.finos.vuu.core.index._
import org.finos.vuu.core.table.{Column, DataType, ViewPortColumnCreator}
import org.finos.vuu.viewport.{RowSource, ViewPortColumns, ViewPortVisualLink}
import org.finos.toolbox.collection.array.ImmutableArray
import org.finos.vuu.core.auths.RowPermissionChecker

case class VisualLinkedFilter(viewPortVisualLink: ViewPortVisualLink) extends Filter {

  private def doFilterByIndexIfPossible(parentSelectionKeys: Map[String, Int], parentColumn: Column,
                                        childColumn: Column, source: RowSource, primaryKeys: ImmutableArray[String]): ImmutableArray[String] = {

    if (parentSelectionKeys.isEmpty) {
      ImmutableArray.empty[String]
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

  def filterIndexByValues[TYPE](index: IndexedField[TYPE], parentSelected: List[TYPE]): ImmutableArray[String] = {
    index.find(parentSelected)
  }


  private def doFilterByBruteForce(parentDataValues: Map[Any, Int], childColumn: Column, source: RowSource, primaryKeys: ImmutableArray[String]): ImmutableArray[String] = {
    val pks = primaryKeys.toArray
    val childColumns = ViewPortColumnCreator.create(source.asTable, List(childColumn.name))

    val filtered = pks.filter(key => {
      val childField = source.pullRow(key, childColumns).get(childColumn)
      parentDataValues.contains(childField)
    })

    ImmutableArray.from(filtered)
  }

  override def dofilter(source: RowSource, primaryKeys: ImmutableArray[String], vpColumns: ViewPortColumns): ImmutableArray[String] = {

    val parentSelectionKeys = viewPortVisualLink.parentVp.getSelection
    val parentColumn = viewPortVisualLink.parentColumn
    val childColumn = viewPortVisualLink.childColumn

    val filtered = doFilterByIndexIfPossible(parentSelectionKeys, parentColumn, childColumn, source, primaryKeys)

    filtered
  }
}

case class RowPermissionFilter(checker: RowPermissionChecker) extends Filter {
  override def dofilter(source: RowSource, primaryKeys: ImmutableArray[String], vpColumns: ViewPortColumns): ImmutableArray[String] = {
    val filtered = primaryKeys.filter(key => {
      checker.canSeeRow(source.pullRow(key, vpColumns))
    }).toArray

    ImmutableArray.from[String](filtered)
  }
}

case class TwoStepCompoundFilter(first: Filter, second: Filter) extends Filter with StrictLogging {
  override def dofilter(source: RowSource, primaryKeys: ImmutableArray[String], vpColumns: ViewPortColumns): ImmutableArray[String] = {

    val firstStep = first.dofilter(source, primaryKeys, vpColumns)

    val secondStep = second.dofilter(source, firstStep, vpColumns)

    secondStep
  }
}

case class AntlrBasedFilter(clause: FilterClause) extends Filter with StrictLogging {

  override def dofilter(source: RowSource, primaryKeys: ImmutableArray[String], vpColumns: ViewPortColumns): ImmutableArray[String] = {

    val pks = primaryKeys.toArray

    logger.debug(s"starting filter with ${pks.length}")
    val filtered = clause.filterAll(source: RowSource, primaryKeys: ImmutableArray[String], vpColumns)
    logger.debug(s"complete filter with ${filtered.length}")
    filtered
  }
}


trait FilterAndSort {
  def filterAndSort(source: RowSource, primaryKeys: ImmutableArray[String], vpColumns:ViewPortColumns, permission: Option[RowPermissionChecker]): ImmutableArray[String]
  def filter: Filter
  def sort: Sort
}

case class UserDefinedFilterAndSort(filter: Filter, sort: Sort) extends FilterAndSort with StrictLogging {

  override def filterAndSort(source: RowSource, primaryKeys: ImmutableArray[String], vpColumns:ViewPortColumns, checkerOption: Option[RowPermissionChecker]): ImmutableArray[String] = {
        try {
      val realizedFilter = checkerOption match {
        case Some(checker) => TwoStepCompoundFilter(RowPermissionFilter(checker), filter)
        case None=> filter
      }

      val filteredKeys = realizedFilter.dofilter(source, primaryKeys, vpColumns)
      val sortedKeys = sort.doSort(source, filteredKeys, vpColumns)
      logger.debug("sorted")
      sortedKeys
    } catch {
      case e: Throwable =>
        logger.error("went bad", e)
        //debugData(source, primaryKeys)
        primaryKeys
    }
  }

}

class NoFilterNoSort() extends FilterAndSort {

  override def filterAndSort(source: RowSource, primaryKeys: ImmutableArray[String], viewPortColumns: ViewPortColumns, checkerOption: Option[RowPermissionChecker]): ImmutableArray[String] = {
    primaryKeys
  }
  override def filter: Filter = NoFilter
  override def sort: Sort = NoSort
}


