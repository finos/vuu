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

  private final val GenericColumns: Array[String] = Array(Id, Type, ExpiryTime, Title, Message, Level)

  def allFrom(): Array[Column] = Columns.fromNames(GenericColumns)

  def allFrom(additionalColumns: Array[String]): Array[Column] =
    Columns.fromNames(GenericColumns ++ additionalColumns)

  def allFrom(additionalColumns: String*): Array[Column] =
    Columns.fromNames((GenericColumns ++ additionalColumns).toArray)
}