package org.finos.vuu.http2.server

import org.finos.vuu.http2.server.config.VuuHttp2ServerOptions
import org.finos.vuu.net.http.{HttpServer, HttpServerFactory}
import org.finos.vuu.net.rest.RestService

trait VuuHttp2ServerFactory extends HttpServerFactory

object VuuHttp2ServerFactory {

  def apply() = VuuHttp2ServerFactoryImpl(VuuHttp2ServerOptions())

  def apply(options: VuuHttp2ServerOptions) = VuuHttp2ServerFactoryImpl(options)

}

private case class VuuHttp2ServerFactoryImpl(options: VuuHttp2ServerOptions) extends HttpServerFactory {

  override def create(services: List[RestService]): HttpServer = Http2Server(options, services)
  
}
