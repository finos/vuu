package org.finos.vuu.core.table

import com.typesafe.scalalogging.StrictLogging
import org.finos.toolbox.collection.array.ImmutableArray
import org.finos.toolbox.jmx.MetricsProvider
import org.finos.toolbox.text.AsciiUtil
import org.finos.toolbox.time.Clock
import org.finos.vuu.api.TableDef
import org.finos.vuu.core.index.{InMemColumnIndices, IndexedField}
import org.finos.vuu.core.row.{InMemMapRowBuilder, RowBuilder}
import org.finos.vuu.feature.inmem.InMemTablePrimaryKeys
import org.finos.vuu.provider.{JoinTableProvider, Provider}
import org.finos.vuu.viewport.{RowProcessor, RowSource, ViewPortColumns}

import java.util
import java.util.concurrent.ConcurrentHashMap

trait DataTable extends KeyedObservable[RowKeyUpdate] with RowSource {

  @volatile private var provider: Provider = null

  protected def createDataTableData(): TableData

  def updateCounter: Long

  def newRow(key: String): RowBuilder

  def rowBuilder: RowBuilder

  def incrementUpdateCounter(): Unit

  def indexForColumn(column: Column): Option[IndexedField[_]]

  def setProvider(aProvider: Provider): Unit = provider = aProvider

  def getProvider: Provider = provider

  def getColumnValueProvider: ColumnValueProvider

  def asTable: DataTable = this

  def columnForName(name: String): Column = getTableDef.columnForName(name)

  def columnsForNames(names: String*): List[Column] = names.map(getTableDef.columnForName(_)).toList

  def columnsForNames(names: List[String]): List[Column] = names.map(getTableDef.columnForName(_))

  def getTableDef: TableDef

  def processUpdate(rowUpdate: RowData): Unit = {
    processUpdate(rowUpdate.key, rowUpdate)
  }

  def processUpdate(rowKey: String, rowUpdate: RowData): Unit

  def hasRowChanged(row: RowWithData): Boolean = {
    val existingRow = this.pullRow(row.key)
    !existingRow.equals(row)
  }

  def processDelete(rowKey: String): Unit

  def isSelectedVal(key: String, selected: Map[String, Any]): Int = {
    if (selected.contains(key)) 1 else 0
  }

  def size(): Long = {
    primaryKeys.length
  }

  def toAscii(count: Int): String = {
    val columns = getTableDef.getColumns
    val keys = primaryKeys

    val selectedKeys = keys.toArray.take(count)

    val rows = selectedKeys.map(key => pullRowAsArray(key, ViewPortColumnCreator.create(this, columns.map(_.name).toList)))

    val columnNames = columns.map(_.name)

    AsciiUtil.asAsciiTable(columnNames, rows)
  }

  def toAscii(start: Int, end: Int): String = {
    val columns = getTableDef.getColumns
    val keys = primaryKeys

    val selectedKeys = keys.toArray.slice(start, end) //.sliceToArray(start, end)//drop(start).take(end - start)

    val rows = selectedKeys.map(key => pullRowAsArray(key, ViewPortColumnCreator.create(this, columns.map(_.name).toList)))

    val columnNames = columns.map(_.name)

    AsciiUtil.asAsciiTable(columnNames, rows)
  }
}

case class RowKeyUpdate(key: String, source: RowSource, isDelete: Boolean = false) {
  override def toString: String = s"RowKeyUpdate($key, ${source.name})"
}

sealed trait RowData {
  def key: String

  def get(field: String): Any

  def get(column: Column): Any

  def getFullyQualified(column: Column): Any

  def set(field: String, value: Any): RowData

  def toArray(columns: List[Column]): Array[Any]

  def size: Int
}

case class RowWithData(key: String, data: Map[String, Any]) extends RowData {

  override def size: Int = data.size

  override def getFullyQualified(column: Column): Any = column.getDataFullyQualified(this)

  override def toArray(columns: List[Column]): Array[Any] = {
    columns.map(c => this.get(c)).toArray
  }

  override def get(column: Column): Any = {
    if (column != null) {
      column.getData(this)
    } else {
      null
    }
  }

  def get(column: String): Any = {
    if (data == null) {
      null
    } else {
      data.getOrElse(column, null)
    }
  }

  def set(field: String, value: Any): RowWithData = {
    RowWithData(key, data ++ Map[String, Any](field -> value))
  }
}

object EmptyRowData extends RowData {

  override def key: String = null

  override def size: Int = 0

  override def toArray(columns: List[Column]): Array[Any] = Array()

