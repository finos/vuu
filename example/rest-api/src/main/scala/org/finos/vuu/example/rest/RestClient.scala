package org.finos.vuu.example.rest

import org.finos.vuu.example.rest.client.Http4sBlazeClient
import org.finos.vuu.example.rest.model.Instrument

trait RestClient {
  def getInstruments: List[Instrument]
}

object RestClient {
  def apply(baseUrl: String): RestClient = {
    Http4sBlazeClient(baseUrl)
  }
}
