package org.finos.vuu.net.json.mixin

import org.finos.vuu.net.JsonViewServerMessage
import tools.jackson.databind.annotation.JsonDeserialize

@JsonDeserialize(as = classOf[JsonViewServerMessage])
trait ViewServerMessageMixin { }
