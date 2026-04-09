package org.finos.vuu.example.rest.client

import org.finos.vuu.example.rest.model.{Instrument, RandomInstrument}
import org.finos.vuu.net.json.JsonSerializer
import sttp.client4.SyncBackend
import sttp.client4.testing.{ResponseStub, SyncBackendStub}
import sttp.model.Method

object StubbedBackend {
  private final val DEFAULT_LIMIT = 10_000
  private val serializer = JsonSerializer[List[Instrument]]()

  def apply(): SyncBackend = {
    SyncBackendStub
      .whenRequestMatches(req => req.method == Method.GET && req.uri.path.endsWith(List("instruments")))
      .thenRespondF(req => {
        val limit = req.uri.params.get("limit").flatMap(_.toIntOption).getOrElse(DEFAULT_LIMIT)
        ResponseStub.adjust(serializer.serialize(RandomInstrument.create(size = limit)))
      })
      .whenAnyRequest.thenRespondNotFound()
  }

}
