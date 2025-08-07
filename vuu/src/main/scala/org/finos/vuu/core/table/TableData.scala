package org.finos.vuu.core.table

trait TableData {
  def dataByKey(key: String): RowData
  def update(key: String, update: RowData): TableData
  def delete(key: String): TableData
  def deleteAll(): TableData
  def primaryKeyValues: TablePrimaryKeys
  def setKeyAt(index: Int, key: String): Unit
}
