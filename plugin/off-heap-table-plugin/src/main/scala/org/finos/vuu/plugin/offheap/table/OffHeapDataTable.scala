package org.finos.vuu.plugin.offheap.table

import com.typesafe.scalalogging.StrictLogging
import org.finos.toolbox.jmx.MetricsProvider
import org.finos.toolbox.time.Clock
import org.finos.vuu.api.TableDef
import org.finos.vuu.core.index.IndexedField
import org.finos.vuu.core.row.RowBuilder
import org.finos.vuu.core.table.{Column, ColumnValueProvider, DataTable, KeyedObservableHelper, RowData, RowKeyUpdate, TableData, TablePrimaryKeys}
import org.finos.vuu.provider.JoinTableProvider
import org.finos.vuu.viewport.{RowProcessor, ViewPortColumns}

class OffHeapDataTable(val tableDef: TableDef, val joinProvider: JoinTableProvider)(using metrics: MetricsProvider, timeProvider: Clock) extends DataTable with KeyedObservableHelper[RowKeyUpdate] with StrictLogging {

  override protected def createDataTableData(): TableData = ???

  override def updateCounter: Long = ???

  override def newRow(key: String): RowBuilder = ???

  override def rowBuilder: RowBuilder = ???

  override def incrementUpdateCounter(): Unit = ???

  override def indexForColumn(column: Column): Option[IndexedField[_]] = ???

  override def getColumnValueProvider: ColumnValueProvider = ???

  override def getTableDef: TableDef = ???

  override def processUpdate(rowKey: String, rowUpdate: RowData): Unit = ???

  override def processDelete(rowKey: String): Unit = ???

  override def name: String = ???

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

  override def pullRow(key: String): RowData = ???

  override def pullRowAsArray(key: String, columns: ViewPortColumns): Array[Any] = ???
}
