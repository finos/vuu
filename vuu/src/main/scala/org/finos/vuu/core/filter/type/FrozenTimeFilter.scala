package org.finos.vuu.core.filter.`type`

import com.typesafe.scalalogging.LazyLogging
import org.finos.toolbox.collection.array.{ImmutableArray, VectorImmutableArray}
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
    if (column == null) {
      EmptyTablePrimaryKeys
    } else {
      source.asTable.indexForColumn(column) match {
        case Some(index: EpochTimestampIndexedField) =>
          hitIndex(primaryKeys, index, firstInChain)
        case _ =>
          filterAll(source, primaryKeys)
      }
    }
  }

  private def hitIndex(primaryKeys: TablePrimaryKeys, indexedField: EpochTimestampIndexedField, firstInChain: Boolean): TablePrimaryKeys = {
    val results = indexedField.lessThan(frozenTime)
    if (results.isEmpty) {
      EmptyTablePrimaryKeys
    } else if (firstInChain) {
      InMemTablePrimaryKeys(results.toImmutableArray)
    } else {
      val keyLength = primaryKeys.length
      val builder = Vector.newBuilder[String]
      builder.sizeHint(Math.min(keyLength, results.length))

      var i = 0
      while (i < keyLength) {
        val key = primaryKeys.get(i)
        if (results.contains(key)) {
          builder += key
        }
        i += 1
      }

      InMemTablePrimaryKeys(VectorImmutableArray.from(builder.result()))
    }
  }

  private def filterAll(source: RowSource, rowKeys: TablePrimaryKeys): TablePrimaryKeys = {
    val filtered = rowKeys.filter(key => {
      val vuuCreatedTimestamp = source.pullRow(key).get(DefaultColumn.CreatedTime.name)
      vuuCreatedTimestamp != null && vuuCreatedTimestamp.asInstanceOf[EpochTimestamp] < frozenTime
    })
    
    InMemTablePrimaryKeys(ImmutableArray.from[String](filtered))
  }
}
