package org.finos.vuu.http2.server

import io.vertx.core.{Vertx, VertxOptions}
import org.finos.vuu.http2.server.config.VuuHttp2ServerOptions
import org.finos.vuu.http2.server.vertx.VertxHttp2Server
import org.finos.vuu.net.http.HttpServer
import org.finos.vuu.net.rest.RestService

trait Http2Server extends HttpServer {

  def isRunning: Boolean

  def getPort: Int

}

object Http2Server {

  def apply(options: VuuHttp2ServerOptions): Http2Server = {
    Http2ServerImpl(options)
  }

  def apply(options: VuuHttp2ServerOptions, services: List[RestService]): Http2Server = {
    Http2ServerImpl(options, services)
  }

}

private case class Http2ServerImpl(options: VuuHttp2ServerOptions = VuuHttp2ServerOptions(),
                                   services: List[RestService] = List.empty) extends Http2Server {

  private final val vertxHttp2Server = new VertxHttp2Server(options, services)
  private val vertx = Vertx.vertx(new VertxOptions())

  override def doStart(): Unit = {
    vertx.deployVerticle(vertxHttp2Server)
      .toCompletionStage
      .toCompletableFuture
      .get()
  }

  override def doStop(): Unit = {
    vertx.close()
  }

  override def doInitialize(): Unit = {
    //Nothing to do
  }

  override def doDestroy(): Unit = {
    //Nothing to do
  }

  override val lifecycleId: String = "Http2ServerImpl"

  override def isRunning: Boolean = vertxHttp2Server.isRunning

  override def getPort: Int = vertxHttp2Server.getPort

}
