package org.finos.vuu.net.json.mixin

import com.fasterxml.jackson.annotation.JsonTypeInfo
import org.finos.vuu.net.json.{VsJsonTypeResolver, VsJsonTypeResolverRegistry}
import org.finos.vuu.net.{GlobalContext, ViewPortContext, ViewPortRowContext}
import tools.jackson.databind.annotation.JsonTypeIdResolver

@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = "type")
@JsonTypeIdResolver(classOf[VsJsonTypeResolver])
trait RpcContextMixin {

}

object RpcContextMixin {
  
  VsJsonTypeResolverRegistry.register("GLOBAL_CONTEXT", GlobalContext.getClass)
  VsJsonTypeResolverRegistry.register("VIEWPORT_CONTEXT", classOf[ViewPortContext])
  VsJsonTypeResolverRegistry.register("VIEWPORT_ROW_CONTEXT", classOf[ViewPortRowContext])
  
}

