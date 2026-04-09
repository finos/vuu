package org.finos.vuu.net.json.mixin

import tools.jackson.databind.annotation.JsonDeserialize
import org.finos.vuu.core.auths.VuuUserImpl

@JsonDeserialize(as = classOf[VuuUserImpl])
trait VuuUserMixin { }
