package org.finos.vuu.http2.server.vertx

import io.vertx.ext.web.RoutingContext
import org.finos.vuu.net.rest.RestContext

import scala.jdk.CollectionConverters.*

class VertxRestContext(val rc: RoutingContext) extends RestContext {

  override def pathParams: Map[String, String] =
    rc.pathParams().asScala.toMap

  override def queryParams: Map[String, String] =
    rc.queryParams().asScala
      .map(entry => entry.getKey -> entry.getValue)
      .toMap

  override def body: Option[String] =
    Option(rc.body().asString())

  override def respond(status: Int, body: String, headers: Map[String, String] = Map.empty): Unit = {
    val response = rc.response().setStatusCode(status)
    headers.foreach(f => response.putHeader(f._1, f._2))
    response.end(body)
  }
  
}
