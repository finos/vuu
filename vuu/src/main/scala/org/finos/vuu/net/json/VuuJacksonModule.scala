package org.finos.vuu.net.json

import org.finos.vuu.net.json.mixin.{MessageBodyMixin, RowUpdateMixin, RpcContextMixin, RpcResultMixin, UIActionMixin, ViewPortActionMixin, ViewPortMenuMixin}
import org.finos.vuu.net.{MessageBody, RowUpdate, RpcContext, RpcResult, UIAction}
import org.finos.vuu.viewport.{ViewPortAction, ViewPortMenu}
import tools.jackson.databind.module.SimpleModule

class VuuJacksonModule extends SimpleModule {

  ViewPortActionMixin.registerTypes()

  setMixInAnnotation(classOf[ViewPortMenu], classOf[ViewPortMenuMixin])
  setMixInAnnotation(classOf[ViewPortAction], classOf[ViewPortActionMixin])
  setMixInAnnotation(classOf[RowUpdate], classOf[RowUpdateMixin])
  setMixInAnnotation(classOf[UIAction], classOf[UIActionMixin])
  setMixInAnnotation(classOf[RpcContext], classOf[RpcContextMixin])
  setMixInAnnotation(classOf[RpcResult], classOf[RpcResultMixin])
  setMixInAnnotation(classOf[MessageBody], classOf[MessageBodyMixin])

}
