package org.finos.vuu.example.rest.client

import org.finos.toolbox.json.JsonUtil
import org.finos.toolbox.json.JsonUtil.toRawJson
import org.scalatest.prop.TableDrivenPropertyChecks._
import org.finos.vuu.example.rest.model.RandomInstrument
import org.scalamock.scalatest.MockFactory
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers
import org.scalatest.prop.TableDrivenPropertyChecks.forAll
import sttp.client4.testing.{ResponseStub, SyncBackendStub}
import sttp.model.StatusCode

class InstrumentServiceClientTest extends AnyFeatureSpec with Matchers with MockFactory {
  private final val BASE_URL = "base-url.com"

  Feature("getInstruments") {
    Scenario("can make an external call and parse response WHEN service responds as expected") {
      val responseSize = 2
      val instruments = RandomInstrument.create(size = responseSize)

      val stubbedBackend = SyncBackendStub
        .whenRequestMatches(req => req.uri.path.endsWith(List("instruments")) && req.uri.params.get("limit").get == "2")
        .thenRespond(ResponseStub.adjust(toRawJson(instruments)))

      val instrumentsClient = InstrumentServiceClient(HttpClient(stubbedBackend), BASE_URL)
      val res = instrumentsClient.getInstruments(limit = responseSize)

      res.isSuccess shouldEqual true
      res.get shouldEqual instruments
    }

    forAll(Table(
      ("error-code", "msg"),
      (404, "Resource not found"),
      (500, "Internal server error"),
      (400, "Bad request"),
    ))((errorCode, msg) => {
      Scenario(s"returns Failure with error WHEN server responds with an error: (code = $errorCode, msg = $msg)") {
        val stubbedBackend = SyncBackendStub.whenAnyRequest.thenRespond(ResponseStub.adjust(msg, StatusCode(errorCode)))

        val instrumentsClient = InstrumentServiceClient(HttpClient(stubbedBackend), BASE_URL)
        val res = instrumentsClient.getInstruments(limit = 1)

        res.isFailure shouldEqual true
        res.failed.get.getMessage should include regex s"code[:]? $errorCode.*body[:]? $msg"
      }
    })

    Scenario("returns Failure with the thrown exception WHEN request throws an exception") {
      val exceptionMsg = "Some network-level error"
      val stubbedBackend = SyncBackendStub.whenAnyRequest.thenRespond(throw new Exception(exceptionMsg))

      val instrumentsClient = InstrumentServiceClient(HttpClient(stubbedBackend), BASE_URL)
      val res = instrumentsClient.getInstruments(limit = 1)

      res.isFailure shouldEqual true
      res.failed.get.getMessage shouldEqual exceptionMsg
    }

    Scenario("returns Failure WHEN server responds with 200 but body is not parsable to instruments") {
      val notParsable = """[{"name": "instrument", "field": "abc"}]"""
      val stubbedBackend = SyncBackendStub.whenAnyRequest.thenRespond(ResponseStub.exact(notParsable))

      val instrumentsClient = InstrumentServiceClient(HttpClient(stubbedBackend), BASE_URL)
      val res = instrumentsClient.getInstruments(limit = 1)

      res.isFailure shouldEqual true
      res.failed.get shouldBe a [Exception]
    }
  }
}
