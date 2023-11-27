package org.finos.vuu.viewport

import com.fasterxml.jackson.annotation.JsonSubTypes.Type
import com.fasterxml.jackson.annotation.{JsonSubTypes, JsonTypeInfo}
import com.fasterxml.jackson.databind.annotation.JsonTypeIdResolver
import org.finos.vuu.net.rpc.VsJsonTypeResolver

@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = "type")
@JsonTypeIdResolver(classOf[VsJsonTypeResolver])
trait ViewPortAction {}



case class NoAction() extends ViewPortAction

case class OpenDialogViewPortAction(table: ViewPortTable, renderComponent: String = "grid") extends ViewPortAction


case class CloseDialogViewPortAction(vpId: String) extends ViewPortAction

@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = "type")
@JsonSubTypes(Array(
  new Type(value = classOf[OpenDialogViewPortAction], name = "OPEN_DIALOG_ACTION"),
  new Type(value = classOf[CloseDialogViewPortAction], name = "CLOSE_DIALOG_ACTION"),
  new Type(value = classOf[NoAction], name = "NO_ACTION"),
  new Type(value = classOf[ViewPortEditSuccess], name = "VP_EDIT_SUCCESS"),
  new Type(value = classOf[ViewPortEditFailure], name = "VP_EDIT_FAIL"),
  new Type(value = classOf[ViewPortRpcFailure], name = "VP_RPC_FAILURE")
  new Type(value = classOf[ViewPortRpcSuccess], name = "VP_RCP_SUCCESS"),
  new Type(value = classOf[ViewPortRpcFailure], name = "VP_RCP_FAIL"),
))
trait ViewPortActionMixin {}
