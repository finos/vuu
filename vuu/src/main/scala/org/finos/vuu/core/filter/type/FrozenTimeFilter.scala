package org.finos.vuu.core.filter.`type`

import com.typesafe.scalalogging.StrictLogging
import org.finos.toolbox.collection.array.ImmutableArray
import org.finos.vuu.core.filter.Filter
import org.finos.vuu.core.index.LongIndexedField
import org.finos.vuu.core.table.{DefaultColumnNames, EmptyTablePrimaryKeys, TablePrimaryKeys}
import org.finos.vuu.feature.inmem.InMemTablePrimaryKeys
import org.finos.vuu.viewport.RowSource

case class FrozenTimeFilter(frozenTime: Long) extends Filter with StrictLogging {

  override def doFilter(source: RowSource, primaryKeys: TablePrimaryKeys, firstInChain: Boolean): TablePrimaryKeys = {
    logger.trace(s"Starting filter with ${primaryKeys.length}")

    val column = source.asTable.columnForName(DefaultColumnNames.CreatedTimeColumnName)
    if (column == null || primaryKeys.isEmpty) {
      EmptyTablePrimaryKeys
    } else {
      source.asTable.indexForColumn(column) match {
        case Some(index: LongIndexedField) =>
          hitIndex(primaryKeys, index, firstInChain)
        case _ =>
          filterAll(source, primaryKeys)
      }
    }
  }

  private def hitIndex(primaryKeys: TablePrimaryKeys, indexedField: LongIndexedField, firstInChain: Boolean): TablePrimaryKeys = {
    val results = indexedField.lessThan(frozenTime)
    if (results.isEmpty) {
      EmptyTablePrimaryKeys
    } else if (firstInChain) {
      InMemTablePrimaryKeys(results)
    } else {
      primaryKeys.intersect(results)
    }
  }

  private def filterAll(source: RowSource, rowKeys: TablePrimaryKeys): TablePrimaryKeys = {
    val filtered = rowKeys.filter(key => {
      val vuuCreatedTimestamp = source.pullRow(key).get(DefaultColumnNames.CreatedTimeColumnName)
      vuuCreatedTimestamp != null && vuuCreatedTimestamp.asInstanceOf[Long] < frozenTime
    })
    
    InMemTablePrimaryKeys(ImmutableArray.from[String](filtered.toArray))
  }
}
