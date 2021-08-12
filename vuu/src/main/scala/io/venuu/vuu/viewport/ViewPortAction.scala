package io.venuu.vuu.viewport

import com.fasterxml.jackson.annotation.JsonSubTypes.Type
import com.fasterxml.jackson.annotation.{JsonSubTypes, JsonTypeInfo}
import com.fasterxml.jackson.databind.annotation.JsonTypeIdResolver
import io.venuu.vuu.net.rpc.VsJsonTypeResolver

@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = "type")
@JsonTypeIdResolver(classOf[VsJsonTypeResolver])
trait ViewPortAction {}

case class NoAction() extends ViewPortAction
case class OpenDialogViewPortAction(tableName: String) extends ViewPortAction
case class CloseDialogViewPortAction(vpId: String) extends ViewPortAction

@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = "type")
@JsonSubTypes(Array(
  new Type(value = classOf[OpenDialogViewPortAction], name = "OPEN_DIALOG_ACTION"),
  new Type(value = classOf[CloseDialogViewPortAction], name = "CLOSE_DIALOG_ACTION"),
  new Type(value = classOf[NoAction], name = "NO_ACTION")
))
trait ViewPortActionMixin{}
