package org.finos.vuu.viewport

sealed trait ViewPortAction {}

object NoAction extends ViewPortAction
case class OpenDialogViewPortAction(table: ViewPortTable, renderComponent: String = "grid") extends ViewPortAction
case class CloseDialogViewPortAction(vpId: String) extends ViewPortAction
object ViewPortRpcSuccess extends ViewPortAction
case class ViewPortRpcFailure(msg: String) extends ViewPortAction
case class ViewPortCreateSuccess(key:String) extends ViewPortAction


