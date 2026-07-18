package org.finos.vuu.plugin.virtualized.table.range

trait RangeOptions {

  def maxRangeDepth: Option[Int]

  def maxRangeWidth: Option[Int]

}

object NoRangeOptions extends RangeOptions {

  override def maxRangeWidth: Option[Int] = None

  override def maxRangeDepth: Option[Int] = None

}

case class MaxRangeOptions(maxRangeDepth: Option[Int], maxRangeWidth: Option[Int]) extends RangeOptions
