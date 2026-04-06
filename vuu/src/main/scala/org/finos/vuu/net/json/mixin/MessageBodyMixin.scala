package org.finos.vuu.net.json.mixin

import com.fasterxml.jackson.annotation.JsonTypeInfo
import tools.jackson.databind.annotation.JsonTypeIdResolver
import org.finos.vuu.net.json.VsJsonTypeResolver

@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = "type")
@JsonTypeIdResolver(classOf[VsJsonTypeResolver])
trait MessageBodyMixin { }
