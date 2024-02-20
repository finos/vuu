package org.finos.vuu.example.rest.client

import org.finos.toolbox.json.JsonUtil
import org.finos.vuu.example.rest.TestUtils.jsonArrayRegex
import org.finos.vuu.example.rest.model.Instrument
import org.scalatest.BeforeAndAfterAll
import org.scalatest.concurrent.Eventually
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers
import sttp.client4.{UriContext, basicRequest}
import sttp.model.StatusCode

class HttpClientTest extends AnyFeatureSpec with BeforeAndAfterAll with Matchers with Eventually {
  Feature("Stubbed backend") {
    val httpClient = HttpClient(StubbedBackend())

    Scenario("returns with correct response on /instruments GET endpoint") {
      val req = basicRequest.get(uri"some-url.com/instruments?limit=3")

      val res = httpClient.fetch(req)

      res.body.isRight shouldBe true
      res.body.toOption.get should include regex jsonArrayRegex(3)
      JsonUtil.fromJson[List[Instrument]](res.body.toOption.get).head shouldBe a [Instrument]
    }

    Scenario("returns 404 when no endpoint matched") {
      val req = basicRequest.get(uri"some-url.com/some-endpoint")

      val res = httpClient.fetch(req)

      res.code shouldEqual StatusCode(404)
    }
  }
}
