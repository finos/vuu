package org.finos.vuu.example.rest.client

import com.fasterxml.jackson.databind.json.JsonMapper
import com.fasterxml.jackson.module.scala.{ClassTagExtensions, DefaultScalaModule, JavaTypeable}
import io.vertx.core.Vertx
import io.vertx.core.buffer.Buffer
import io.vertx.ext.web.client.{HttpResponse, WebClient}
import io.vertx.uritemplate.UriTemplate
import org.finos.vuu.example.rest.client.HttpClient.Handler
import org.finos.vuu.example.rest.client.VertXClient.{parseResponseBody, rawClient}

import scala.util.{Failure, Try}

trait HttpClient {
  def get[T: JavaTypeable](requestUri: String): Handler[T] => Unit
}

object HttpClient {
  type Handler[T] = Try[T] => Unit
  def apply(baseUrl: String): HttpClient = {
    new VertXClient(baseUrl)
  }
}

object VertXClient {
  private val rawClient = WebClient.create(Vertx.vertx())
  private val objectMapper = JsonMapper
    .builder()
    .addModule(DefaultScalaModule)
    .build() :: ClassTagExtensions

  def parseResponseBody[T: JavaTypeable](res: HttpResponse[Buffer]): Try[T] =
    for {
      bodyAsStr <- Try(res.body.toJson.toString)
      result    <- Try(objectMapper.readValue[T](bodyAsStr))
    } yield result
}

class VertXClient(baseUrl: String) extends HttpClient {
  override def get[T: JavaTypeable](requestUri: String): Handler[T] => Unit = {
    handler => rawClient
      .getAbs(UriTemplate.of(baseUrl + requestUri))
      .send()
      .onSuccess(res => handler(parseResponseBody[T](res)))
      .onFailure(cause => handler(Failure(cause)))
  }
}
