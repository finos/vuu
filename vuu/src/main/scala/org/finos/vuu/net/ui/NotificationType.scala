package org.finos.vuu.net.ui

enum NotificationType {
  case Error
  case Warning
  case Info
}

object NotificationType {

  //Java consumers
  val ERROR: NotificationType = NotificationType.Error
  val WARNING: NotificationType = NotificationType.Warning
  val INFO: NotificationType = NotificationType.Info

}