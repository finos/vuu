package org.finos.vuu.net.rest

import io.vertx.ext.web.RoutingContext

class EchoRestService extends RestService {

  val echoParam = "message"

  val echoUri = s"/api/echo/:$echoParam"

  override def getServiceName: String = "EchoService"

  override def getUriGetAll: String = echoUri

  override def getUriGet: String = echoUri

  override def getUriPost: String = echoUri

  override def getUriDelete: String = echoUri

  override def getUriPut: String = echoUri

  override def onGetAll(ctx: RoutingContext): Unit = echoBack(ctx)

  override def onPost(ctx: RoutingContext): Unit = echoBack(ctx)

  override def onGet(ctx: RoutingContext): Unit = echoBack(ctx)

  override def onPut(ctx: RoutingContext): Unit = echoBack(ctx)

  override def onDelete(ctx: RoutingContext): Unit = echoBack(ctx)

  private def echoBack(ctx: RoutingContext): Unit = {
    val message = ctx.request().getParam(echoParam)
    if (message == null) {
      reply404(ctx)
    } else {
      ctx.response()
        .putHeader("content-type", "text/plain")
        .end(message)
    }
  }

}