  override def get(field: String): Any = null

  override def get(column: Column): Any = null

  override def getFullyQualified(column: Column): Any = null

  override def set(field: String, value: Any): RowData = EmptyRowData
}

case class InMemDataTableData(data: ConcurrentHashMap[String, RowData],
                              private val primaryKeyValuesInternal: TablePrimaryKeys,
                              inMemRowDataMerger: InMemRowDataMerger)(implicit timeProvider: Clock) extends TableData {

  def primaryKeyValues: TablePrimaryKeys = this.primaryKeyValuesInternal

  override def setKeyAt(index: Int, key: String): Unit = {
    primaryKeyValues.set(index, key)
  }

  def dataByKey(key: String): RowData = data.get(key)

  def update(key: String, update: RowData): TableDataUpdate = {
    data.synchronized {
      val currentData = data.getOrDefault(key, EmptyRowData)
      val mergedData = inMemRowDataMerger.mergeLeftToRight(update, currentData)
      data.put(key, mergedData)
      currentData match {
        case EmptyRowData => TableDataInserted(InMemDataTableData(data, primaryKeyValues + key, inMemRowDataMerger), mergedData)
        case _ => TableDataUpdated(InMemDataTableData(data, primaryKeyValues, inMemRowDataMerger), currentData, mergedData)
      }
    }
  }

  def delete(key: String): TableDataDelete = {
    data.synchronized {
      val removed = data.remove(key)
      if (removed != null) {
        TableDataDeleted(InMemDataTableData(data, primaryKeyValues.-(key), inMemRowDataMerger), removed)
      } else {
        TableDataNothingDeleted
      }
    }
  }

  def deleteAll(): InMemDataTableData = {
    data.synchronized {
      data.clear()
      InMemDataTableData(data, InMemTablePrimaryKeys(ImmutableArray.empty), inMemRowDataMerger)
    }
  }

}


class InMemDataTable(val tableDef: TableDef, val joinProvider: JoinTableProvider)(implicit val metrics: MetricsProvider, timeProvider: Clock) extends DataTable with KeyedObservableHelper[RowKeyUpdate] with StrictLogging {

  private final val indices = InMemColumnIndices(tableDef)
  private final val columnValueProvider = InMemColumnValueProvider(this)
  private final val inMemRowDataMerger = InMemRowDataMerger(timeProvider)

  override def newRow(key: String): RowBuilder = {
    new InMemMapRowBuilder().setKey(key)
  }

  override def rowBuilder: RowBuilder = new InMemMapRowBuilder

  def plusName(s: String): String = name + "." + s

  override protected def createDataTableData(): TableData = {
    InMemDataTableData(new ConcurrentHashMap[String, RowData](), InMemTablePrimaryKeys(ImmutableArray.empty), inMemRowDataMerger)
  }

  override def toString: String = s"InMemDataTable($name, rows=${this.primaryKeys.length})"

  private val eventIntoJoiner = metrics.counter(plusName("JoinTableProviderImpl.eventIntoJoiner.count"))

  private val onUpdateMeter = metrics.meter(plusName("processUpdates.Meter"))

  private val onDeleteMeter = metrics.meter(plusName("processDeletes.Meter"))

  private val onUpdateCounter = metrics.counter(plusName("processUpdates.Counter"))

  override def name: String = tableDef.name

  override def linkableName: String = name

  override def getTableDef: TableDef = tableDef

  override def indexForColumn(column: Column): Option[IndexedField[_]] = {
    indices.indexForColumn(column)
  }

  override def primaryKeys: TablePrimaryKeys = data.primaryKeyValues

  @volatile protected var data: TableData = createDataTableData()

  @volatile private var updateCounterInternal: Long = 0

  override def updateCounter: Long = updateCounterInternal

  override def incrementUpdateCounter(): Unit = updateCounterInternal += 1

  override def pullRow(key: String): RowData = {
    data.dataByKey(key) match {
      case null =>
        EmptyRowData
      case row =>
        row
    }
  }

  override def pullRow(key: String, columns: ViewPortColumns): RowData = {
    data.dataByKey(key) match {
      case null =>
        EmptyRowData
      case row =>
        //row
        //CJS Check perf of this
        columns.pullRow(key, row)
    }
  }

  override def pullRowFiltered(key: String, columns: ViewPortColumns): RowData = {
    data.dataByKey(key) match {
      case null =>
        EmptyRowData
      case row =>
        //row
        //CJS Check perf of this
        columns.pullRowAlwaysFilter(key, row)
    }
  }

