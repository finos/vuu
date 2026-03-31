package org.finos.vuu.net.json.mixin

import com.fasterxml.jackson.annotation.JsonTypeInfo
import org.finos.vuu.net.json.VsJsonTypeResolver
import org.finos.vuu.net.{RpcErrorResult, RpcSuccessResult}
import tools.jackson.databind.annotation.JsonTypeIdResolver

@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = "type")
@JsonTypeIdResolver(classOf[VsJsonTypeResolver])
trait RpcResultMixin {

}
