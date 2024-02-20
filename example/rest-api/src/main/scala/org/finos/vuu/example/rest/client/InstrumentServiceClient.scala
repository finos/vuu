package org.finos.vuu.example.rest.client

import org.finos.toolbox.json.JsonUtil
import org.finos.vuu.example.rest.model.Instrument
import sttp.client4.{UriContext, basicRequest}

import scala.util.{Failure, Try}

trait InstrumentServiceClient {
  def getInstruments(limit: Int): Try[List[Instrument]]
}

object InstrumentServiceClient {
  def apply(httpClient: HttpClient, baseUrl: String): InstrumentServiceClient = {
    new InstrumentServiceClientImpl(httpClient, baseUrl)
  }
}

private class InstrumentServiceClientImpl(httpClient: HttpClient, baseUrl: String) extends InstrumentServiceClient {
  def getInstruments(limit: Int): Try[List[Instrument]] = {
    val request = basicRequest.get(uri"$baseUrl/instruments?limit=$limit")

    Try(httpClient.fetch(request))
      .flatMap(res => res.body match {
        case Right(v) => Try(JsonUtil.fromJson[List[Instrument]](v))
        case Left(v)  => Failure(new Exception(s"Server responded with error: status code ${res.code}, body: $v"))
      })
  }
}
