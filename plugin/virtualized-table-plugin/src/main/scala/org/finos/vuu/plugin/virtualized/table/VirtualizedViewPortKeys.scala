package org.finos.vuu.plugin.virtualized.table

import org.finos.toolbox.collection.array.ImmutableArray
import org.finos.toolbox.collection.window.ArrayBackedMovingWindow
import org.finos.vuu.core.table.TablePrimaryKeys
import org.finos.vuu.feature.ViewPortKeys

class VirtualizedViewPortKeys(val virtualLength: Int, cachedKeys: ImmutableArray[String], val cacheFromIndex: Int, val cacheToIndex: Int) extends ViewPortKeys {

  private val window = new ArrayBackedMovingWindow[String](1000)
  override def create(tableKeys: TablePrimaryKeys): ViewPortKeys = ???

  override def get(index: Int): String = ???
  override def slice(from: Int, to: Int): Array[String] = ???
  override def sliceToKeys(from: Int, to: Int): ViewPortKeys = ???
  override def length: Int = ???
  override def toArray(): Array[String] = ???
  def setDataInRange(from: Int, to: Int, data: Array[String]): Unit = ???
}
