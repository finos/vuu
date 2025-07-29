package org.finos.vuu.example.rest.client

import org.finos.toolbox.json.JsonUtil
import org.finos.vuu.example.rest.model.RandomInstrument
import sttp.client4.SyncBackend
import sttp.client4.testing.{ResponseStub, SyncBackendStub}
import sttp.model.Method

object StubbedBackend {
  private final val DEFAULT_LIMIT = 10_000

  def apply(): SyncBackend = {
    SyncBackendStub
      .whenRequestMatches(req => req.method == Method.GET && req.uri.path.endsWith(List("instruments")))
      .thenRespondF(req => {
        val limit = req.uri.params.get("limit").flatMap(_.toIntOption).getOrElse(DEFAULT_LIMIT)
        ResponseStub.adjust(JsonUtil.toRawJson(RandomInstrument.create(size = limit)))
      })
      .whenAnyRequest.thenRespondNotFound()
  }

}