  override def pullRowAsArray(key: String, columns: ViewPortColumns): Array[Any] = {
    data.dataByKey(key) match {
      case EmptyRowData =>
        Array[Any]()
      case null =>
        Array[Any]()
      case row: RowWithData =>
        row.toArray(columns.getColumns)
    }
  }

  override def readRow(key: String, columns: List[String], rowProcessor: RowProcessor): Unit = {

    data.dataByKey(key) match {
      case null => rowProcessor.missingRow()
      case row =>
        columns.foreach(f => {
          val column = tableDef.columnForName(f)
          sendColumnToProcessor(key, column, row.get(column), rowProcessor)
        })

    }

  }

  private def sendColumnToProcessor(key: String, column: Column, value: Any, rowProcessor: RowProcessor): Unit = {
    rowProcessor.processColumn(column, value)
  }

  def columns(): Array[Column] = tableDef.getColumns
  
  def update(rowKey: String, rowUpdate: RowData): RowData = {
    val tableDataUpdate = data.update(rowKey, rowUpdate)
    data = tableDataUpdate.tableData
    tableDataUpdate match {
      case TableDataInserted(tableData, rowDataAfter) =>
        indices.insert(rowDataAfter)
        rowDataAfter
      case TableDataUpdated(tableData, rowDataBefore, rowDataAfter) =>
        indices.update(rowDataBefore, rowDataAfter)
        rowDataAfter
    }
  }

  def delete(rowKey: String): RowData = {
    val tableDataDelete = data.delete(rowKey)
    tableDataDelete match {
      case TableDataDeleted(tableData, rowDataBefore) =>
        data = tableData
        indices.remove(rowDataBefore)
        rowDataBefore
      case TableDataNothingDeleted =>
        logger.trace(s"Got a delete for key $rowKey, but it has no row data")
        EmptyRowData
    }
  }

  def notifyListeners(rowKey: String, isDelete: Boolean = false): Unit = {
    getObserversByKey(rowKey).foreach(obs => {
      obs.onUpdate(RowKeyUpdate(rowKey, this, isDelete))
    })
  }

  private def toEvent(rowKey: String, rowData: RowData): java.util.HashMap[String, Any] = {

    val ev = new util.HashMap[String, Any]()

    this.tableDef.joinFields.foreach(field => {
      val column = this.tableDef.columnForName(field)
      ev.put(column.name, rowData.get(column))
    }
    )

    //always add this primary key
    val pk = this.tableDef.columnForName(this.tableDef.keyField)
    ev.put(pk.name, rowData.get(pk))

    ev
  }

  private def toDeleteEvent(rowKey: String, rowData: RowData): java.util.HashMap[String, Any] = {

    val ev = new util.HashMap[String, Any]()

    this.tableDef.joinFields.foreach(field => {
      val column = this.tableDef.columnForName(field)
      ev.put(column.name, rowData.get(column))
    }
    )

    //always add this primary key
    val pk = this.tableDef.columnForName(this.tableDef.keyField)
    ev.put(pk.name, rowData.get(pk))
    ev.put("_isDeleted", true)

    ev
  }

  def sendToJoinSink(rowKey: String, rowData: RowData): Unit = {
    eventIntoJoiner.inc()
    if (joinProvider.hasJoins(this.tableDef.name)) {
      val event = toEvent(rowKey, rowData)
      joinProvider.sendEvent(this.tableDef.name, event)
    }
  }

  def sendDeleteToJoinSink(rowKey: String, rowData: RowData): Unit = {
    eventIntoJoiner.inc()
    if (joinProvider.hasJoins(this.tableDef.name)) {
      val event = toDeleteEvent(rowKey, rowData)
      joinProvider.sendEvent(this.tableDef.name, event)
    }
  }

  def processUpdate(rowKey: String, rowData: RowData): Unit = {

    onUpdateMeter.mark()

    onUpdateCounter.inc()

    val updatedRowData = update(rowKey, rowData)

    sendToJoinSink(rowKey, updatedRowData)

    notifyListeners(rowKey)

    incrementUpdateCounter()
  }

  def processDelete(rowKey: String): Unit = {

    onDeleteMeter.mark()

    onUpdateCounter.inc()

    val rowData = delete(rowKey)

    rowData match {
      case x: RowWithData =>
        sendDeleteToJoinSink(rowKey, rowData)
        notifyListeners(rowKey, isDelete = true)
      case EmptyRowData =>
    }

    incrementUpdateCounter()
  }

  override def getColumnValueProvider: ColumnValueProvider = columnValueProvider
}
