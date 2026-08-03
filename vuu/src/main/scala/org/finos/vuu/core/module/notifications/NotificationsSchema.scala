package org.finos.vuu.core.module.notifications

import org.finos.vuu.core.module.ModuleFactory.stringToString
import org.finos.vuu.core.table.{Column, Columns}

object NotificationsSchema {
  val Id = "id".string()
  val Type = "type".string()
  val ExpiryTime = "expiryTime".epochTimestamp()
  val Title = "title".string()
  val Message = "message".string()
  val Level = "level".string()
  val Audience = "audience".string()

  private final val genericColumns: Array[String] = Array(Id, Type, ExpiryTime, Title, Message, Level, Audience)

  def allFrom(): Array[Column] = Columns.fromNames(genericColumns)

  def allFrom(additionalColumns: Array[String]): Array[Column] =
    Columns.fromNames(genericColumns ++ additionalColumns)

  def allFrom(additionalColumns: String*): Array[Column] =
    Columns.fromNames((genericColumns ++ additionalColumns).toArray)
}