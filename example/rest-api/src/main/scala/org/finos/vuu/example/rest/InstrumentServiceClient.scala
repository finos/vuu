package org.finos.vuu.example.rest

import org.finos.vuu.example.rest.client.HttpClient
import org.finos.vuu.example.rest.model.Instrument

import scala.util.Try

trait InstrumentServiceClient {
  def getInstruments(limit: Int)(handler: Try[List[Instrument]] => Unit): Unit
}

private class InstrumentServiceClientImpl(httpClient: HttpClient) extends InstrumentServiceClient {
  def getInstruments(limit: Int)(handler: Try[List[Instrument]] => Unit): Unit = {
    httpClient.get[List[Instrument]](s"/instruments?limit=$limit").apply(handler)
  }
}

object InstrumentServiceClient {
  def apply(httpClient: HttpClient): InstrumentServiceClient = {
    new InstrumentServiceClientImpl(httpClient)
  }
}
