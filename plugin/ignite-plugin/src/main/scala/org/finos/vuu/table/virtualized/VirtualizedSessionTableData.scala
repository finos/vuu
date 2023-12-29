package org.finos.vuu.table.virtualized

import org.finos.toolbox.collection.array.ImmutableArray
import org.finos.toolbox.collection.window.MovingWindow
import org.finos.vuu.core.table.{EmptyRowData, RowData, RowWithData, TableData, TablePrimaryKeys}

class VirtualizedSessionTableData(cacheSize: Int) extends TableData {

  final val rowCache: RollingCache[String, RowData] = RowDataCache(cacheSize)
  final val keysWindow: MovingWindow[String] = RollingKeysWindow(cacheSize)

  @volatile var length: Int = 0

  override def dataByKey(key: String): RowData = {
    rowCache.get(key) match {
      case Some(row) => row
      case None => EmptyRowData
    }
  }

  override def update(key: String, update: RowWithData): TableData = {
    rowCache.put(key, update)
    this
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
