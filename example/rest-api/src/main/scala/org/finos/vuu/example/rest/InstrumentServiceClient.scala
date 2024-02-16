package org.finos.vuu.example.rest

import org.finos.toolbox.json.JsonUtil
import org.finos.vuu.example.rest.client.{ClientResponse, HttpClient}
import org.finos.vuu.example.rest.client.HttpClient.Handler
import org.finos.vuu.example.rest.model.Instrument

import scala.util.{Failure, Try}

trait InstrumentServiceClient {
  def getInstruments(limit: Int)(handler: Try[List[Instrument]] => Unit): Unit
}

private class InstrumentServiceClientImpl(httpClient: HttpClient) extends InstrumentServiceClient {
  def getInstruments(limit: Int)(handler: Handler[List[Instrument]]): Unit = {
    httpClient.get(s"/instruments?limit=$limit") { res =>
      val instruments = res.flatMap({
        case ClientResponse(body, 200) => Try(JsonUtil.fromJson[List[Instrument]](body))
        case ClientResponse(_, code) => Failure(new Exception(s"Error occurred with status code: $code, expected 200"))
      })
      handler(instruments)
    }
  }
}

object InstrumentServiceClient {
  def apply(httpClient: HttpClient): InstrumentServiceClient = {
    new InstrumentServiceClientImpl(httpClient)
  }
}
