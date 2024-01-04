package org.finos.vuu.plugin.virtualized.table

import org.finos.toolbox.collection.array.ImmutableArray
import org.finos.toolbox.collection.window.ArrayBackedMovingWindow
import org.finos.vuu.core.table.TablePrimaryKeys
import org.finos.vuu.feature.ViewPortKeys

class VirtualizedViewPortKeys(tablePrimaryKeys: TablePrimaryKeys) extends ViewPortKeys {

  override def create(tableKeys: TablePrimaryKeys): ViewPortKeys = ???

  override def get(index: Int): String = tablePrimaryKeys.get(index)
  override def sliceToArray(from: Int, to: Int): Array[String] = tablePrimaryKeys.sliceTableKeys(from, to).toArray
  override def sliceToKeys(from: Int, to: Int): ViewPortKeys = ???
  override def length: Int = tablePrimaryKeys.length
  override def toArray(): Array[String] = tablePrimaryKeys.toArray
  def setDataInRange(from: Int, to: Int, data: Array[String]): Unit = ???
  override def iterator: Iterator[String] = tablePrimaryKeys.iterator
}
