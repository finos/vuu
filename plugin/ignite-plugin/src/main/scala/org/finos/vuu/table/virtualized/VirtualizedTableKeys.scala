package org.finos.vuu.table.virtualized

import org.finos.toolbox.collection.window.ArrayBackedMovingWindow
import org.finos.vuu.core.table.TablePrimaryKeys

case class VirtualizedTableKeys(range: VirtualizedRange, data: Array[String], cacheSize: Int = 10_000) extends TablePrimaryKeys{

  private val window = new ArrayBackedMovingWindow[String](10_000)

  window.setRange(range.from, range.to)

  (range.from until range.to).foreach(i => window.setAtIndex(i, data(i)))

  def length: Int = range.size
  def getAtIndex(index:Int): Option[String] = window.getAtIndex(index)
  override def add(key: String): TablePrimaryKeys = ???
  override def +(key: String): TablePrimaryKeys = ???
  override def remove(key: String): TablePrimaryKeys = ???
  override def -(key: String): TablePrimaryKeys = ???
  override def sliceTableKeys(from: Int, until: Int): TablePrimaryKeys = ???
  override def get(index: Int): String = ???
  override def iterator: Iterator[String] = ???
}
