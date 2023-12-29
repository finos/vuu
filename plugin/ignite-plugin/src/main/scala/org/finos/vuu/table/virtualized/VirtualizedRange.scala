package org.finos.vuu.table.virtualized

case class VirtualizedRange(from: Int, to: Int){
  def contains(index: Int): Boolean = {
    index >= from && index < to
  }
}
