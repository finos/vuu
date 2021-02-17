/**
 * Copyright Whitebox Software Ltd. 2014
 * All Rights Reserved.
 *
 * Created by chris on 26/02/2014.
 *
 */
package io.venuu.vuu.core.table

import io.venuu.toolbox.jmx.MetricsProvider
import io.venuu.toolbox.text.AsciiUtil
import io.venuu.toolbox.{ImmutableArray, NiaiveImmutableArray}
import io.venuu.vuu.api.TableDef
import io.venuu.vuu.provider.{JoinTableProvider, Provider}
import io.venuu.vuu.viewport.{RowProcessor, RowSource}

import java.util
import java.util.concurrent.ConcurrentHashMap


trait DataTable extends KeyedObservable[RowKeyUpdate] with RowSource {

  @volatile private var provider: Provider = null

  def setProvider(aProvider: Provider): Unit = provider = aProvider

  def getProvider: Provider = provider

  def asTable = this

  def columnForName(name: String): Column = getTableDef.columnForName(name)

  def columnsForNames(names: String*): List[Column] = names.map(getTableDef.columnForName(_)).toList

  def columnsForNames(names: List[String]): List[Column] = names.map(getTableDef.columnForName(_)).toList

  def getTableDef: TableDef

  def processUpdate(rowKey: String, rowUpdate: RowWithData, timeStamp: Long): Unit

  def processDelete(rowKey: String): Unit

  def isSelectedVal(key: String, selected: Map[String, Any]): Int = {
    if (selected.contains(key)) 1 else 0
  }

  def size(): Long = {
    primaryKeys.length
  }

  def toAscii(count: Int) = {
    val columns = getTableDef.columns
    val keys = primaryKeys

    val selectedKeys = keys.toArray.take(count)

    val rows = selectedKeys.map(key => pullRowAsArray(key, columns.toList))

    val columnNames = columns.map(_.name)

    AsciiUtil.asAsciiTable(columnNames, rows)
  }

  def toAscii(start: Int, end: Int) = {
    val columns = getTableDef.columns
    val keys = primaryKeys

    val selectedKeys = keys.toArray.drop(start).take(end - start)

    val rows = selectedKeys.map(key => pullRowAsArray(key, columns.toList))

    val columnNames = columns.map(_.name)

    AsciiUtil.asAsciiTable(columnNames, rows)
  }


}

case class RowKeyUpdate(key: String, source: RowSource, isDelete: Boolean = false)

case class RowUpdate(key: String, data: Map[String, Any]) {
  def toRowData = ???
}

trait RowData {
  def get(field: String): Any

  def get(column: Column): Any

  def getFullyQualified(column: Column): Any

  def set(field: String, value: Any): RowData
}

case class JoinTableUpdate(joinTable: DataTable, rowUpdate: RowWithData, time: Long)

case class RowWithData(key: String, data: Map[String, Any]) extends RowData {

  override def getFullyQualified(column: Column): Any = column.getDataFullyQualified(this)

  override def get(column: Column): Any = column.getData(this)

  def get(column: String): Any = {
    data.get(column) match {
      case Some(x) => x
      case None => null //throw new Exception(s"column $column doesn't exist in data $data")
    }
  }

  def set(field: String, value: Any): RowWithData = {
    new RowWithData(key, data ++ Map[String, Any](field -> value))
  }

}

object EmptyRowData extends RowData {
  override def get(field: String): Any = null

  override def get(column: Column): Any = null

  override def getFullyQualified(column: Column): Any = null

  override def set(field: String, value: Any): RowData = EmptyRowData
}


