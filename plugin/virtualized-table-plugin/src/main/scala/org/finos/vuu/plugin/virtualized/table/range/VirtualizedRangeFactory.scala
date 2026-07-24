package org.finos.vuu.plugin.virtualized.table.range

import org.finos.vuu.plugin.virtualized.table.range.VirtualizedRange
import org.finos.vuu.viewport.ViewPortRange

object VirtualizedRangeFactory {

  private val minSize: Long = 20_000L
  private val maxSize: Long = 1_000_000_000L
  private val minWindow: Int = 1_000
  private val maxWindow: Int = 10_000
  private val logMinSize = math.log(minSize.toDouble)
  private val logMaxSize = math.log(maxSize.toDouble)

  def build(range: ViewPortRange, tableSize: Long): VirtualizedRange = {

    val windowSize = calculateWindowSize(tableSize)
    val requestedStart = Math.max(range.from - windowSize, 0)
    val requestedEnd = range.to + windowSize

    VirtualizedRange(requestedStart, requestedEnd)
  }

  private def calculateWindowSize(tableSize: Long): Int = {
    if (tableSize <= minSize) {
      minWindow
    } else if (tableSize >= maxSize) {
      maxWindow
    } else {
      val logTableSize = math.log(tableSize.toDouble)
      val ratio = (logTableSize - logMinSize) / (logMaxSize - logMinSize)
      (minWindow + (maxWindow - minWindow) * ratio).toInt
    }
  }
}
