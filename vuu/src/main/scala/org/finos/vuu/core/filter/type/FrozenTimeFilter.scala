package org.finos.vuu.core.filter.`type`

import com.typesafe.scalalogging.LazyLogging
import org.finos.toolbox.collection.array.ImmutableArray
import org.finos.vuu.core.filter.Filter
import org.finos.vuu.core.index.EpochTimestampIndexedField
import org.finos.vuu.core.table.datatype.EpochTimestamp
import org.finos.vuu.core.table.{DefaultColumn, EmptyTablePrimaryKeys, TablePrimaryKeys}
import org.finos.vuu.feature.inmem.InMemTablePrimaryKeys
import org.finos.vuu.viewport.RowSource

case class FrozenTimeFilter(frozenTime: EpochTimestamp) extends Filter with LazyLogging {

  override def doFilter(source: RowSource, primaryKeys: TablePrimaryKeys, firstInChain: Boolean): TablePrimaryKeys = {
    logger.trace(s"Starting filter with ${primaryKeys.length}")
    if (primaryKeys.isEmpty) return primaryKeys

    val column = source.asTable.columnForName(DefaultColumn.CreatedTime.name)
    if (column == null) return EmptyTablePrimaryKeys

    val results = source.asTable.indexForColumn(column) match {
      case Some(index: EpochTimestampIndexedField) =>
        hitIndex(primaryKeys, index, firstInChain)
      case _ =>
        filterAll(source, primaryKeys)
    }

    InMemTablePrimaryKeys(results)
  }

  private def hitIndex(primaryKeys: TablePrimaryKeys, indexedField: EpochTimestampIndexedField,
                       firstInChain: Boolean): ImmutableArray[String] = {
    val results = indexedField.lessThan(frozenTime)
    if (results.isEmpty || firstInChain) {
      results.toImmutableArray
    } else {
      ImmutableArray.from(primaryKeys.view.filter(results.contains))
    }
  }

  private def filterAll(source: RowSource, rowKeys: TablePrimaryKeys): ImmutableArray[String] = {
    val filtered = rowKeys.view.filter(key => {
      val vuuCreatedTimestamp = source.pullRow(key).get(DefaultColumn.CreatedTime.name)
      vuuCreatedTimestamp != null && vuuCreatedTimestamp.asInstanceOf[EpochTimestamp] < frozenTime
    })    
    ImmutableArray.from(filtered)
  }
}
