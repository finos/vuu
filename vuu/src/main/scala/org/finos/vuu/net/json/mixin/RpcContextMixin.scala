package org.finos.vuu.net.json.mixin

import com.fasterxml.jackson.annotation.JsonSubTypes.Type
import com.fasterxml.jackson.annotation.{JsonSubTypes, JsonTypeInfo}
import org.finos.vuu.net.rpc.{GlobalContext, ViewPortContext, ViewPortRowContext}
import tools.jackson.databind.annotation.JsonTypeIdResolver

@JsonTypeInfo(
  use = JsonTypeInfo.Id.NAME,
  include = JsonTypeInfo.As.PROPERTY,
  property = "type"
)
@JsonSubTypes(Array(
  new Type(value = classOf[GlobalContext.type], name = "GLOBAL_CONTEXT"),
  new Type(value = classOf[ViewPortContext], name = "VIEWPORT_CONTEXT"),
  new Type(value = classOf[ViewPortRowContext], name = "VIEWPORT_ROW_CONTEXT")
))
trait RpcContextMixin { }


