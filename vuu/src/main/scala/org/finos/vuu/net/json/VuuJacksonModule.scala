package org.finos.vuu.net.json

import org.finos.vuu.net.json.mixin.{MessageBodyMixin, RowUpdateMixin, RpcContextMixin, RpcResultMixin, UIActionMixin, ViewPortActionMixin, ViewPortMenuMixin}
import org.finos.vuu.net.rpc.{RpcResult, RpcContext}
import org.finos.vuu.net.MessageBody
import org.finos.vuu.net.ui.UIAction
import org.finos.vuu.net.row.RowUpdate
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

}
