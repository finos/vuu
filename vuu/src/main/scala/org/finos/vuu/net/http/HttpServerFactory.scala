package org.finos.vuu.net.http

import org.finos.vuu.net.rest.RestService

trait HttpServerFactory {

  def create(services: List[RestService]) : HttpServer

}

object NoHttpServerFactory extends HttpServerFactory {

  def create(services: List[RestService]): HttpServer = NoHttpServer

}


