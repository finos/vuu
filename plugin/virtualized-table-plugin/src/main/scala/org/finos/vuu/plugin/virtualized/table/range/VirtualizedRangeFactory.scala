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

  def build(
             range: ViewPortRange,
             rangeOptions: RangeOptions,
             tableSize: Long
           ): VirtualizedRange = {

    val maxEnd = rangeOptions.maxRangeEnd.getOrElse(Int.MaxValue)
    val maxWidth = rangeOptions.maxRangeWidth.getOrElse(Int.MaxValue)

    if (range.to > maxEnd) {
      return VirtualizedRange(0, 0)
    }

    val width = range.to - range.from
    if (width > maxWidth) {
      return VirtualizedRange(0, 0)
    }

    val windowSize = calculateWindowSize(tableSize)

    val requestedStart = Math.max(range.from - windowSize, 0)
    val requestedEnd = range.to + windowSize

    val endIndex = Math.min(requestedEnd, maxEnd)
    val startIndex = Math.min(requestedStart, endIndex)

    VirtualizedRange(startIndex, endIndex)
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
