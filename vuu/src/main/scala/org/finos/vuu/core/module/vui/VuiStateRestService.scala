package org.finos.vuu.core.module.vui

import io.vertx.ext.web.RoutingContext
import org.finos.toolbox.json.JsonUtil
import org.finos.toolbox.time.Clock
import org.finos.vuu.net.rest.RestService
import org.finos.vuu.state.{VuiHeader, VuiJsonState, VuiState, VuiStateStore}

class VuiStateRestService(val store: VuiStateStore)(implicit clock: Clock) extends RestService {

  private final val service = "vui"

  override def getServiceName: String = service

  override def getUriGetAll: String = s"/api/$service/:user"

  override def getUriGet: String = s"/api/$service/:user/:id"

  override def getUriPost: String = s"/api/$service/:user"

  override def getUriDelete: String = s"/api/$service/:user/:id"

  override def getUriPut: String = s"/api/$service/:user/:id"

  override def onGetAll(ctx: RoutingContext): Unit = {
    val user = ctx.request().getParam("user")
    if (user == null) {
      reply404(ctx)
    } else {
      val states = store.getAllFor(user)
      val json = JsonUtil.toPrettyJson(states)
      ctx.response()
        .putHeader("content-type", "application/json; charset=utf-8")
        .end(json)
    }
  }

  override def onPost(ctx: RoutingContext): Unit = {
    val user = ctx.request().getParam("user")
    val id = "latest"
    val json = ctx.body().asString()

    if (user == null || id == null || json == null) {
      reply404(ctx)
    } else {
      store.add(VuiState(VuiHeader(user, id, user + "." + id, clock.now()), VuiJsonState(json)))
      ctx.response()
        .setStatusCode(201)
        .putHeader("content-type", "application/json; charset=utf-8")
        .end(json);
    }
  }

  override def onGet(ctx: RoutingContext): Unit = {
    val user = ctx.request().getParam("user")
    val id = ctx.request().getParam("id")
    if (user == null || id == null) {
      ctx.response().setStatusCode(404).end()
    } else {
      store.get(user, id) match {
        case Some(state) =>
          ctx.response()
            .putHeader("content-type", "application/json; charset=utf-8")
            .end(state.json.json);
        case None =>
          reply404(ctx)
      }
    }
  }

  override def onPut(ctx: RoutingContext): Unit = {
    val user = ctx.request().getParam("user")
    val id = ctx.request().getParam("id")
    val json = ctx.body().asString()
    if (user == null || id == null || json == null) {
      reply404(ctx)
    } else {
      store.add(VuiState(VuiHeader(user, id, user + "." + id, clock.now()), VuiJsonState(json)))
      ctx.response()
        .setStatusCode(201)
        .putHeader("content-type", "application/json; charset=utf-8")
        .end(json);
    }
  }

  override def onDelete(ctx: RoutingContext): Unit = {
    val user = ctx.request().getParam("user")
    val id = ctx.request().getParam("id")
    if (user == null || id == null) {
      reply404(ctx)
    } else {
      store.delete(user, id)
      ctx.response.setStatusCode(204).end()
    }
  }
}
