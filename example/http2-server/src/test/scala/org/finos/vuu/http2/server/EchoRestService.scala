package org.finos.vuu.http2.server

import org.finos.vuu.net.rest.{RestContext, RestService, StringEncoder}

object EchoRestService extends RestService {

  val echoParam = "message"

  val echoUri = s"/api/echo/:$echoParam"

  override def getServiceName: String = "EchoService"

  override def getUriGetAll: String = echoUri

  override def getUriGet: String = echoUri

  override def getUriPost: String = echoUri

  override def getUriDelete: String = echoUri

  override def getUriPut: String = echoUri

  override def onGetAll(ctx: RestContext): Unit = echoBack(ctx)

  override def onPost(ctx: RestContext): Unit = echoBack(ctx)

  override def onGet(ctx: RestContext): Unit = echoBack(ctx)

  override def onPut(ctx: RestContext): Unit = echoBack(ctx)

  override def onDelete(ctx: RestContext): Unit = echoBack(ctx)

  private def echoBack(ctx: RestContext): Unit = {
    val message = ctx.pathParams.getOrElse(echoParam, null)
    if (message == null) {
      ctx.respond(404)
    } else {
      ctx.respond(200, message, StringEncoder)
    }
  }

}
