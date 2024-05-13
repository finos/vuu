package org.finos.vuu.test

import org.finos.vuu.api.TableDef
import org.finos.vuu.core.index.IndexedField
import org.finos.vuu.core.table.{Column, ColumnValueProvider, DataTable, KeyObserver, RowData, RowKeyUpdate, RowWithData, TableData, TablePrimaryKeys}
import org.finos.vuu.viewport.{RowProcessor, ViewPortColumns}

class FakeInMemoryTable(val instanceName: String, val tableDef: TableDef) extends DataTable {

  private val rowMap = scala.collection.mutable.HashMap.empty[String, RowWithData]

  override def name: String = instanceName
  override def getTableDef: TableDef = tableDef

  override def processUpdate(rowKey: String, rowUpdate: RowWithData, timeStamp: Long = 0): Unit =
    rowMap += (rowKey -> rowUpdate)

  override def pullRow(key: String): RowData =
    rowMap.get(key)
      .getOrElse(throw new Exception(s"Could not find row data for key $key in table $name"))

  def pullAllRows() : List[RowWithData] =  rowMap.values.toList

  override protected def createDataTableData(): TableData = ???

  override def updateCounter: Long = ???

  override def incrementUpdateCounter(): Unit = ???

  override def indexForColumn(column: Column): Option[IndexedField[_]] = ???

  override def getColumnValueProvider: ColumnValueProvider = ???

  override def processDelete(rowKey: String): Unit = ???

  /**
   * notify listeners explicit when a rowKey changes
   */
  override def notifyListeners(rowKey: String, isDelete: Boolean): Unit = ???

  /**
   * Link table name is the name of the underlying table that we can link to.
   * In a session table this would be the underlying table.
   *
   * @return
   */
  override def linkableName: String = ???

  override def readRow(key: String, columns: List[String], processor: RowProcessor): Unit = ???

  override def primaryKeys: TablePrimaryKeys = ???

  override def pullRow(key: String, columns: ViewPortColumns): RowData = ???

  /**
   * Note the below call should only be used for testing. It filters the contents of maps by the expected viewPortColumns.
   * In practice we never need to do this at runtime.
   */
  override def pullRowFiltered(key: String, columns: ViewPortColumns): RowData = ???

  override def pullRowAsArray(key: String, columns: ViewPortColumns): Array[Any] = ???

  override def getObserversByKey(): Map[String, Array[KeyObserver[RowKeyUpdate]]] = ???

  override def addKeyObserver(key: String, observer: KeyObserver[RowKeyUpdate]): Boolean = ???

  override def removeKeyObserver(key: String, observer: KeyObserver[RowKeyUpdate]): Boolean = ???

  override def getObserversByKey(key: String): List[KeyObserver[RowKeyUpdate]] = ???

  override def isKeyObserved(key: String): Boolean = ???

  override def isKeyObservedBy(key: String, observer: KeyObserver[RowKeyUpdate]): Boolean = ???

  override def removeAllObservers(): Unit = ???
}