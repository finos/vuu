package org.finos.vuu.plugin.virtualized.table

import org.finos.toolbox.collection.window.MovingWindow
import org.finos.vuu.core.table.TablePrimaryKeys

case class VirtualizedTableKeys(window: MovingWindow[String], dataSize: Int) extends TablePrimaryKeys {
  override def set(index: Int, key: String): TablePrimaryKeys = throw new Exception("Cannot mutate virtualized keys")

  def length: Int = dataSize

  def getAtIndex(index: Int): Option[String] = window.getAtIndex(index)

  override def add(key: String): TablePrimaryKeys = ???

  override def +(key: String): TablePrimaryKeys = throw new Exception("Cannot mutate virtualized keys")

  override def remove(key: String): TablePrimaryKeys = throw new Exception("Cannot mutate virtualized keys")

  override def -(key: String): TablePrimaryKeys = throw new Exception("Cannot mutate virtualized keys")

  override def sliceTableKeys(from: Int, until: Int): TablePrimaryKeys = ???

  override def get(index: Int): String = window.getAtIndex(index) match {
    case Some(s) => s
    case None => null
  }

  override def iterator: Iterator[String] = window.iterator
}
