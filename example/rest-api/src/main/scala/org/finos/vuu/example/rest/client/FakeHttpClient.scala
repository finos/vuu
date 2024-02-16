package org.finos.vuu.example.rest.client

import org.finos.toolbox.json.JsonUtil.toRawJson
import org.finos.vuu.example.rest.client.FakeHttpClient.UnsupportedEndpointException
import org.finos.vuu.example.rest.client.HttpClient.Handler
import org.finos.vuu.example.rest.demoserver.InstrumentRouter.DEFAULT_LIMIT
import org.finos.vuu.example.rest.model.RandomInstrument

import scala.util.matching.Regex
import scala.util.{Failure, Success}

object FakeHttpClient {
  def apply(): FakeHttpClient = {
    new FakeHttpClient()
  }

  case class UnsupportedEndpointException(message: String) extends Exception(message)
}

class FakeHttpClient extends HttpClient {
  override def get(requestUri: String): Handler[ClientResponse] => Unit = {
    val response = requestUri match {
      case EndpointRegex.instruments(_, limit) =>
        val instruments = RandomInstrument.create(size = limit.toIntOption.getOrElse(DEFAULT_LIMIT))
        Success(ClientResponse(toRawJson(instruments), 200))
      case _ =>
        Failure(UnsupportedEndpointException(s"Endpoint $requestUri not supported by FakeHttpClient"))
    }
    handler => handler(response)
  }
}

object EndpointRegex {
  val instruments: Regex = "^/instruments/{0,2}\\??(limit=(\\d+))?$".r
}
