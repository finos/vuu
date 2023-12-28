package org.finos.vuu.table.virtualized

import org.finos.toolbox.collection.window.ArrayBackedMovingWindow

class VirtualizedTableKeys(cacheSize: Int) {
  private val window = new ArrayBackedMovingWindow[String](cacheSize)
  @volatile private var internalLength = 0

  def setDataInRange(length: Int, from: Int, to: Int, data: Array[String]): Unit = {
    window.setRange(from, to)
    (from until to).foreach(i => window.setAtIndex(i, data(i)))
    internalLength = length
  }
  def length: Int = internalLength
  def getAtIndex(index:Int): Option[String] = window.getAtIndex(index)

}

case class VirtualizedDataTableData() {

}
