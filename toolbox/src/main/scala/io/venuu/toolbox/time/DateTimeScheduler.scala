/**
  * Copyright Whitebox Software Ltd. 2014
  * All Rights Reserved.
  *
  * Created by chris on 19/10/2016.
  *
  */
package io.venuu.toolbox.time

import java.time.{DayOfWeek, LocalDateTime, ZoneId}

object DateTimeScheduler{
  final val AllDaysStr = "all"
  final val AllDays = List(DayOfWeek.MONDAY.getValue, DayOfWeek.TUESDAY.getValue, DayOfWeek.WEDNESDAY.getValue,
                          DayOfWeek.THURSDAY.getValue, DayOfWeek.FRIDAY.getValue, DayOfWeek.SATURDAY.getValue, DayOfWeek.SUNDAY.getValue)
}

class DateTimeScheduler(days: String, times: List[String], timeZone: String)(implicit time: Clock) {

  import DateTimeScheduler._

  private val tz = ZoneId.of(timeZone)

  private val daysAsInt = daysToDaysOfWeek(days)


  def next(): LocalDateTime = {
       null
  }

  def daysToDaysOfWeek(days: String): List[Int] = {
    if(days.toLowerCase == AllDaysStr) AllDays else days.split(" ").toList.map(s => dayToInt(s) )
  }

  def dayToInt(day: String): Int = {
    day.toUpperCase() match {
      case "MO" => DayOfWeek.MONDAY.getValue
      case "TU" => DayOfWeek.TUESDAY.getValue
      case "WE" => DayOfWeek.TUESDAY.getValue
      case "TH" => DayOfWeek.TUESDAY.getValue
      case "FR" => DayOfWeek.TUESDAY.getValue
      case "SA" => DayOfWeek.TUESDAY.getValue
      case "SU" => DayOfWeek.TUESDAY.getValue
    }
  }


}
