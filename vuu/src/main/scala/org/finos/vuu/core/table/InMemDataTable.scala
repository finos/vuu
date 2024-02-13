package org.finos.vuu.core.table

import org.finos.vuu.api.{SessionTableDef, TableDef}
import org.finos.vuu.core.index._
import org.finos.vuu.provider.{JoinTableProvider, Provider}
import org.finos.vuu.viewport.{RowProcessor, RowSource, ViewPortColumns}
import org.finos.toolbox.collection.array.ImmutableArray
import org.finos.toolbox.jmx.MetricsProvider
import org.finos.toolbox.text.AsciiUtil
import org.finos.vuu.feature.inmem.InMemTablePrimaryKeys
import org.finos.vuu.net.ClientSessionId

import java.util
import java.util.concurrent.ConcurrentHashMap
import scala.collection.JavaConverters
import scala.jdk.CollectionConverters


trait DataTable extends KeyedObservable[RowKeyUpdate] with RowSource {

  @volatile private var provider: Provider = null

  protected def createDataTableData(): TableData

  def updateCounter: Long

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

  def processUpdate(rowKey: String, rowUpdate: RowWithData, timeStamp: Long): Unit

  def processDelete(rowKey: String): Unit

  def isSelectedVal(key: String, selected: Map[String, Any]): Int = {
    if (selected.contains(key)) 1 else 0
  }

  def size(): Long = {
    primaryKeys.length
  }

  def toAscii(count: Int): String = {
    val columns = getTableDef.columns
    val keys = primaryKeys

    val selectedKeys = keys.toArray.take(count)

    val rows = selectedKeys.map(key => pullRowAsArray(key, ViewPortColumnCreator.create(this, columns.map(_.name).toList)))

    val columnNames = columns.map(_.name)

    AsciiUtil.asAsciiTable(columnNames, rows)
  }

  def toAscii(start: Int, end: Int): String = {
    val columns = getTableDef.columns
    val keys = primaryKeys

    val selectedKeys = keys.toArray.slice(start, end) //.sliceToArray(start, end)//drop(start).take(end - start)

    val rows = selectedKeys.map(key => pullRowAsArray(key, ViewPortColumnCreator.create(this, columns.map(_.name).toList)))

    val columnNames = columns.map(_.name)

    AsciiUtil.asAsciiTable(columnNames, rows)
  }
}

case class RowKeyUpdate(key: String, source: RowSource, isDelete: Boolean = false)
{
  override def toString: String = s"RowKeyUpdate($key, ${source.name})"
}

trait RowData {
  def key(): String
  def get(field: String): Any
  def get(column: Column): Any
  def getFullyQualified(column: Column): Any
  def set(field: String, value: Any): RowData
  def toArray(columns: List[Column]): Array[Any]
  def size(): Int
}

case class JoinTableUpdate(joinTable: DataTable, rowUpdate: RowWithData, time: Long) {
  override def toString: String = "JoinTableUpdate(" + joinTable.toString + ",updates=" + rowUpdate.data.size + ")"
}

case class RowWithData(key: String, data: Map[String, Any]) extends RowData {

  def this(key: String, data: java.util.Map[String, Any]) {

    this(key, JavaConverters.asScala(data).toMap)
  }

  //override def hashCode(): Int = 37 * (key.hashCode + data.hashCode())

  override def size(): Int = data.size

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
    }
    else {
      data.get(column) match {
        case Some(x) => x
        case None => null //throw new Exception(s"column $column doesn't exist in data $data")
      }
    }
  }

  def set(field: String, value: Any): RowWithData = {
    RowWithData(key, data ++ Map[String, Any](field -> value))
  }

}

object EmptyRowData extends RowData {

  override def key(): String = null

  override def size(): Int = 0

  override def toArray(columns: List[Column]): Array[Any] = Array()

  override def get(field: String): Any = null

  override def get(column: Column): Any = null

  override def getFullyQualified(column: Column): Any = null

  override def set(field: String, value: Any): RowData = EmptyRowData


}


case class InMemDataTableData(data: ConcurrentHashMap[String, RowData], private val primaryKeyValuesInternal: TablePrimaryKeys) extends TableData {

  def primaryKeyValues: TablePrimaryKeys = this.primaryKeyValuesInternal

  override def setKeyAt(index: Int, key: String): Unit = {
    primaryKeyValues.set(index, key)
  }

  def dataByKey(key: String): RowData = data.get(key)

  //protected def merge(update: RowUpdate, data: RowData): RowData = MergeFunctions.mergeLeftToRight(update, data)

  protected def merge(update: RowWithData, data: RowWithData): RowWithData =
    MergeFunctions.mergeLeftToRight(update, data)

  def update(key: String, update: RowWithData): TableData = {

    val table = data.synchronized {

      data.getOrDefault(key, EmptyRowData) match {
        case row: RowWithData =>
          val mergedData = merge(update, row)
          data.put(key, mergedData)
          InMemDataTableData(data, primaryKeyValues)
        case EmptyRowData =>
          data.put(key, update)
          InMemDataTableData(data, primaryKeyValues + key)
      }

    }

    table
  }

  def delete(key: String): TableData = {

    data.synchronized {

      data.remove(key)

      InMemDataTableData(data, primaryKeyValues.-(key))
    }
  }

  def deleteAll(): InMemDataTableData = {
    data.synchronized {
      data.clear()
      InMemDataTableData(data, InMemTablePrimaryKeys(ImmutableArray.empty))
    }
  }

}


