package org.finos.vuu.plugin.virtualized.table

case class VirtualizedRange(from: Int, to: Int) {
  def contains(index: Int): Boolean = {
    index >= from && index < to
  }
}
