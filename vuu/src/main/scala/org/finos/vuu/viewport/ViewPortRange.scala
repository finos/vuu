package org.finos.vuu.viewport

import org.finos.vuu.core.table.RangeSettings

case class ViewPortRange(from: Int, to: Int) {

  def contains(i: Int): Boolean = {
    i >= from && i < to
  }

  def subtract(newRange: ViewPortRange): ViewPortRange = {
    var from = newRange.from
    var to = newRange.to

    if (newRange.from > this.from && newRange.from < this.to) {
      from = this.to
      to = newRange.to
    }

    if (newRange.from < this.from && newRange.to < this.to && newRange.to > this.from) {
      from = newRange.from
      to = this.from
    }

    ViewPortRange(from, to)
  }

  def isValid(rangeSettings: RangeSettings): Boolean = {
    to <= rangeSettings.maxRangeEnd && (to - from) <= rangeSettings.maxRangeWidth
  }

}

object DefaultRange extends ViewPortRange(0, 100)

object EmptyRange extends ViewPortRange(0, 0)