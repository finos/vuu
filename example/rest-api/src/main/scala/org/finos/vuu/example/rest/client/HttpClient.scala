package org.finos.vuu.example.rest.client

import io.vertx.core.Vertx
import io.vertx.ext.web.client.WebClient
import io.vertx.uritemplate.UriTemplate
import org.finos.vuu.example.rest.client.HttpClient.Handler

import java.nio.charset.Charset
import scala.util.{Failure, Success, Try}

trait HttpClient {
  def get(requestUri: String): Handler[ClientResponse] => Unit
}

object HttpClient {
  type Handler[T] = Try[T] => Unit
  def apply(baseUrl: String, mock: Boolean = false): HttpClient = {
    if (mock) FakeHttpClient() else VertXClient(baseUrl)
  }
}

private object VertXClient {
  private val rawClient = WebClient.create(Vertx.vertx())

  def apply(baseUrl: String): VertXClient = {
    new VertXClient(rawClient, baseUrl)
  }
}

private class VertXClient(rawClient: WebClient, baseUrl: String) extends HttpClient {
  override def get(requestUri: String): Handler[ClientResponse] => Unit = {
    handler => rawClient
      .getAbs(UriTemplate.of(baseUrl + requestUri))
      .send()
      .onSuccess(res => {
        val bodyStr = Try(res.body.toString(Charset.forName("UTF-8"))).getOrElse("")
        handler(Success(ClientResponse(bodyStr, res.statusCode())))
      })
      .onFailure(cause => handler(Failure(cause)))
  }
}

case class ClientResponse(body: String, statusCode: Int)
