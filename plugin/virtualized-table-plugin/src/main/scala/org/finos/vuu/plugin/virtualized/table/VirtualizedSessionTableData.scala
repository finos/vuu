package org.finos.vuu.plugin.virtualized.table

import org.finos.toolbox.collection.window.MovingWindow
import org.finos.toolbox.time.Clock
import org.finos.vuu.core.table._

class VirtualizedSessionTableData(cacheSize: Int)(implicit clock: Clock) extends TableData {

  final val rowCache: WindowedCache[String, RowData] = RowDataCache(cacheSize)
  final val keysWindow: MovingWindow[String] = WindowedTableKeys(cacheSize)

  @volatile var length: Int = 0

  override def dataByKey(key: String): RowData = {
    rowCache.get(key) match {
      case Some(row) => row
      case None => EmptyRowData
    }
  }

  override def update(key: String, update: RowData): (TableData, RowData) = {
    rowCache.put(key, update)
    (this, update)
  }

  override def delete(key: String): TableData = {
    rowCache.remove(key)
    this
  }

  override def deleteAll(): TableData = {
    rowCache.removeAll()
    this
  }
  override def setKeyAt(index: Int, key: String): Unit = {
    keysWindow.setAtIndex(index, key)
  }

  def setRangeForKeys(range: VirtualizedRange): Unit = {
    keysWindow.setRange(range.from, range.to)
  }

  def setLength(length: Int): Unit = {
    this.length = length
  }

  override def primaryKeyValues: TablePrimaryKeys = VirtualizedTableKeys(window = keysWindow, dataSize = length)
}