case class SimpleDataTableData(data: ConcurrentHashMap[String, RowData], primaryKeyValues: ImmutableArray[String]) {

  def dataByKey(key: String): RowData = data.get(key)

  //protected def merge(update: RowUpdate, data: RowData): RowData = MergeFunctions.mergeLeftToRight(update, data)

  protected def merge(update: RowWithData, data: RowWithData): RowWithData =
    MergeFunctions.mergeLeftToRight(update, data)

  def update(key: String, update: RowWithData): SimpleDataTableData = {

    val table = data.synchronized {

      data.getOrDefault(key, EmptyRowData) match {
        case row: RowWithData =>
          val mergedData = merge(update, row)
          data.put(key, mergedData)
          SimpleDataTableData(data, primaryKeyValues)
        case EmptyRowData =>
          data.put(key, update)
          SimpleDataTableData(data, primaryKeyValues + key)
      }

    }

    table
  }

  def delete(key: String): SimpleDataTableData = {

    data.synchronized {

      data.remove(key)

      SimpleDataTableData(data, primaryKeyValues.-(key))
    }
  }
}


class SimpleDataTable(val tableDef: TableDef, val joinProvider: JoinTableProvider)(implicit val metrics: MetricsProvider) extends DataTable with KeyedObservableHelper[RowKeyUpdate] {

  def plusName(s: String) = tableDef.name + "." + s

  private val eventIntoEsper = metrics.counter(plusName("JoinTableProviderImpl.eventIntoEsper.count"))

  private val onUpdateMeter = metrics.meter(plusName("processUpdates.Meter"))

  private val onDeleteMeter = metrics.meter(plusName("processDeletes.Meter"))

  private val onUpdateCounter = metrics.counter(plusName("processUpdates.Counter"))

  override def name: String = tableDef.name

  override def getTableDef: TableDef = tableDef

  override def primaryKeys: ImmutableArray[String] = data.primaryKeyValues

  @volatile private var data = new SimpleDataTableData(new ConcurrentHashMap[String, RowData](), new NiaiveImmutableArray[String](new Array[String](0)))

  override def pullRow(key: String, columns: List[Column]): RowData = {
    data.dataByKey(key) match {
      case null =>
        EmptyRowData
      case row =>
        val rowData = columns.map(c => (c.name -> row.get(c))).toMap
        RowWithData(key, rowData)
    }
  }

  override def pullRowAsArray(key: String, columns: List[Column]): Array[Any] = {
    data.dataByKey(key) match {
      case null =>
        Array[Any]()
      case row =>
        columns.map(c => row.get(c)).toArray
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

  protected def sendColumnToProcessor(key: String, column: Column, value: Any, rowProcessor: RowProcessor) = {
    rowProcessor.processColumn(column, value)
  }

  def columns(): Array[Column] = tableDef.columns

  def update(rowkey: String, rowUpdate: RowWithData) = {
    data = data.update(rowkey, rowUpdate)
  }

  def delete(rowKey: String) = {
    data = data.delete(rowKey)
  }

  def notifyListeners(rowKey: String, isDelete: Boolean = false) = {
    getObserversByKey(rowKey).foreach(obs => obs.onUpdate(new RowKeyUpdate(rowKey, this, isDelete)))
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

  def sendToJoinSink(rowKey: String, rowData: RowData) = {

    eventIntoEsper.inc()

    //only send to Esper when esper cares
    if (joinProvider.hasJoins(this.tableDef.name)) {

      val event = toEvent(rowKey, rowData)

      joinProvider.sendEvent(this.tableDef.name, event)
    }
  }

  def sendDeleteToJoinSink(rowKey: String, rowData: RowData) = {

    eventIntoEsper.inc()

    //only send to Esper when esper cares
    if (joinProvider.hasJoins(this.tableDef.name)) {

      val event = toDeleteEvent(rowKey, rowData)

      joinProvider.sendEvent(this.tableDef.name, event)
    }
  }

  def processUpdate(rowKey: String, rowData: RowWithData, timeStamp: Long) = {

    onUpdateMeter.mark()

    onUpdateCounter.inc()

    update(rowKey, rowData)

    sendToJoinSink(rowKey, rowData)

    notifyListeners(rowKey)
  }

  def processDelete(rowKey: String) = {

    onDeleteMeter.mark()

    onUpdateCounter.inc()

    val rowData = data.data.get(rowKey)

    delete(rowKey)

    if (rowData != null)
      sendDeleteToJoinSink(rowKey, rowData)

    notifyListeners(rowKey, isDelete = true)
  }

}
