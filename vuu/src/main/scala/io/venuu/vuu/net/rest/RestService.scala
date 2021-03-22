package io.venuu.vuu.net.rest

import io.vertx.ext.web.RoutingContext

trait RestService {
  def getServiceName: String
  def getUriGetAll: String
  def getUriGet: String
  def getUriPost: String
  def getUriDelete: String
  def getUriPut: String

  def onGetAll(ctx: RoutingContext): Unit
  def onPost(ctx: RoutingContext): Unit
  def onGet(ctx: RoutingContext): Unit
  def onPut(ctx: RoutingContext): Unit
  def onDelete(ctx: RoutingContext): Unit

  def reply404(ctx: RoutingContext): Unit = {
    ctx.response().setStatusCode(404).end()
  }

}
