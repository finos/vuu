package org.finos.toolbox.collection.window

case class WindowRange(from: Int, to: Int) {
  require(to >= from, "Window upper bound ('to') cannot be less than lower bound ('from')")

  def isWithin(index: Int): Boolean = {
    index >= from && index < to
  }

  def overlap(from: Int, to: Int): (Int, Int) = {
    if (from >= this.to || to <= this.from) {
      (0, 0)
    } else {
      (Math.max(from, this.from), Math.min(to, this.to))
    }
  }
}
