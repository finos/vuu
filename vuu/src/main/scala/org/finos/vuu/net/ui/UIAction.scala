package org.finos.vuu.net.ui

sealed trait UIAction { }

object NoneAction extends UIAction

case class ShowNotificationAction(notificationType: NotificationType, title: String, message: String) extends UIAction

