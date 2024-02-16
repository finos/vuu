package org.finos.vuu.example.rest.demoserver

import org.finos.vuu.example.rest.model.RandomInstrument
import io.vertx.core.json.JsonArray
import io.vertx.core.{Handler, Vertx}
import io.vertx.ext.web.{Router, RoutingContext}
import org.finos.toolbox.json.JsonUtil

import scala.util.Try

object InstrumentRouter {
  final val DEFAULT_LIMIT = 1000

  def get(vertx: Vertx): Router = {
    val router = Router.router(vertx)
    router.get().handler(getAllHandler)
    router
  }

  private def getAllHandler: Handler[RoutingContext] = {
    ctx => {
      val limit = Try(ctx.queryParam("limit").get(0).toInt).getOrElse(DEFAULT_LIMIT)
      ctx.json(new JsonArray(JsonUtil.toRawJson(RandomInstrument.create(size = limit))))
    }
  }
}
