package org.finos.vuu.test

import org.finos.vuu.api.TableDef
import org.finos.vuu.core.index.IndexedField
import org.finos.vuu.core.row.RowBuilder
import org.finos.vuu.core.table.{Column, ColumnValueProvider, DataTable, KeyObserver, RowData, RowKeyUpdate, RowWithData, TableData, TablePrimaryKeys}
import org.finos.vuu.viewport.{RowProcessor, ViewPortColumns}

class FakeInMemoryTable(val instanceName: String, val tableDef: TableDef) extends DataTable {

  private val rowMap = scala.collection.mutable.HashMap.empty[String, RowData]

  override def name: String = instanceName
  override def getTableDef: TableDef = tableDef

  override def newRow(key: String): RowBuilder = ???
  override def rowBuilder: RowBuilder = ???

  override def processUpdate(rowKey: String, rowUpdate: RowData): Unit =
    rowMap += (rowKey -> rowUpdate)

  override def pullRow(key: String): RowData =
    rowMap.getOrElse(key, throw new Exception(s"Could not find row data for key $key in table $name"))

  def pullAllRows() : List[RowData] =  rowMap.values.toList

  override protected def createDataTableData(): TableData = ???

  override def updateCounter: Long = ???

  override def incrementUpdateCounter(): Unit = ???

  override def indexForColumn(column: Column): Option[IndexedField[_]] = ???

  override def getColumnValueProvider: ColumnValueProvider = ???

  override def processDelete(rowKey: String): Unit = ???

  override def notifyListeners(rowKey: String, isDelete: Boolean): Unit = ???

  override def linkableName: String = ???

  override def readRow(key: String, columns: List[String], processor: RowProcessor): Unit = ???

  override def primaryKeys: TablePrimaryKeys = ???

  override def pullRow(key: String, columns: ViewPortColumns): RowData = ???

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