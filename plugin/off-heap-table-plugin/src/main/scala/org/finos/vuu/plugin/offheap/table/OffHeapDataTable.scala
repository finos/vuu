package org.finos.vuu.plugin.offheap.table

import com.typesafe.scalalogging.StrictLogging
import org.finos.toolbox.jmx.MetricsProvider
import org.finos.toolbox.time.Clock
import org.finos.vuu.api.TableDef
import org.finos.vuu.core.index.IndexedField
import org.finos.vuu.core.row.{InMemMapRowBuilder, RowBuilder}
import org.finos.vuu.core.table.{Column, ColumnValueProvider, DataTable, EmptyRowData, KeyedObservableHelper, RowData, RowKeyUpdate, RowWithData, TableData, TablePrimaryKeys}
import org.finos.vuu.provider.JoinTableProvider
import org.finos.vuu.viewport.{RowProcessor, ViewPortColumns}

import java.util.concurrent.atomic.AtomicLong

class OffHeapDataTable(private val tableDef: TableDef, private val joinProvider: JoinTableProvider)(using metrics: MetricsProvider, timeProvider: Clock) extends DataTable with KeyedObservableHelper[RowKeyUpdate] with StrictLogging {

  private final val indices: Map[Column, IndexedField[?]] = Map.empty
  private final val internalUpdateCounter: AtomicLong = AtomicLong(0)
  private final val data = createDataTableData();

  override protected def createDataTableData(): TableData = {
    OffHeapTableData(tableDef)
  }

  override def updateCounter: Long = internalUpdateCounter.get()

  override def newRow(key: String): RowBuilder = new InMemMapRowBuilder().setKey(key)

  override def rowBuilder: RowBuilder = new InMemMapRowBuilder()

  override def incrementUpdateCounter(): Unit = internalUpdateCounter.incrementAndGet()

  override def indexForColumn(column: Column): Option[IndexedField[_]] = indices.get(column)

  override def getColumnValueProvider: ColumnValueProvider = ???

  override def getTableDef: TableDef = tableDef

  override def processUpdate(rowKey: String, rowUpdate: RowData): Unit = ???

  override def processDelete(rowKey: String): Unit = ???

  override def name: String = tableDef.name

  override def linkableName: String = name

  override def notifyListeners(rowKey: String, isDelete: Boolean): Unit = {
    getObserversByKey(rowKey).foreach(obs => {
      obs.onUpdate(RowKeyUpdate(rowKey, this, isDelete))
    })
  }

  override def readRow(key: String, columns: List[String], processor: RowProcessor): Unit = ???

  override def primaryKeys: TablePrimaryKeys = data.primaryKeyValues

  override def pullRow(key: String): RowData = {
    data.dataByKey(key) match {
      case rowWithData: RowWithData => rowWithData
      case _ => EmptyRowData
    }
  }

  override def pullRow(key: String, columns: ViewPortColumns): RowData = {
    data.dataByKey(key) match {
      case rowWithData: RowWithData => columns.pullRow(key, rowWithData)
      case _ => EmptyRowData
    }
  }

  override def pullRowFiltered(key: String, columns: ViewPortColumns): RowData = {
    data.dataByKey(key) match {
      case rowWithData: RowWithData => columns.pullRowAlwaysFilter(key, rowWithData)
      case _ => EmptyRowData
    }
  }

  override def pullRowAsArray(key: String, columns: ViewPortColumns): Array[Any] = {
    data.dataByKey(key) match {
      case rowWithData: RowWithData => rowWithData.toArray(columns.getColumns)
      case _ => Array.empty
    }
  }

  override def toString: String = s"OffHeapDataTable($name, rows=${this.primaryKeys.length})"

}
