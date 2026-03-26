package org.finos.vuu.http2.server

import org.finos.vuu.http2.server.config.VuuHttp2ServerOptions
import org.finos.vuu.net.http.{HttpServer, HttpServerFactory}
import org.finos.vuu.net.rest.RestService

class VuuHttp2ServerFactory(val options: VuuHttp2ServerOptions) extends HttpServerFactory {

  override def create(services: List[RestService]): HttpServer = Http2Server(options, services)
  
}
