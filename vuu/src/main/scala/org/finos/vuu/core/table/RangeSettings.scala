package org.finos.vuu.core.table

trait RangeSettings {

  def maxRangeEnd: Int
  def maxRangeWidth: Int
  def withMaxRangeEnd(maxRangeEnd: Int): RangeSettings
  def withMaxRangeWidth(maxRangeWidth: Int): RangeSettings
    
}

object RangeSettings  {

  def apply(): RangeSettings = RangeSettingsImpl(Int.MaxValue, 1_000)

}

case class RangeSettingsImpl(maxRangeEnd: Int, maxRangeWidth: Int) extends RangeSettings {
  
  override def withMaxRangeEnd(maxRangeEnd: Int): RangeSettings = this.copy(maxRangeEnd = maxRangeEnd)
  
  override def withMaxRangeWidth(maxRangeWidth: Int): RangeSettings = this.copy(maxRangeWidth = maxRangeWidth)
  
}