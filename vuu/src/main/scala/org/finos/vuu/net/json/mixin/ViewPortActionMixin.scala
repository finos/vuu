package org.finos.vuu.net.json.mixin

import com.fasterxml.jackson.annotation.JsonTypeInfo
import org.finos.vuu.net.json.{VsJsonTypeResolver, VsJsonTypeResolverRegistry}
import org.finos.vuu.viewport.{CloseDialogViewPortAction, NoAction, OpenDialogViewPortAction, ViewPortCreateSuccess, ViewPortRpcFailure, ViewPortRpcSuccess}
import tools.jackson.databind.annotation.JsonTypeIdResolver

@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = "type")
@JsonTypeIdResolver(classOf[VsJsonTypeResolver])
trait ViewPortActionMixin { }

object ViewPortActionMixin {

  def registerTypes(): Unit = {
    VsJsonTypeResolverRegistry.register("NO_ACTION", classOf[NoAction])
    VsJsonTypeResolverRegistry.register("OPEN_DIALOG_ACTION", classOf[OpenDialogViewPortAction])
    VsJsonTypeResolverRegistry.register("CLOSE_DIALOG_ACTION", classOf[CloseDialogViewPortAction])
    VsJsonTypeResolverRegistry.register("VP_RPC_SUCCESS", classOf[ViewPortRpcSuccess])
    VsJsonTypeResolverRegistry.register("VP_RPC_FAILURE", classOf[ViewPortRpcFailure])
    VsJsonTypeResolverRegistry.register("VP_CREATE_SUCCESS", classOf[ViewPortCreateSuccess])
  }

}
