package org.finos.vuu.example.rest.demoserver

import cats.data.Kleisli
import cats.effect.{ExitCode, IO, IOApp}
import org.finos.vuu.example.rest.demoserver.DemoRestService.instrumentService
import org.http4s._
import org.http4s.blaze.server.BlazeServerBuilder
import org.http4s.server.Router

object DemoRestServer extends IOApp {
  private val app: Kleisli[IO, Request[IO], Response[IO]] = Router(
    "/" -> instrumentService
  ).orNotFound

  def server(port: Int = 8080, host: String = "localhost"): BlazeServerBuilder[IO] =
    BlazeServerBuilder[IO]
      .bindHttp(port, host)
      .withHttpApp(app)

  def run(args: List[String]): IO[ExitCode] =
    server()
      .resource
      .useForever
      .as(ExitCode.Success)
}
