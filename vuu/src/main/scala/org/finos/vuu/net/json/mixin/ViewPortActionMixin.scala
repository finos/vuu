package org.finos.vuu.net.json.mixin

import com.fasterxml.jackson.annotation.JsonSubTypes.Type
import com.fasterxml.jackson.annotation.{JsonSubTypes, JsonTypeInfo}
import org.finos.vuu.viewport.{CloseDialogViewPortAction, NoAction, OpenDialogViewPortAction, ViewPortCreateSuccess, ViewPortRpcFailure, ViewPortRpcSuccess}

@JsonTypeInfo(
  use = JsonTypeInfo.Id.NAME,
  include = JsonTypeInfo.As.PROPERTY,
  property = "type"
)
@JsonSubTypes(Array(
  new Type(value = classOf[NoAction.type], name = "NO_ACTION"),
  new Type(value = classOf[OpenDialogViewPortAction], name = "OPEN_DIALOG_ACTION"),
  new Type(value = classOf[CloseDialogViewPortAction], name = "CLOSE_DIALOG_ACTION"),
  new Type(value = classOf[ViewPortRpcSuccess.type], name = "VP_RPC_SUCCESS"),
  new Type(value = classOf[ViewPortRpcFailure], name = "VP_RPC_FAILURE"),
  new Type(value = classOf[ViewPortCreateSuccess], name = "VP_CREATE_SUCCESS"),
))
trait ViewPortActionMixin { }