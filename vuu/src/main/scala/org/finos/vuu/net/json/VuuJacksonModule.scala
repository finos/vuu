package org.finos.vuu.net.json

import org.finos.vuu.core.auths.VuuUser
import org.finos.vuu.net.json.mixin.{MessageBodyMixin, RowUpdateMixin, RpcContextMixin, RpcResultMixin, UIActionMixin, ViewPortActionMixin, ViewPortMenuMixin, ViewServerMessageMixin, VuuUserMixin}
import org.finos.vuu.net.row.RowUpdate
import org.finos.vuu.net.rpc.{RpcContext, RpcResult}
import org.finos.vuu.net.ui.UIAction
import org.finos.vuu.net.{MessageBody, ViewServerMessage}
import org.finos.vuu.viewport.{ViewPortAction, ViewPortMenu}
import tools.jackson.databind.module.SimpleModule

class VuuJacksonModule extends SimpleModule {

  setMixInAnnotation(classOf[ViewPortMenu], classOf[ViewPortMenuMixin])
  setMixInAnnotation(classOf[ViewPortAction], classOf[ViewPortActionMixin])
  setMixInAnnotation(classOf[RowUpdate], classOf[RowUpdateMixin])
  setMixInAnnotation(classOf[UIAction], classOf[UIActionMixin])
  setMixInAnnotation(classOf[RpcContext], classOf[RpcContextMixin])
  setMixInAnnotation(classOf[RpcResult], classOf[RpcResultMixin])
  setMixInAnnotation(classOf[MessageBody], classOf[MessageBodyMixin])
  setMixInAnnotation(classOf[VuuUser], classOf[VuuUserMixin])
  setMixInAnnotation(classOf[ViewServerMessage], classOf[ViewServerMessageMixin])

}
