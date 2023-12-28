package org.finos.vuu.viewport

import org.finos.vuu.core.table._
import org.finos.toolbox.collection.array.ImmutableArray

trait RowProcessor {
  def processColumn(column: Column, value: Any): Unit

  def missingRow(): Unit

  def missingRowData(rowKey: String, column: Column): Unit
}

/**
 * A session listener is a special type of table, it processes all update notifications from the source table
 * and forwards them onto the viewport. This is for use in Session tables mainly GroupBy session tables.
 *
 */
trait SessionListener {
  //def processRawUpdate(rowKey: String, rowUpdate: RowWithData, timeStamp: Long): Unit
  //def processRawDelete(rowKey: String): Unit
}

trait RowSource extends KeyedObservable[RowKeyUpdate] {
  def name: String

  /**
   * notify listeners explicit when a rowKey changes
   */
  def notifyListeners(rowKey: String, isDelete: Boolean = false): Unit

  /**
   * Link table name is the name of the underlying table that we can link to.
   * In a session table this would be the underlying table.
   *
   * @return
   */
  def linkableName: String

  def readRow(key: String, columns: List[String], processor: RowProcessor): Unit

  def primaryKeys: TablePrimaryKeys

  def pullRow(key: String, columns: ViewPortColumns): RowData

  /**
   * Note the below call should only be used for testing. It filters the contents of maps by the expected viewPortColumns.
   * In practice we never need to do this at runtime.
   */
  def pullRowFiltered(key: String, columns: ViewPortColumns): RowData

  def pullRow(key: String): RowData

  //def pullRowWithSelection(key: String, columns: List[Column], selected: Map[String, Any]): RowData
  def pullRowAsArray(key: String, columns: ViewPortColumns): Array[Any]

  //def pullRowAsArrayWithSelection(key: String, columns: List[Column], selected: Map[String, Any]): Array[Any]
  def asTable: DataTable
  //  def addSessionListener(listener: SessionListener): Unit
  //  def removeSessionListener(listener: SessionListener): Unit
}
