package org.finos.vuu.example.ignite.query

import org.finos.vuu.viewport.ViewPortRange

object IndexCalculator {
  def apply(extraRowsCount : Int) : IndexCalculator =
    new IndexCalculator(extraRowsCount)
}

class IndexCalculator(extraRowCount:Int) {
  private val extraRowsCount = extraRowCount //fetch extra rows to reduce need to re-fetch when view port change by small amount
  private type StartIndex = Int
  private type EndIndex = Int
  private type RowCount = Int
  def calc(viewPortRange: ViewPortRange, totalSize: Int): (StartIndex, EndIndex, RowCount) = {

    val startIndex = Math.max(viewPortRange.from - extraRowsCount, 0)
    val endIndex = Math.min(viewPortRange.to + extraRowsCount, totalSize)
    val rowCount =
      if (startIndex == 0 && endIndex==0) 0
      else if (endIndex == startIndex) 1
      else endIndex - startIndex
    (startIndex, endIndex, rowCount)
  }
}