class InMemDataTable(val tableDef: TableDef, val joinProvider: JoinTableProvider)(implicit val metrics: MetricsProvider) extends DataTable with KeyedObservableHelper[RowKeyUpdate] {

  private final val indices = tableDef.indices.indices
    .map(index => tableDef.columnForName(index.column))
    .map(c => c -> buildIndexForColumn(c)).toMap[Column, IndexedField[_]]

  private final val columnValueProvider = InMemColumnValueProvider(this)

  private def buildIndexForColumn(c: Column): IndexedField[_] = {
    c.dataType match {
      case DataType.StringDataType =>
        new SkipListIndexedStringField(c)
      case DataType.IntegerDataType =>
        new SkipListIndexedIntField(c)
      case DataType.LongDataType =>
        new SkipListIndexedLongField(c)
      case DataType.DoubleDataType =>
        new SkipListIndexedDoubleField(c)
      case DataType.BooleanDataType =>
        new SkipListIndexedBooleanField(c)
    }
  }

  def plusName(s: String): String = tableDef.name + "." + s

  override protected def createDataTableData(): TableData = {
    InMemDataTableData(new ConcurrentHashMap[String, RowData](), InMemTablePrimaryKeys(ImmutableArray.empty))
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
    indices.get(column)
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
        columns.getColumns().map(c => row.get(c)).toArray
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

  def columns(): Array[Column] = tableDef.columns
  lazy val viewPortColumns: ViewPortColumns = ViewPortColumnCreator.create(this, tableDef.columns.map(_.name).toList)

  private def updateIndices(rowkey: String, rowUpdate: RowWithData): Unit = {
    this.indices.foreach(colTup => {
      val column = colTup._1
      val index = colTup._2

      rowUpdate.get(column) match {
        case null =>
        case x: Any =>
          column.dataType match {
            case DataType.StringDataType =>
              index.asInstanceOf[IndexedField[String]].insert(x.asInstanceOf[String], rowkey)
            case DataType.IntegerDataType =>
              index.asInstanceOf[IndexedField[Int]].insert(x.asInstanceOf[Int], rowkey)
            case DataType.LongDataType =>
              index.asInstanceOf[IndexedField[Long]].insert(x.asInstanceOf[Long], rowkey)
            case DataType.DoubleDataType =>
              index.asInstanceOf[IndexedField[Double]].insert(x.asInstanceOf[Double], rowkey)
            case DataType.BooleanDataType =>
              index.asInstanceOf[IndexedField[Boolean]].insert(x.asInstanceOf[Boolean], rowkey)
          }
      }
    })
  }

  private def removeFromIndices(rowkey: String, rowDeleted: RowWithData): Unit = {
    this.indices.foreach(colTup => {
      val column = colTup._1
      val index = colTup._2

      rowDeleted.get(column) match {
        case null =>
        case x: Any =>
          column.dataType match {
            case DataType.StringDataType =>
              index.asInstanceOf[IndexedField[String]].remove(x.asInstanceOf[String], rowkey)
            case DataType.IntegerDataType =>
              index.asInstanceOf[IndexedField[Int]].remove(x.asInstanceOf[Int], rowkey)
          }
      }
    })
  }

  def update(rowkey: String, rowUpdate: RowWithData): Unit = {
    data = data.update(rowkey, rowUpdate)
    updateIndices(rowkey, rowUpdate)
  }

  def delete(rowKey: String): Unit = {
    data.dataByKey(rowKey) match {
      case EmptyRowData =>
      case x: RowWithData =>
        removeFromIndices(rowKey, x)
        data = data.delete(rowKey)
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

  def processUpdate(rowKey: String, rowData: RowWithData, timeStamp: Long): Unit = {

    onUpdateMeter.mark()

    onUpdateCounter.inc()

    update(rowKey, rowData)

    sendToJoinSink(rowKey, rowData)

    notifyListeners(rowKey)

    incrementUpdateCounter()
  }

  def processDelete(rowKey: String): Unit = {

    onDeleteMeter.mark()

    onUpdateCounter.inc()

    val rowData = data.dataByKey(rowKey)

    delete(rowKey)

    if (rowData != null)
      sendDeleteToJoinSink(rowKey, rowData)

    notifyListeners(rowKey, isDelete = true)

    incrementUpdateCounter()
  }

  override def getColumnValueProvider: ColumnValueProvider = columnValueProvider
}
