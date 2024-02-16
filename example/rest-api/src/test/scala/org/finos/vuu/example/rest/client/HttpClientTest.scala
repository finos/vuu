package org.finos.vuu.example.rest.client

import io.vertx.core.Vertx
import org.finos.vuu.example.rest.demoserver.{DemoRestServer, DemoRestServerOptions}
import org.finos.vuu.example.rest.model.Instrument
import org.scalatest.BeforeAndAfterAll
import org.scalatest.concurrent.Eventually
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers
import org.scalatest.time.{Seconds, Span}

import scala.util.{Success, Try}

class HttpClientTest extends AnyFeatureSpec with BeforeAndAfterAll with Matchers with Eventually {
  private final val PORT = 8091
  private final val HOST = "localhost"

  private val client = HttpClient(s"http://$HOST:$PORT")
  private val vertx = Vertx.vertx()

  override def beforeAll(): Unit = {
    val options = DemoRestServerOptions(PORT, HOST)
    vertx.deployVerticle(new DemoRestServer(options))
    eventually(timeout(Span(1, Seconds)))(vertx.deploymentIDs.size shouldEqual 1)
  }

  override def afterAll(): Unit = {
    vertx.close()
    eventually(timeout(Span(1, Seconds)))(vertx.deploymentIDs should have size 0)
  }

  Feature("client can connect to the demo-server") {
    Scenario("can return expected output when GET to a correct endpoint") {
      var res: Try[List[Instrument]] = Success(List.empty)

      client.get[List[Instrument]]("/instruments?limit=1015").apply {res = _}

      eventually(timeout(Span(2, Seconds)))(res.get should have length 1015)
    }

    Scenario("returns error when GET to a non-existent endpoint ") {
      var res: Try[List[Instrument]] = null

      client.get[List[Instrument]]("/hello-world").apply { res = _ }

      eventually(timeout(Span(2, Seconds)))(res.isFailure shouldEqual true)
    }

    Scenario("returns error when GET to a correct endpoint but errors while parsing body") {
      var res: Try[Instrument] = null

      client.get[Instrument]("/instruments?limit=1").apply { res = _ }

      eventually(timeout(Span(2, Seconds)))(res.isFailure shouldEqual true)
    }
  }
}
