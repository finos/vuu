package io.venuu.vuu.viewport

object NoAction extends ViewPortAction

trait ViewPortAction {}

case class OpenDialogViewPortAction(tableName: String) extends ViewPortAction
case class CloseDialogViewPortAction(vpId: String) extends ViewPortAction

