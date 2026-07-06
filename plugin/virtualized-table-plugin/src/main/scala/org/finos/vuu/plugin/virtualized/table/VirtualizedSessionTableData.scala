package org.finos.vuu.plugin.virtualized.table

import org.finos.toolbox.collection.window.MovingWindow
import org.finos.toolbox.time.Clock
import org.finos.vuu.core.table.{EmptyRowData, RowData, TableData, TableDataDelete, TableDataDeleted, TableDataInserted, TableDataNothingDeleted, TableDataUpdate, TableDataUpdated, TablePrimaryKeys}
import org.finos.vuu.plugin.virtualized.table.cache.WindowedCache

class VirtualizedSessionTableData(cacheSize: Int)(implicit clock: Clock) extends TableData {

  private final val rowCache: WindowedCache[String, RowData] = WindowedCache(cacheSize)
  private final val keysWindow: MovingWindow[String] = MovingWindow(cacheSize)
  @volatile var length: Int = 0

  override def dataByKey(key: String): RowData = {
    rowCache.get(key) match {
      case Some(row) => row
      case None => EmptyRowData
    }
  }

  override def update(key: String, update: RowData): TableDataUpdate = {
    rowCache.put(key, update) match {
      case Some(value) => TableDataUpdated(this, value, update)
      case None => TableDataInserted(this, update)
    }
  }

  override def delete(key: String): TableDataDelete = {
    rowCache.remove(key) match {
      case Some(value) => TableDataDeleted(this, value)
      case None => TableDataNothingDeleted
    }
  }

  override def deleteAll(): TableData = {
    rowCache.removeAll()
    this
  }

  override def setKeyAt(index: Int, key: String): Unit = {
    keysWindow.setAtIndex(index, key)
  }

  def setRangeForKeys(from: Int, to: Int): Unit = {
    keysWindow.setRange(from, to)
  }

  def isWithinRange(index: Int): Boolean = keysWindow.isWithinRange(index)

  def setLength(length: Int): Unit = {
    this.length = length
  }

  override def primaryKeyValues: TablePrimaryKeys = VirtualizedTableKeys(window = keysWindow, dataSize = length)
}
