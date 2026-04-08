package org.finos.vuu.example.rest.client

import org.finos.vuu.example.rest.model.Instrument
import org.finos.vuu.net.json.{JsonMapperFactory, JsonSerializer}
import sttp.client4.{UriContext, basicRequest}
import tools.jackson.core.`type`.TypeReference
import tools.jackson.databind.json.JsonMapper
import tools.jackson.module.scala.DefaultScalaModule

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
  val serializer = JsonSerializer[List[Instrument]]()

  def getInstruments(limit: Int): Try[List[Instrument]] = {
    val request = basicRequest.get(uri"$baseUrl/instruments?limit=$limit")

    Try(httpClient.fetch(request))
      .flatMap(res => res.body match {
        case Right(v) => Try(serializer.deserialize(v))
        case Left(v)  => Failure(new Exception(s"Server responded with error: status code ${res.code}, body: $v"))
      })
  }
}
