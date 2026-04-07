package org.finos.vuu.net.json.mixin

import com.fasterxml.jackson.annotation.JsonSubTypes.Type
import com.fasterxml.jackson.annotation.{JsonSubTypes, JsonTypeInfo}
import org.finos.vuu.net.rpc.{RpcErrorResult, RpcSuccessResult}
import tools.jackson.databind.annotation.JsonTypeIdResolver

@JsonTypeInfo(
  use = JsonTypeInfo.Id.NAME,
  include = JsonTypeInfo.As.PROPERTY,
  property = "type"
)
@JsonSubTypes(Array(
  new Type(value = classOf[RpcSuccessResult], name = "SUCCESS_RESULT"),
  new Type(value = classOf[RpcErrorResult], name = "ERROR_RESULT")
))
trait RpcResultMixin { }
