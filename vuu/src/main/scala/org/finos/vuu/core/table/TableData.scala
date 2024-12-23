package org.finos.vuu.core.table

import org.finos.toolbox.collection.array.ImmutableArray

trait TableData {
  def dataByKey(key: String): RowData
  def update(key: String, update: RowData): TableData
  def delete(key: String): TableData
  def deleteAll(): TableData
  def primaryKeyValues: TablePrimaryKeys
  def setKeyAt(index: Int, key: String): Unit
}
