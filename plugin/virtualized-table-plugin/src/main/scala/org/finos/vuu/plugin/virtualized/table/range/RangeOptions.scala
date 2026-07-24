package org.finos.vuu.plugin.virtualized.table.range

trait RangeOptions {

  def maxRangeEnd: Option[Int]

  def maxRangeWidth: Option[Int]

}

object NoRangeOptions extends RangeOptions {

  override def maxRangeEnd: Option[Int] = None

  override def maxRangeWidth: Option[Int] = None

}

case class MaxRangeOptions(maxRangeEnd: Option[Int], maxRangeWidth: Option[Int]) extends RangeOptions
