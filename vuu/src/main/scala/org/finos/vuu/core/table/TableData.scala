package org.finos.vuu.core.table

trait TableData {
  def dataByKey(key: String): RowData
  def update(key: String, update: RowData): TableDataUpdate
  def delete(key: String): TableDataDelete
  def deleteAll(): TableData
  def primaryKeyValues: TablePrimaryKeys
  def setKeyAt(index: Int, key: String): Unit
}

sealed trait TableDataUpdate {
  val tableData: TableData
}

case class TableDataInserted(tableData: TableData, rowDataAfter: RowData) extends TableDataUpdate

case class TableDataUpdated(tableData: TableData, rowDataBefore: RowData, rowDataAfter: RowData) extends TableDataUpdate

sealed trait TableDataDelete {

}

case class TableDataDeleted(tableData: TableData, rowDataBefore: RowData) extends TableDataDelete

object TableDataNothingDeleted extends TableDataDelete

