package org.finos.vuu.core.table

import org.finos.toolbox.text.AsciiUtil
import org.finos.vuu.api.TableDef
import org.finos.vuu.core.index.IndexedField
import org.finos.vuu.core.row.RowBuilder
import org.finos.vuu.provider.Provider
import org.finos.vuu.viewport.RowSource

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

case class JoinTableUpdate(joinTable: DataTable, rowUpdate: RowWithData) {
  override def toString: String = "JoinTableUpdate(" + joinTable.toString + ",updates=" + rowUpdate.data.size + ")"
}
