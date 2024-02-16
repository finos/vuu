package org.finos.vuu.example.rest.client

import org.finos.toolbox.json.JsonUtil
import org.finos.vuu.example.rest.TestUtils.jsonArrayRegex
import org.finos.vuu.example.rest.client.FakeHttpClient.UnsupportedEndpointException
import org.finos.vuu.example.rest.model.Instrument
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers
import org.scalatest.prop.TableDrivenPropertyChecks._

import scala.util.Try

class FakeHttpClientTest extends AnyFeatureSpec with Matchers {
  private val fakeHttpClient = FakeHttpClient()

  Feature("get") {
     Scenario("supports /instruments endpoint") {
       var response: Try[ClientResponse] = null

       fakeHttpClient.get("/instruments?limit=2") { response = _ }

       response.get.body should include regex jsonArrayRegex(2)
       JsonUtil.fromJson[List[Instrument]](response.get.body).head shouldBe a [Instrument]
     }

     Scenario("returns failure when unsupported endpoint") {
       var response: Try[ClientResponse] = null

       fakeHttpClient.get("/unsupported-endpoint") { response = _ }

       response.isFailure shouldEqual true
       response.failed.get shouldBe a [UnsupportedEndpointException]
     }
   }

  Feature("EndpointRegex") {
    forAll(Table(
      ("url", "expected"),
      ("/instruments", true),
      ("/instruments/", true),
      ("/instruments?", true),
      ("/instruments?limit=100", true),
      ("/hello-world", false),
      ("/instrumentsX", false),
    ))((url, expected) => {
      Scenario(s"instruments endpoint regex should return $expected when passed url is $url") {
        EndpointRegex.instruments.matches(url) shouldEqual expected
      }
    })
  }
}
